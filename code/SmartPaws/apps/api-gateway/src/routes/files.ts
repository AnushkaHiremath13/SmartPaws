import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getFiles,
  uploadFile,
  updateFile,
  deleteFile,
  bulkDeleteFiles,
  downloadFile,
  getFileById,
  getFileStats,
  getMyFiles
} from '../controllers/fileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/files/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Routes
router.get('/', getFiles);                          // GET /api/v1/files
router.get('/mine', protect as any, getMyFiles as any); // GET /api/v1/files/mine
router.post('/upload', protect as any, upload.single('file'), uploadFile as any);  // POST /api/v1/files/upload
router.get('/stats', getFileStats);                // GET /api/v1/files/stats
router.get('/:id', getFileById);                   // GET /api/v1/files/:id
router.put('/:id', updateFile);                    // PUT /api/v1/files/:id
router.delete('/bulk', bulkDeleteFiles);           // DELETE /api/v1/files/bulk
router.delete('/:id', deleteFile);                 // DELETE /api/v1/files/:id
router.get('/:id/download', downloadFile);         // GET /api/v1/files/:id/download

export default router;
