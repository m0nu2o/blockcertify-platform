
import { Request, Response } from 'express';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await Setting.findOne({ key: 'platform' });
  return sendSuccess(res, settings, 'Settings fetched');
});
