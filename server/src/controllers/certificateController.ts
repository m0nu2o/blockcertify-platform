
import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Certificate from '../models/Certificate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { createAuditLog } from '../services/auditService.js';
import { bulkIssueCertificates, CertificateUpdateInput, issueCertificate, revokeCertificate, updateCertificate, approveCertificate, revokeBulk, createCertificatePdfBuffer } from '../services/certificateService.js';
import { exportCertificatesCsv, exportCertificatesExcel, exportCertificatesPdf, exportAuditLogsCsv, exportAuditLogsPdf } from '../services/exportService.js';
import { buildCertificateAccessQuery, assertCertificateAccess, resolveAuthorizedInstitutionId } from '../utils/authorization.js';
import { ApiError } from '../utils/ApiError.js';

const issueSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Invalid email address'),
  degree: z.string().min(1, 'Degree / Grade is required'),
  course: z.string().min(1, 'Course is required'),
  department: z.string().min(1, 'Department is required'),
  institutionId: z.string().optional().default(''),
  institutionName: z.string().optional().default(''),
  graduationYear: z.coerce.number(),
  issueDate: z.string(),
  expiryDate: z.string().optional().or(z.literal('')),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional().default(''),
  status: z.string().optional().default(''),
});

const updateCertificateSchema = z
  .object({
    degree: z.string().min(2).optional(),
    course: z.string().min(2).optional(),
    department: z.string().min(2).optional(),
    graduationYear: z.coerce.number().int().positive().optional(),
    expiryDate: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid expiryDate')
      .optional(),
    tags: z.array(z.string().trim().min(1)).max(20).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one updatable field is required');

const assertNoForbiddenKeys = (value: unknown, path = 'body') => {
  if (value === null || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }

  const record = value as Record<string, unknown>;
  const forbidden = ['status', 'blockchainStatus', 'fileHash', 'metadataHash', 'transactionHash', 'history', 'version'];
  forbidden.forEach((key) => {
    if (key in record) {
      throw new ApiError(400, `Direct modification of ${key} is forbidden`);
    }
  });

  Object.entries(record).forEach(([key, val]) => {
    assertNoForbiddenKeys(val, `${path}.${key}`);
  });
};

export const createCertificate = asyncHandler(async (req: Request, res: Response) => {
  const body = issueSchema.parse(req.body);
  const requestedInstId = body.institutionId?.trim() || undefined;
  const authorizedInstitutionId = await resolveAuthorizedInstitutionId(req.user, requestedInstId);
  body.institutionId = authorizedInstitutionId;

  let pdfBuffer = req.file?.buffer;
  let pdfFileName = req.file?.originalname || `${body.studentId || 'certificate'}.pdf`;

  if (!pdfBuffer) {
    const certificateId = (body as any).certificateId || `BC-${uuidv4().slice(0, 8).toUpperCase()}`;
    const clientBase = (process.env.PUBLIC_VERIFY_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') ? process.env.CLIENT_URL : '') || 'https://blockcertify-blush.vercel.app').replace(/\/$/, '');
    const verificationUrl = `${clientBase}/certificate/${certificateId}`;
    pdfBuffer = await createCertificatePdfBuffer({
      certificateId,
      studentName: body.studentName,
      studentId: body.studentId,
      degree: body.degree,
      course: body.course,
      department: body.department,
      institutionName: body.institutionName || 'Issuing Institution',
      issueDate: body.issueDate,
      expiryDate: body.expiryDate || undefined,
      verificationUrl,
    });
    pdfFileName = `${certificateId}.pdf`;
    (body as any).certificateId = certificateId;
  }

  const draft = req.body.draft === 'true';
  const certificate = await issueCertificate({
    payload: body,
    pdfBuffer: pdfBuffer!,
    pdfFileName,
    actorId: req.user!._id,
    draft,
  });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: draft ? 'certificate.draft_created' : 'certificate.issued',
    entity: 'Certificate',
    entityId: certificate.id,
    metadata: { certificateId: certificate.certificateId },
  });

  return sendSuccess(res, certificate, draft ? 'Certificate draft created' : 'Certificate issued successfully', 201);
});

export const createBulkCertificates = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new Error('CSV file is required');
  const institutionId = await resolveAuthorizedInstitutionId(req.user, req.body.institutionId);
  const records = await bulkIssueCertificates({ csvBuffer: req.file.buffer, institutionId, actorId: req.user!._id });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificate.bulk_issued',
    entity: 'Certificate',
    metadata: { institutionId, succeededCount: records.succeeded.length, failedCount: records.failed.length },
  });

  return sendSuccess(res, records, 'Bulk certificates processed', 201);
});

