
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
import bcrypt from 'bcryptjs';
import { reconcileAllPendingCertificates } from '../services/certificateService.js';
import {
  getSubscriptionRequests,
  approveSubscription,
  rejectSubscription,
} from '../services/subscriptionService.js';

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(100).optional(),
});

const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'institution', 'student']),
  institutionId: z.string().optional(),
});

export const createAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const body = createAdminUserSchema.parse(req.body);
  const existing = await User.findOne({ email: body.email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const password = await bcrypt.hash(body.password, 12);
  const user = await User.create({
    name: body.name,
    email: body.email,
    password,
    role: body.role,
    institution: body.institutionId ? new Types.ObjectId(body.institutionId) : undefined,
    subscription: { tier: 'free', updatedAt: new Date() },
  });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'admin.user_created',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  return sendSuccess(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'User created successfully', 201);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const [users, total] = await Promise.all([
    User.find().select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);
  return sendSuccess(res, { items: users, total, page, limit }, 'Users fetched');
});

export const getInstitutions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const [institutions, total] = await Promise.all([
    Institution.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Institution.countDocuments(),
  ]);
  return sendSuccess(res, { items: institutions, total, page, limit }, 'Institutions fetched');
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(),
  ]);
  return sendSuccess(res, { items: logs, total, page, limit }, 'Audit logs fetched');
});

export const getBlockchainTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const [records, total] = await Promise.all([
    BlockchainTransaction.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    BlockchainTransaction.countDocuments(),
  ]);
  return sendSuccess(res, { items: records, total, page, limit }, 'Blockchain transactions fetched');
});

export const getVerificationLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationQuerySchema.parse(req.query);
  const [logs, total] = await Promise.all([
    VerificationLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    VerificationLog.countDocuments(),
  ]);
  return sendSuccess(res, { items: logs, total, page, limit }, 'Verification logs fetched');
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

export const reconcileCertificatesController = asyncHandler(async (req: Request, res: Response) => {
  const result = await reconcileAllPendingCertificates();
  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificates.reconciled',
    entity: 'Certificate',
    metadata: { processed: result.processed, reconciled: result.reconciled },
  });
  return sendSuccess(res, result, 'Pending certificates reconciliation completed');
});

const subscriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['pending', 'active', 'rejected', 'expired', 'cancelled']).optional(),
  tier: z.enum(['free', 'Starter', 'Growth', 'Enterprise']).optional(),
});

export const getAdminSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const query = subscriptionQuerySchema.parse(req.query);
  const result = await getSubscriptionRequests(query);
  return sendSuccess(res, result, 'Subscription requests fetched');
});

export const approveAdminSubscription = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await approveSubscription({
    subscriptionId: String(req.params.id),
    adminId: req.user!._id,
    req,
  });
  return sendSuccess(res, { subscription }, 'Subscription request approved successfully');
});

export const rejectAdminSubscription = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ reason: z.string().optional() }).parse(req.body);
  const subscription = await rejectSubscription({
    subscriptionId: String(req.params.id),
    adminId: req.user!._id,
    reason: body.reason,
    req,
  });
  return sendSuccess(res, { subscription }, 'Subscription request rejected successfully');
});
