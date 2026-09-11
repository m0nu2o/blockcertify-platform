
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import AuditLog from '../models/AuditLog.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import VerificationLog from '../models/VerificationLog.js';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from '../services/auditService.js';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return sendSuccess(res, users, 'Users fetched');
});

export const getInstitutions = asyncHandler(async (_req: Request, res: Response) => {
  const institutions = await Institution.find().sort({ createdAt: -1 });
  return sendSuccess(res, institutions, 'Institutions fetched');
});

export const getAuditLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  return sendSuccess(res, logs, 'Audit logs fetched');
});

export const getBlockchainTransactions = asyncHandler(async (_req: Request, res: Response) => {
  const records = await BlockchainTransaction.find().sort({ createdAt: -1 }).limit(100);
  return sendSuccess(res, records, 'Blockchain transactions fetched');
});

export const getVerificationLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await VerificationLog.find().sort({ createdAt: -1 }).limit(100);
  return sendSuccess(res, logs, 'Verification logs fetched');
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Setting.findOne({ key: 'platform' });
  const setting = await Setting.findOneAndUpdate(
    { key: 'platform' },
    { value: req.body, description: 'Main platform settings' },
    { upsert: true, new: true }
  );

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'settings.updated',
    entity: 'Setting',
    entityId: String(setting._id),
    metadata: { previous: existing?.value ?? null, next: req.body },
  });

  return sendSuccess(res, setting, 'Settings updated');
});

export const approveInstitution = asyncHandler(async (req: Request, res: Response) => {
  const institution = await Institution.findById(req.params.id);
  if (!institution) throw new ApiError(404, 'Institution not found');

  institution.status = 'approved';
  institution.approvedAt = new Date();
  institution.approvedBy = new Types.ObjectId(req.user!._id);
  await institution.save();

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'institution.approved',
    entity: 'Institution',
    entityId: institution.id,
    metadata: { institutionName: institution.name },
  });

  return sendSuccess(res, institution, 'Institution approved');
});

const suspendInstitutionSchema = z.object({ reason: z.string().min(5) });

export const suspendInstitution = asyncHandler(async (req: Request, res: Response) => {
  const body = suspendInstitutionSchema.parse(req.body);
  const institution = await Institution.findById(req.params.id);
  if (!institution) throw new ApiError(404, 'Institution not found');

  institution.status = 'suspended';
  institution.suspendedAt = new Date();
  institution.suspensionReason = body.reason;
  await institution.save();

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'institution.suspended',
    entity: 'Institution',
    entityId: institution.id,
    metadata: { institutionName: institution.name, reason: body.reason },
    severity: 'warning',
  });

  return sendSuccess(res, institution, 'Institution suspended');
});
