
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

export type VerificationState =
  | 'valid'
  | 'revoked'
  | 'expired'
  | 'blockchain_pending'
  | 'blockchain_failed'
  | 'integrity_failed';

const computeVerificationState = (sanitized: any, onChain: any, valid: boolean) => {
  if (sanitized.status === 'revoked' || sanitized.revokedAt || onChain?.revoked) {
    return {
      verificationState: 'revoked' as VerificationState,
      title: 'Credential Revoked',
      message: 'Credential Revoked — This credential was previously issued but has been revoked by the issuing institution.',
    };
  }

  if (sanitized.status === 'expired' || (sanitized.expiryDate && new Date(sanitized.expiryDate) < new Date())) {
    return {
      verificationState: 'expired' as VerificationState,
      title: 'Credential Expired',
      message: 'Credential Expired — This credential was issued successfully but its validity period has expired.',
    };
  }

  if (sanitized.blockchainStatus === 'pending') {
    return {
      verificationState: 'blockchain_pending' as VerificationState,
      title: 'Verification Pending',
      message: 'Verification Pending — This credential has been recorded, but its blockchain transaction has not yet been confirmed.',
    };
  }

  if (sanitized.blockchainStatus === 'failed') {
    return {
      verificationState: 'blockchain_failed' as VerificationState,
      title: 'Blockchain Verification Unavailable',
      message: 'Blockchain Verification Unavailable — The credential record exists, but its blockchain registration could not be confirmed.',
    };
  }

  if (!valid) {
    return {
      verificationState: 'integrity_failed' as VerificationState,
      title: 'Credential Integrity Check Failed',
      message: 'Credential Integrity Check Failed — The provided credential does not match the original registered record.',
    };
  }

  return {
    verificationState: 'valid' as VerificationState,
    title: 'Credential Verified',
    message: 'Credential Verified — This credential matches the record registered by the issuing institution.',
  };
};

const formatVerificationResponse = (result: any) => {
  const sanitized = result.sanitized || result;
  const onChain = result.onChain || sanitized.onChain;
  const valid = Boolean(result.valid);
  const stateInfo = computeVerificationState(sanitized, onChain, valid);

  return {
    valid,
    verificationState: stateInfo.verificationState,
    title: stateInfo.title,
    message: stateInfo.message,
    verificationMessage: stateInfo.message,
    verifiedAt: result.verifiedAt || new Date().toISOString(),
    certificate: {
      certificateId: sanitized.certificateId,
      studentName: sanitized.studentName,
      institutionName: sanitized.institutionName,
      issueDate: sanitized.issueDate,
      expiryDate: sanitized.expiryDate,
      status: sanitized.status,
      blockchainStatus: sanitized.blockchainStatus,
      transactionHash: sanitized.transactionHash,
      fileHash: sanitized.fileHash || onChain?.fileHash || result.certificate?.fileHash,
      degree: sanitized.degree,
      course: sanitized.course,
      department: sanitized.department,
      network: sanitized.network || 'ethereum',
    },
    onChain,
    sanitized,
  };
};

export const verifyByIdController = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params?.certificateId || req.query?.certificateId || req.body?.certificateId;
  const certificateId = z.string().min(4).parse(rawId);
  const result = await verifyByCertificateId(certificateId, { method: 'id', ...requestContext(req) });
  return sendSuccess(res, formatVerificationResponse(result), 'Certificate verification completed');
});

export const verifyByHashController = asyncHandler(async (req: Request, res: Response) => {
  const rawHash = req.params?.hash || req.query?.hash || req.body?.hash;
  const hash = z.string().min(10).parse(rawHash);
  const result = await verifyByHash(hash, requestContext(req));
  return sendSuccess(res, formatVerificationResponse(result), 'Hash verification completed');
});

export const verifyByTransactionController = asyncHandler(async (req: Request, res: Response) => {
  const rawTx = req.params?.transactionHash || req.query?.transactionHash || req.body?.transactionHash;
  const transactionHash = z.string().min(10).parse(rawTx);
  const result = await verifyByTransaction(transactionHash, requestContext(req));
  return sendSuccess(res, formatVerificationResponse(result), 'Transaction verification completed');
});

export const verifyByQrController = asyncHandler(async (req: Request, res: Response) => {
  const rawPayload = req.params?.payload || req.query?.payload || req.body?.payload;
  const body = z.object({ payload: z.string().trim().min(1) }).parse({ payload: rawPayload });

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
  return sendSuccess(res, formatVerificationResponse(result), 'QR verification completed');
});

export const verifyBulkController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ certificateIds: z.array(z.string().min(4)).min(1).max(50) }).parse(req.body);
  const results = await verifyBulk(body.certificateIds, requestContext(req));
  const sanitizedResults = results.map((item) => ({
    certificateId: item.certificateId,
    success: item.success,
    error: item.error,
    data: item.data ? formatVerificationResponse(item.data) : undefined,
  }));
  return sendSuccess(res, sanitizedResults, 'Bulk verification completed');
});
