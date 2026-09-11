
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const issueMessages = err.issues.map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`).join(', ');
    return res.status(400).json({
      success: false,
      message: err.issues.length ? `Validation failed: ${issueMessages}` : 'Validation failed',
      errors: err.flatten(),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};