export const listCertificates = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = listQuerySchema.parse(req.query);
  const accessQuery = await buildCertificateAccessQuery(req.user);
  const query: Record<string, unknown> = { ...accessQuery };

  if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [{ studentName: { $regex: escapedSearch, $options: 'i' } }, { certificateId: { $regex: escapedSearch, $options: 'i' } }];
  }

  if (status.trim()) query.status = status.trim();

  const [items, total] = await Promise.all([
    Certificate.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Certificate.countDocuments(query),
  ]);

  return sendSuccess(res, { items, total, page, limit }, 'Certificates fetched');
});

export const getCertificate = asyncHandler(async (req: Request, res: Response) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.id }).populate('student institution');
  if (!certificate) throw new ApiError(404, 'Certificate not found');

  await assertCertificateAccess(req.user, certificate);

  return sendSuccess(res, certificate, 'Certificate fetched');
});

export const revokeCertificateController = asyncHandler(async (req: Request, res: Response) => {
  const body = z.object({ reason: z.string().min(5) }).parse(req.body);
  const certificate = await revokeCertificate({ certificateId: String(req.params.id), reason: body.reason, actor: req.user });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificate.revoked',
    entity: 'Certificate',
    entityId: certificate.id,
    metadata: { certificateId: certificate.certificateId, reason: body.reason },
    severity: 'warning',
  });

  return sendSuccess(res, certificate, 'Certificate revoked');
});

export const updateCertificateController = asyncHandler(async (req: Request, res: Response) => {
  assertNoForbiddenKeys(req.body);
  const updates = updateCertificateSchema.parse(req.body) as CertificateUpdateInput;
  const certificate = await updateCertificate({ certificateId: String(req.params.id), updates, actor: req.user });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificate.updated',
    entity: 'Certificate',
    entityId: certificate.id,
    metadata: { certificateId: certificate.certificateId, updates },
  });

  return sendSuccess(res, certificate, 'Certificate updated');
});

export const exportCertificatesController = asyncHandler(async (req: Request, res: Response) => {
  const type = String(req.params.type);
  const accessQuery = await buildCertificateAccessQuery(req.user);
  if (type === 'csv') {
    const csv = await exportCertificatesCsv(accessQuery);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.csv"');
    return res.send(csv);
  }
  if (type === 'xlsx') {
    const xlsx = await exportCertificatesExcel(accessQuery);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.xlsx"');
    return res.send(xlsx);
  }
  const pdf = await exportCertificatesPdf(accessQuery);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="certificates.pdf"');
  return res.send(pdf);
});

export const approveCertificateController = asyncHandler(async (req: Request, res: Response) => {
  const certificate = await approveCertificate({
    id: String(req.params.id),
    actorId: req.user!._id,
  });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificate.approved',
    entity: 'Certificate',
    entityId: certificate.id,
    metadata: { certificateId: certificate.certificateId },
  });

  return sendSuccess(res, certificate, 'Certificate approved and issued successfully');
});

export const exportAuditLogsController = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Audit log export is restricted to administrators');
  }
  const type = String(req.params.type);
  if (type === 'csv') {
    const csv = await exportAuditLogsCsv({});
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    return res.send(csv);
  }
  const pdf = await exportAuditLogsPdf({});
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.pdf"');
  return res.send(pdf);
});

export const revokeBulkController = asyncHandler(async (req: Request, res: Response) => {
  const { certificateIds, reason } = req.body;
  
  if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
    throw new ApiError(400, 'certificateIds array is required');
  }
  
  if (!reason || typeof reason !== 'string') {
    throw new ApiError(400, 'reason is required');
  }

  const results = await revokeBulk({ certificateIds, reason, actor: req.user });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'certificate.revoked.bulk',
    entity: 'Certificate',
    entityId: 'bulk',
    metadata: { count: certificateIds.length, reason },
  });

  return sendSuccess(res, results, 'Bulk revocation processed');
});
