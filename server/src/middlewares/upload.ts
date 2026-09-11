
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new ApiError(400, 'Only PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export const uploadCsv = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      cb(new ApiError(400, 'Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});
