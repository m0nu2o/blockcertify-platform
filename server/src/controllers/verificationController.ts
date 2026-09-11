
import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { verifyByCertificateId, verifyByHash, verifyByTransaction, verifyBulk } from '../services/certificateService.js';
import { ApiError } from '../utils/ApiError.js';

const requestContext = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.headers?.['user-agent'],
  actor: req.user?._id,
});

export const verifyByIdController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ certificateId: z.string().min(4) }).parse(req.body);
  const result = await verifyByCertificateId(body.certificateId, { method: 'id', ...requestContext(req) });
  return sendSuccess(res, result, 'Certificate verification completed');
});

export const verifyByHashController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ hash: z.string().min(10) }).parse(req.body);
  const result = await verifyByHash(body.hash, requestContext(req));
  return sendSuccess(res, result, 'Hash verification completed');
});

export const verifyByTransactionController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ transactionHash: z.string().min(10) }).parse(req.body);
  const result = await verifyByTransaction(body.transactionHash, requestContext(req));
  return sendSuccess(res, result, 'Transaction verification completed');
});

export const verifyByQrController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ payload: z.string().trim().min(1) }).parse(req.body);

  let certificateId = body.payload;

  try {
    const url = new URL(body.payload);
    certificateId = url.searchParams.get('id') || body.payload;
  } catch {
    certificateId = body.payload;
  }

  if (certificateId.trim().length < 4) {
    throw new ApiError(400, 'Invalid QR payload');
  }

  const result = await verifyByCertificateId(certificateId.trim(), { method: 'qr', ...requestContext(req) });
  return sendSuccess(res, result, 'QR verification completed');
});

export const verifyBulkController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ certificateIds: z.array(z.string().min(4)).min(1).max(50) }).parse(req.body);
  const results = await verifyBulk(body.certificateIds, requestContext(req));
  return sendSuccess(res, results, 'Bulk verification completed');
});
