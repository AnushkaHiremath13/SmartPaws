import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  name: string;
  filename: string;
  type: 'intake' | 'outcome' | 'location' | 'historical' | 'risk';
  size: string;
  sizeBytes: number;
  records: number;
  description: string;
  uploadDate: Date;
  lastModified: Date;
  status: 'processing' | 'processed' | 'error';
  quality: 'excellent' | 'good' | 'poor' | 'pending';
  path: string;
  processingError?: string;
  metadata?: {
    columns?: string[];
    rowCount?: number;
    hasHeaders?: boolean;
    encoding?: string;
    delimiter?: string;
  };
  uploadedBy?: mongoose.Types.ObjectId;
}

const fileSchema = new Schema<IFile>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['intake', 'outcome', 'location', 'historical', 'risk'],
    index: true
  },
  size: {
    type: String,
    required: true
  },
  sizeBytes: {
    type: Number,
    required: true
  },
  records: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'processed', 'error'],
    default: 'processing',
    index: true
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'pending'],
    default: 'pending'
  },
  path: {
    type: String,
    required: true
  },
  processingError: {
    type: String,
    default: null
  },
  metadata: {
    columns: [String],
    rowCount: Number,
    hasHeaders: Boolean,
    encoding: String,
    delimiter: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.path; // Don't expose file system path
      return ret;
    }
  }
});

// Indexes for better query performance
fileSchema.index({ name: 'text', description: 'text' });
fileSchema.index({ uploadDate: -1 });
fileSchema.index({ type: 1, status: 1 });

// Pre-save middleware to update lastModified
fileSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Static method to get file statistics
fileSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalRecords: { $sum: '$records' },
        totalSize: { $sum: '$sizeBytes' },
        processedFiles: {
          $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] }
        },
        errorFiles: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
        },
        processingFiles: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalFiles: 0,
    totalRecords: 0,
    totalSize: 0,
    processedFiles: 0,
    errorFiles: 0,
    processingFiles: 0
  };
};

export default mongoose.model<IFile>('File', fileSchema);
