import { Request, Response } from 'express';
import { getLatestCertificates } from '../services/certificateService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getLatestLedger = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const certificates = await getLatestCertificates(limit);
  
  sendSuccess(res, certificates, 'Latest ledger fetched successfully');
});
