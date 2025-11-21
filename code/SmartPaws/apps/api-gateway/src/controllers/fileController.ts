import { Request, Response } from 'express';
import File, { IFile } from '../models/File';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/authMiddleware';

// Extend Request interface to include file property from multer
interface MulterRequest extends Request {
  file?: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  };
}

// GET /api/v1/files - Fetch all files with pagination, search, and filtering
export const getFiles = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query: any = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Type filtering
    if (type && type !== 'all') {
      query.type = type;
    }

    // Get files with pagination
    const files = await File.find(query)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalFiles = await File.countDocuments(query);
    const totalPages = Math.ceil(totalFiles / limitNum);

    res.json({
      files,
      currentPage: pageNum,
      totalPages,
      totalFiles,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Failed to fetch files', error: (error as Error).message });
  }
};

// POST /api/v1/files/upload - Upload new file
export const uploadFile = async (req: MulterRequest & AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { type, description } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({ message: 'Type and description are required' });
    }

    // Calculate file size in readable format
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Create new file record
    const newFile = new File({
      name: req.file.originalname,
      filename: req.file.filename,
      type: type,
      size: formatFileSize(req.file.size),
      sizeBytes: req.file.size,
      description: description,
      uploadDate: new Date(),
      lastModified: new Date(),
      status: 'processing',
      quality: 'pending',
      records: 0, // Will be updated after processing
      path: req.file.path,
      uploadedBy: (req.user && (req.user as any).id) ? (req.user as any).id : undefined
    });

    const savedFile = await newFile.save();

    // TODO: Trigger background processing job here
    // processFile(savedFile._id);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: savedFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file', error: (error as Error).message });
  }
};

// PUT /api/v1/files/:id - Update file metadata
export const updateFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, description, status, quality } = req.body;

    const updatedFile = await File.findByIdAndUpdate(
      id,
      {
        type,
        description,
        status,
        quality,
        lastModified: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      message: 'File updated successfully',
      file: updatedFile
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: 'Failed to update file', error: (error as Error).message });
  }
};

// DELETE /api/v1/files/:id - Delete single file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete physical file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete database record
    await File.findByIdAndDelete(id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file', error: (error as Error).message });
  }
};

// DELETE /api/v1/files/bulk - Delete multiple files
export const bulkDeleteFiles = async (req: Request, res: Response) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: 'File IDs array is required' });
    }

    // Get files to delete
    const files = await File.find({ _id: { $in: fileIds } });

    // Delete physical files
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    // Delete database records
    const result = await File.deleteMany({ _id: { $in: fileIds } });

    res.json({
      message: `${result.deletedCount} files deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting files:', error);
    res.status(500).json({ message: 'Failed to delete files', error: (error as Error).message });
  }
};

// GET /api/v1/files/:id/download - Download file
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'Physical file not found' });
    }

    res.download(file.path, file.name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file', error: (error as Error).message });
  }
};

// GET /api/v1/files/:id - Get single file details
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Failed to fetch file', error: (error as Error).message });
  }
};

// GET /api/v1/files/stats - Get file statistics
export const getFileStats = async (req: Request, res: Response) => {
  try {
    const stats = await (File as any).getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching file stats:', error);
    res.status(500).json({ message: 'Failed to fetch file statistics', error: (error as Error).message });
  }
};

// GET /api/v1/files/mine - get files uploaded by current user
export const getMyFiles = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const files = await File.find({ uploadedBy: userId }).sort({ uploadDate: -1 });
    res.json({ files, total: files.length });
  } catch (error) {
    console.error('Error fetching user files:', error);
    res.status(500).json({ message: 'Failed to fetch user files', error: (error as Error).message });
  }
};
