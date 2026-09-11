
import { Request, Response } from 'express';
import { z } from 'zod';
import Certificate from '../models/Certificate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { createAuditLog } from '../services/auditService.js';
import { bulkIssueCertificates, CertificateUpdateInput, issueCertificate, revokeCertificate, updateCertificate, approveCertificate, revokeBulk } from '../services/certificateService.js';
import { exportCertificatesCsv, exportCertificatesExcel, exportCertificatesPdf, exportAuditLogsCsv, exportAuditLogsPdf } from '../services/exportService.js';
import { buildCertificateAccessQuery, assertCertificateAccess } from '../utils/authorization.js';
import { ApiError } from '../utils/ApiError.js';

const issueSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Invalid email address'),
  degree: z.string().min(1, 'Degree / Grade is required'),
  course: z.string().min(1, 'Course is required'),
  department: z.string().min(1, 'Department is required'),
  institutionId: z.string().min(1, 'Institution ID is required'),
  institutionName: z.string().min(1, 'Institution name is required'),
  graduationYear: z.coerce.number(),
  issueDate: z.string(),
  expiryDate: z.string().optional().or(z.literal('')),
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
  for (const key of Object.getOwnPropertyNames(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new ApiError(400, `Forbidden key detected at ${path}`);
    }

    assertNoForbiddenKeys(record[key], `${path}.${key}`);
  }
};

export const createCertificate = asyncHandler(async (req: Request, res: Response) => {
  const body = issueSchema.parse(req.body);
  const file = req.file;
  if (!file) throw new Error('Certificate PDF is required');

  const draft = req.body.draft === 'true';
  const certificate = await issueCertificate({ payload: body, pdfBuffer: file.buffer, pdfFileName: file.originalname, actorId: req.user!._id, draft });

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
  const accessQuery = await buildCertificateAccessQuery(req.user);
  const institutionId = typeof accessQuery.institution === 'string' ? accessQuery.institution : String(req.body.institutionId || '');
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
  const { page = '1', limit = '10', search = '', status = '' } = req.query;
  const accessQuery = await buildCertificateAccessQuery(req.user);
  const query: Record<string, unknown> = { ...accessQuery };

  if (search) {
    query.$or = [{ studentName: { $regex: search, $options: 'i' } }, { certificateId: { $regex: search, $options: 'i' } }];
  }

  if (status) query.status = status;

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const [items, total] = await Promise.all([
    Certificate.find(query).sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Certificate.countDocuments(query),
  ]);

  return sendSuccess(res, { items, total, page: pageNumber, limit: pageSize }, 'Certificates fetched');
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
  if (type === 'csv') {
    const csv = await exportCertificatesCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.csv"');
    return res.send(csv);
  }
  if (type === 'xlsx') {
    const xlsx = await exportCertificatesExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="certificates.xlsx"');
    return res.send(xlsx);
  }
  const pdf = await exportCertificatesPdf();
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
  const type = String(req.params.type);
  if (type === 'csv') {
    const csv = await exportAuditLogsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    return res.send(csv);
  }
  const pdf = await exportAuditLogsPdf();
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
