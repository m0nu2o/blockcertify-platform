import { parse } from 'csv-parse/sync';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import Certificate, { ICertificate } from '../models/Certificate.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import VerificationLog, { VerificationMethod } from '../models/VerificationLog.js';
import User from '../models/User.js';
import { sha256 } from '../utils/hash.js';
import {
  issueCertificateOnChain,
  revokeCertificateOnChain,
  updateCertificateOnChain,
  getCertificateOnChain,
} from './blockchainService.js';
import { pinFileToIpfs, pinJsonToIpfs } from './ipfsService.js';
import { createNotification } from './notificationService.js';
import { sendEmail } from './emailService.js';
import { ApiError } from '../utils/ApiError.js';
import { assertCertificateAccess, resolveAuthorizedInstitutionId } from '../utils/authorization.js';
import { getEffectiveInstitutionTier } from './subscriptionService.js';

export type CertificateUpdateInput = {
  degree?: string;
  course?: string;
  department?: string;
  graduationYear?: number;
  expiryDate?: string;
  tags?: string[];
};

type CertificateIssuePayload = {
  certificateId?: string;
  studentName: string;
  studentId: string;
  email: string;
  degree: string;
  course: string;
  department: string;
  institutionId: string;
  institutionName: string;
  graduationYear: number;
  issueDate: string;
  expiryDate?: string;
  idempotencyKey?: string;
};

type BulkIssueRow = {
  studentName: string;
  studentId: string;
  email: string;
  degree: string;
  course: string;
  department: string;
  graduationYear: string;
  issueDate: string;
  expiryDate?: string;
};

type BulkIssueSuccess = {
  row: BulkIssueRow;
  success: true;
  certificateId: string;
};

type BulkIssueFailure = {
  row: BulkIssueRow;
  success: false;
  error: string;
};

export type PublicCertificateVerificationResult = {
  certificateId: string;
  studentName: string;
  degree: string;
  course: string;
  department: string;
  institutionName: string;
  issueDate: string;
  expiryDate?: string;
  status: string;
  blockchainStatus: string;
  transactionHash?: string;
  network?: string;
  valid: boolean;
  verifiedAt: string;
  onChain?: {
    certificateId: string;
    metadataHash: string;
    fileHash: string;
    revoked: boolean;
    issuedAt: string;
    issuer: string;
    reason?: string;
  };
};

export const sanitizePublicVerification = (
  certificate: ICertificate,
  valid: boolean,
  verifiedAt: string,
  onChain?: Record<string, unknown>
): PublicCertificateVerificationResult => ({
  certificateId: certificate.certificateId,
  studentName: certificate.studentName,
  degree: certificate.degree,
  course: certificate.course,
  department: certificate.department,
  institutionName: certificate.institutionName,
  issueDate: certificate.issueDate ? new Date(certificate.issueDate).toISOString() : '',
  expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate).toISOString() : undefined,
  status: certificate.status,
  blockchainStatus: certificate.blockchainStatus,
  transactionHash: certificate.transactionHash,
  network: certificate.network || 'ethereum',
  valid,
  verifiedAt,
  onChain: onChain
    ? {
        certificateId: String(onChain.certificateId || certificate.certificateId),
        metadataHash: String(onChain.metadataHash || certificate.metadataHash),
        fileHash: String(onChain.fileHash || certificate.fileHash),
        revoked: Boolean(onChain.revoked),
        issuedAt: String(onChain.issuedAt || ''),
        issuer: String(onChain.issuer || ''),
        reason: onChain.reason ? String(onChain.reason) : undefined,
      }
    : undefined,
});

export const buildCertificateMetadata = (payload: Record<string, unknown>) => ({
  ...payload,
  version: '1.0.0',
  standard: 'BlockCertify-Digital-Certificate',
});

const BULK_ISSUE_BATCH_SIZE = 5;

export const createCertificatePdfBuffer = async (params: {
  certificateId?: string;
  studentName: string;
  studentId: string;
  degree: string;
  course: string;
  department?: string;
  institutionName: string;
  issueDate: string;
  expiryDate?: string;
  verificationUrl?: string;
}): Promise<Buffer> => {
  const certId = params.certificateId || `BC-${uuidv4().slice(0, 8).toUpperCase()}`;
  const clientBase = (process.env.PUBLIC_VERIFY_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') ? process.env.CLIENT_URL : '') || 'https://blockcertify-blush.vercel.app').replace(/\/$/, '');
  const verifyUrl = params.verificationUrl || `${clientBase}/certificate/${certId}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#080E1E', light: '#FFFFFF' },
  });

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
  });

  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Background Parchment Tint
  doc.rect(0, 0, pageWidth, pageHeight).fill('#FBFBFA');

  // Outer Imperial Border (Gold #D4AF37)
  doc.rect(22, 22, pageWidth - 44, pageHeight - 44).lineWidth(3.5).stroke('#D4AF37');

  // Inner Ornate Navy Border
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(1.2).stroke('#0F172A');

  // Corner Embellishments
  const cornerSize = 24;
  doc.rect(34, 34, cornerSize, cornerSize).lineWidth(0.8).stroke('#D4AF37');
  doc.rect(pageWidth - 34 - cornerSize, 34, cornerSize, cornerSize).lineWidth(0.8).stroke('#D4AF37');
  doc.rect(34, pageHeight - 34 - cornerSize, cornerSize, cornerSize).lineWidth(0.8).stroke('#D4AF37');
  doc.rect(pageWidth - 34 - cornerSize, pageHeight - 34 - cornerSize, cornerSize, cornerSize).lineWidth(0.8).stroke('#D4AF37');

  // Institution Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text(params.institutionName.toUpperCase(), 40, 54, {
      align: 'center',
      width: pageWidth - 80,
    });

  // Conferral Subtitle
  doc
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor('#B45309')
    .text('OFFICIAL ACADEMIC CREDENTIAL • THIS IS TO CERTIFY THAT', 40, 88, {
      align: 'center',
      characterSpacing: 2,
      width: pageWidth - 80,
    });

  // Student Name
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .fillColor('#080E1E')
    .text(params.studentName, 40, 122, {
      align: 'center',
      width: pageWidth - 80,
    });

  // Conferral Clause
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748B')
    .text(
      'HAS COMPLETED ALL PRESCRIBED REQUIREMENTS AND UPON THE RECOMMENDATION OF THE FACULTY IS CONFERRED THE DEGREE OF',
      60,
      172,
      {
        align: 'center',
        characterSpacing: 0.5,
        width: pageWidth - 120,
      }
    );

  // Degree
  doc
    .fontSize(21)
    .font('Helvetica-Bold')
    .fillColor('#B45309')
    .text(params.degree, 40, 204, {
      align: 'center',
      width: pageWidth - 80,
    });

  // Course / Department
  const courseText = params.course ? (params.course.toLowerCase().startsWith('in ') ? params.course : `in ${params.course}`) : '';
  const deptText = params.department ? `Department of ${params.department}` : '';
  const specText = [courseText, deptText].filter(Boolean).join(' • ');

  if (specText) {
    doc
      .fontSize(13)
      .font('Helvetica')
      .fillColor('#334155')
      .text(specText, 40, 238, {
        align: 'center',
        width: pageWidth - 80,
      });
  }

  // Horizontal Accent Divider Line
  doc
    .moveTo(pageWidth / 2 - 160, 275)
    .lineTo(pageWidth / 2 + 160, 275)
    .lineWidth(0.8)
    .stroke('#D4AF37');

  // Decorative Central Verification Badge
  doc
    .circle(pageWidth / 2, 275, 5)
    .fillAndStroke('#D4AF37', '#0F172A');

  // Bottom Section:
  // Left: Credential Metadata & Signatures
  const leftX = 55;
  const bottomY = 410;

  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#1E293B')
    .text('ACADEMIC CREDENTIAL DETAILS', leftX, bottomY);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Student ID: ${params.studentId}`, leftX, bottomY + 18)
    .text(`Issue Date: ${params.issueDate}`, leftX, bottomY + 34)
    .text(`Credential ID: ${certId}`, leftX, bottomY + 50);

  if (params.expiryDate) {
    doc.text(`Valid Until: ${params.expiryDate}`, leftX, bottomY + 66);
  }

  // Left Signatory Line
  doc
    .moveTo(leftX, bottomY + 105)
    .lineTo(leftX + 160, bottomY + 105)
    .lineWidth(0.8)
    .stroke('#94A3B8');

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('Registrar / Academic Dean', leftX, bottomY + 110);

  // Center: Blockchain Proof Badge
  const centerX = pageWidth / 2;
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('BLOCKCHAIN VERIFIED CREDENTIAL', centerX - 120, bottomY + 25, {
      align: 'center',
      width: 240,
    });

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('Cryptographically Registered & Tamper-Evident', centerX - 120, bottomY + 42, {
      align: 'center',
      width: 240,
    })
    .text('W3C Verifiable Credential Standard v1.1', centerX - 120, bottomY + 56, {
      align: 'center',
      width: 240,
    })
    .text('Ethereum Smart Contract Registry', centerX - 120, bottomY + 70, {
      align: 'center',
      width: 240,
    });

  // Right: Embedded Scannable QR Code Card
  const qrCardX = pageWidth - 175;
  const qrCardY = bottomY - 10;
  const qrCardW = 120;
  const qrCardH = 135;

  // White Card Container with Gold Border
  doc
    .roundedRect(qrCardX, qrCardY, qrCardW, qrCardH, 6)
    .fillAndStroke('#FFFFFF', '#D4AF37');

  // Embed Real Scannable QR Code
  doc.image(qrBuffer, qrCardX + 17.5, qrCardY + 10, {
    width: 85,
    height: 85,
  });

  // "SCAN TO VERIFY" Label below QR
  doc
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('SCAN TO VERIFY', qrCardX, qrCardY + 101, {
      align: 'center',
      characterSpacing: 0.5,
      width: qrCardW,
    });

  // Certificate ID under QR
  doc
    .fontSize(6.5)
    .font('Courier')
    .fillColor('#64748B')
    .text(certId, qrCardX, qrCardY + 115, {
      align: 'center',
      width: qrCardW,
    });

  doc.end();
  return await new Promise<Buffer>((resolve) => stream.on('finish', () => resolve(Buffer.concat(chunks))));
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

const buildUpdateMetadataPayload = (certificateId: string, updates: CertificateUpdateInput) => ({
  certificateId,
  ...updates,
  expiryDate: updates.expiryDate ?? null,
});

export const issueCertificate = async ({
  payload,
  pdfBuffer,
  pdfFileName,
  actorId,
  actor,
  draft = false,
  idempotencyKey,
}: {
  payload: CertificateIssuePayload;
  pdfBuffer: Buffer;
  pdfFileName: string;
  actorId: string;
  actor?: Express.Request['user'];
  draft?: boolean;
  idempotencyKey?: string;
}) => {
  // 1. Check idempotency if key provided
  const effectiveIdempotencyKey = idempotencyKey || payload.idempotencyKey;
  if (effectiveIdempotencyKey) {
    const existing = await Certificate.findOne({ idempotencyKey: effectiveIdempotencyKey });
    if (existing) {
      return existing;
    }
  }

  // 2. Fetch actor user if actor not fully provided
  let actorRole = actor?.role;
  let actorInstitutionId = actor?.institution ? String(actor.institution) : undefined;
  let actorUser;
  if (!actorRole || !actorInstitutionId) {
    try {
      actorUser = await User.findById(actorId);
      if (actorUser) {
        actorRole = actorRole || actorUser.role;
        actorInstitutionId = actorInstitutionId || (actorUser.institution ? String(actorUser.institution) : undefined);
      }
    } catch {
      // ignore
    }
  }

  // 3. Resolve institution strictly
  let resolvedInstitutionId = payload.institutionId;
  if (actorRole === 'institution' && actorInstitutionId) {
    if (payload.institutionId && payload.institutionId !== actorInstitutionId) {
      throw new ApiError(403, 'Cross-institution certificate issuance is forbidden');
    }
    resolvedInstitutionId = actorInstitutionId;
  }

  let institution;
  if (resolvedInstitutionId) {
    try {
      institution = await Institution.findById(resolvedInstitutionId);
    } catch {
      // ignore CastError
    }
  }

  if (!institution && payload.institutionName) {
    const escapedName = payload.institutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      institution = await Institution.findOne({
        $or: [{ name: new RegExp(`^${escapedName}$`, 'i') }, { slug: resolvedInstitutionId?.toLowerCase() }],
      });
    } catch {
      // ignore
    }
  }

  if (!institution) {
    throw new ApiError(404, 'Your institution could not be verified. Please contact an administrator.');
  }

  if (institution.status !== 'approved') {
    throw new ApiError(403, 'Institution is not approved to issue certificates');
  }

  if (institution && !payload.institutionName) {
    payload.institutionName = institution.name;
  }

  // 4. Enforce subscription tier quota (ADMIN bypasses all limits)
  if (actorRole !== 'admin') {
    const currentTier = getEffectiveInstitutionTier(institution);
    if (currentTier === 'free') {
      const existingCount = await Certificate.countDocuments({
        institution: institution._id,
        status: { $ne: 'failed' },
      });
      if (existingCount >= 3) {
        throw new ApiError(
          403,
          'Subscription limit reached. Free plan is limited to 3 certificates. Please upgrade to issue more certificates.'
        );
      }
    }
  }

  // 4b. Scoped student lookup & cross-institution guard
  let student = await Student.findOne({ studentId: payload.studentId });
  if (student) {
    if (student.institution && String(student.institution) !== String(institution._id)) {
      throw new ApiError(403, 'This student belongs to another institution and cannot be used for this certificate.');
    }
  } else {
    student = await Student.create({
      studentId: payload.studentId,
      name: payload.studentName,
      email: payload.email,
      degree: payload.degree,
      course: payload.course,
      department: payload.department,
      institution: institution._id,
      graduationYear: payload.graduationYear,
    });
  }

  const certificateId = payload.certificateId || `BC-${uuidv4().slice(0, 8).toUpperCase()}`;
  const fileHash = sha256(pdfBuffer);
  const metadataHash = sha256(JSON.stringify(payload));
  const clientBase = (process.env.PUBLIC_VERIFY_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') ? process.env.CLIENT_URL : '') || 'https://blockcertify-blush.vercel.app').replace(/\/$/, '');
  const verificationUrl = `${clientBase}/certificate/${certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { width: 280, margin: 1 });

  const filePin = await pinFileToIpfs(pdfBuffer, pdfFileName);
  const metadata = buildCertificateMetadata({ certificateId, ...payload, fileHash, verificationUrl, fileCid: filePin.cid });
  const metadataPin = await pinJsonToIpfs(metadata);

  // 5. Explicit certificate creation in draft/pending state
  const certificate = await Certificate.create({
    certificateId,
    student: student._id,
    institution: institution._id,
    studentName: payload.studentName,
    studentId: payload.studentId,
    email: payload.email,
    degree: payload.degree,
    course: payload.course,
    department: payload.department,
    institutionName: institution.name || payload.institutionName,
    graduationYear: payload.graduationYear,
    issueDate: new Date(payload.issueDate),
    expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
    fileHash,
    metadataHash,
    ipfsCid: filePin.cid,
    ipfsUrl: filePin.url,
    metadataCid: metadataPin.cid,
    metadataUrl: metadataPin.url,
    blockchainHash: draft ? undefined : fileHash,
    blockchainStatus: draft ? 'none' : 'pending',
    qrCodeDataUrl,
    pdfFileName,
    tags: [payload.department, payload.course],
    status: draft ? 'pending_approval' : 'draft',
    preparedBy: actorId,
    approvedBy: draft ? undefined : actorId,
    idempotencyKey: effectiveIdempotencyKey,
    submittedAt: draft ? undefined : new Date(),
    history: [
      {
        action: draft ? 'draft_created' : 'created',
        timestamp: new Date(),
        actor: actorId,
      },
    ],
  });

  if (!draft) {
    try {
      const chainResult = await issueCertificateOnChain({
        certificateId,
        metadataHash,
        fileHash,
        metadataUri: metadataPin.url,
      });

      certificate.status = 'issued';
      certificate.blockchainStatus = 'confirmed';
      certificate.transactionHash = chainResult.transactionHash;
      certificate.blockNumber = chainResult.blockNumber ?? undefined;
      certificate.contractAddress = process.env.ETH_CONTRACT_ADDRESS;
      certificate.chainId = chainResult.chainId || '31337';
      certificate.confirmedAt = new Date();
      certificate.history.push({
        action: 'issued_on_chain',
        timestamp: new Date(),
        actor: actorId,
        transactionHash: chainResult.transactionHash,
      });
      await certificate.save();

      await BlockchainTransaction.create({
        certificate: certificate._id,
        action: 'issue',
        network: 'ethereum',
        chainId: certificate.chainId,
        contractAddress: process.env.ETH_CONTRACT_ADDRESS,
        transactionHash: chainResult.transactionHash,
        blockNumber: chainResult.blockNumber,
        gasUsed: chainResult.gasUsed,
        walletAddress: chainResult.walletAddress,
        status: 'confirmed',
        submittedAt: certificate.submittedAt,
        confirmedAt: certificate.confirmedAt,
        payload: { certificateId, metadataHash, fileHash },
      });

      if (!institution.stats) {
        institution.stats = { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 };
      }
      institution.stats.certificatesIssued = (institution.stats.certificatesIssued || 0) + 1;
      institution.stats.studentsManaged = await Student.countDocuments({ institution: institution._id });
      await institution.save();

      const studentUser = await User.findOne({ email: payload.email, role: 'student' });
      if (studentUser) {
        await createNotification({
          user: studentUser.id,
          title: 'Certificate issued',
          message: `Your certificate ${certificate.certificateId} has been issued successfully.`,
          type: 'success',
          link: `/dashboard/student/certificates/${certificate.certificateId}`,
          payload: { certificateId: certificate.certificateId },
        });
      }

      await sendEmail({
        to: payload.email,
        subject: `Certificate issued: ${certificate.certificateId}`,
        html: `<p>Hello ${payload.studentName},</p><p>Your certificate has been issued by ${payload.institutionName}.</p><p>Certificate ID: <strong>${certificate.certificateId}</strong></p><p>Verification link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
      });
    } catch (chainErr: unknown) {
      certificate.status = 'failed';
      certificate.blockchainStatus = 'failed';
      certificate.failureReason = chainErr instanceof Error ? chainErr.message : 'Blockchain transaction error';
      certificate.history.push({
        action: 'blockchain_failed',
        timestamp: new Date(),
        actor: actorId,
        reason: certificate.failureReason,
      });
      await certificate.save();

      await BlockchainTransaction.create({
        certificate: certificate._id,
        action: 'issue',
        network: 'ethereum',
        contractAddress: process.env.ETH_CONTRACT_ADDRESS,
        transactionHash: `failed-${certificate.certificateId}-${Date.now()}`,
        status: 'failed',
        errorMessage: certificate.failureReason,
        payload: { certificateId, metadataHash, fileHash },
      });

      throw new ApiError(500, `Blockchain issuance failed: ${certificate.failureReason}`);
    }
  }

  return certificate;
};

export const approveCertificate = async ({
  id,
  actorId,
}: {
  id: string;
  actorId: string;
}) => {
  const certificate = await Certificate.findOne({ certificateId: id });
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  if (certificate.status !== 'pending_approval') {
    throw new ApiError(400, 'Certificate is not pending approval');
  }

  const institution = await Institution.findById(certificate.institution);
  if (!institution) throw new ApiError(404, 'Institution not found');
  if (institution.status !== 'approved') {
    throw new ApiError(403, 'Institution is not approved to issue certificates');
  }

  // Resolve actor role from database to determine admin bypass
  let actorRole: string | undefined;
  try {
    const actorUser = await User.findById(actorId);
    if (actorUser) actorRole = actorUser.role;
  } catch {
    // ignore
  }

  // Quota enforcement (ADMIN bypasses all limits)
  if (actorRole !== 'admin') {
    const tier = getEffectiveInstitutionTier(institution);
    if (tier === 'free') {
      const existingCount = await Certificate.countDocuments({
        institution: institution._id,
        status: { $in: ['issued', 'verified'] },
      });
      if (existingCount >= 3) {
        throw new ApiError(
          403,
          'Subscription limit reached. Free plan is limited to 3 certificates. Please upgrade to approve more certificates.'
        );
      }
    }
  }

  certificate.submittedAt = new Date();
  certificate.blockchainStatus = 'pending';
  await certificate.save();

  try {
    const chainResult = await issueCertificateOnChain({
      certificateId: certificate.certificateId,
      metadataHash: certificate.metadataHash,
      fileHash: certificate.fileHash,
      metadataUri: certificate.metadataUrl || '',
    });

    certificate.status = 'issued';
    certificate.blockchainStatus = 'confirmed';
    certificate.blockchainHash = certificate.fileHash;
    certificate.transactionHash = chainResult.transactionHash;
    certificate.blockNumber = chainResult.blockNumber ?? undefined;
    certificate.contractAddress = process.env.ETH_CONTRACT_ADDRESS;
    certificate.chainId = chainResult.chainId || '31337';
    certificate.approvedBy = actorId;
    certificate.confirmedAt = new Date();
    certificate.history.push({
      action: 'approved_and_issued',
      timestamp: new Date(),
      actor: actorId,
      transactionHash: chainResult.transactionHash,
    });
    await certificate.save();

    await BlockchainTransaction.create({
      certificate: certificate._id,
      action: 'issue',
      network: 'ethereum',
      chainId: certificate.chainId,
      contractAddress: process.env.ETH_CONTRACT_ADDRESS,
      transactionHash: chainResult.transactionHash,
      blockNumber: chainResult.blockNumber,
      gasUsed: chainResult.gasUsed,
      walletAddress: chainResult.walletAddress,
      status: 'confirmed',
      submittedAt: certificate.submittedAt,
      confirmedAt: certificate.confirmedAt,
      payload: {
        certificateId: certificate.certificateId,
        metadataHash: certificate.metadataHash,
        fileHash: certificate.fileHash,
      },
    });

    if (!institution.stats) {
      institution.stats = { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 };
    }
    institution.stats.certificatesIssued = (institution.stats.certificatesIssued || 0) + 1;
    await institution.save();

    const studentUser = await User.findOne({ email: certificate.email, role: 'student' });
    if (studentUser) {
      await createNotification({
        user: studentUser.id,
        title: 'Certificate issued',
        message: `Your certificate ${certificate.certificateId} has been issued successfully.`,
        type: 'success',
        link: `/dashboard/student/certificates/${certificate.certificateId}`,
        payload: { certificateId: certificate.certificateId },
      });
    }

    const clientBase = (process.env.PUBLIC_VERIFY_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') ? process.env.CLIENT_URL : '') || 'https://blockcertify-blush.vercel.app').replace(/\/$/, '');
    const publicCertUrl = `${clientBase}/certificate/${certificate.certificateId}`;
    await sendEmail({
      to: certificate.email || '',
      subject: `Certificate issued: ${certificate.certificateId}`,
      html: `<p>Hello ${certificate.studentName},</p><p>Your certificate has been issued by ${certificate.institutionName}.</p><p>Certificate ID: <strong>${certificate.certificateId}</strong></p><p>Public Verification link: <a href="${publicCertUrl}">${publicCertUrl}</a></p>`,
    });

    return certificate;
  } catch (err: unknown) {
    certificate.status = 'failed';
    certificate.blockchainStatus = 'failed';
    certificate.failureReason = err instanceof Error ? err.message : 'Blockchain error';
    certificate.history.push({
      action: 'blockchain_failed',
      timestamp: new Date(),
      actor: actorId,
      reason: certificate.failureReason,
    });
    await certificate.save();

    throw new ApiError(500, `Approval failed: ${certificate.failureReason}`);
  }
};

export const bulkIssueCertificates = async ({
  csvBuffer,
  institutionId,
  actorId,
}: {
  csvBuffer: Buffer;
  institutionId: string;
  actorId: string;
}) => {
  // Max file size: 5MB
  if (csvBuffer.length > 5 * 1024 * 1024) {
    throw new ApiError(400, 'CSV file size exceeds 5MB limit');
  }

  let institution;
  try {
    institution = await Institution.findById(institutionId);
  } catch {
    // Silently ignore CastError
  }
  if (!institution) {
    throw new ApiError(404, 'Your institution could not be verified. Please contact an administrator.');
  }
  if (institution.status !== 'approved') {
    throw new ApiError(403, 'Institution is not approved to issue certificates');
  }

  // Resolve actor role from database to determine admin bypass
  let actorRole: string | undefined;
  try {
    const actorUser = await User.findById(actorId);
    if (actorUser) actorRole = actorUser.role;
  } catch {
    // ignore
  }

  const tier = getEffectiveInstitutionTier(institution);

  // Tier check: Free tier cannot bulk issue (ADMIN bypasses all limits)
  if (actorRole !== 'admin') {
    if (tier === 'free') {
      throw new ApiError(
        403,
        'Bulk issuance is not available on the Free plan. Please upgrade your subscription to issue in bulk.'
      );
    }
  }

  const rows = parse(csvBuffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as BulkIssueRow[];

  if (rows.length === 0) {
    throw new ApiError(400, 'CSV file is empty or contains no valid rows');
  }

  const maxRows = actorRole === 'admin' ? 1000 : tier === 'Starter' ? 50 : 200;
  if (rows.length > maxRows) {
    throw new ApiError(400, `CSV contains ${rows.length} rows, which exceeds your tier limit of ${maxRows}`);
  }

  // Required headers validation
  const requiredHeaders = ['studentName', 'studentId', 'email', 'degree', 'course', 'department', 'graduationYear', 'issueDate'];
  const firstRow = rows[0] as unknown as Record<string, unknown>;
  for (const header of requiredHeaders) {
    if (!(header in firstRow)) {
      throw new ApiError(400, `CSV is missing required header: ${header}`);
    }
  }

  // Detect duplicate student IDs within the CSV file
  const seenStudentIds = new Set<string>();
  const duplicateStudentIds = new Set<string>();
  rows.forEach((r) => {
    if (r.studentId) {
      if (seenStudentIds.has(r.studentId)) {
        duplicateStudentIds.add(r.studentId);
      }
      seenStudentIds.add(r.studentId);
    }
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const succeeded: BulkIssueSuccess[] = [];
  const failed: BulkIssueFailure[] = [];

  for (let index = 0; index < rows.length; index += BULK_ISSUE_BATCH_SIZE) {
    const batch = rows.slice(index, index + BULK_ISSUE_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (row, batchIndex) => {
        const rowNum = index + batchIndex + 2; // +1 for 0-index, +1 for CSV header

        if (!row.studentName || row.studentName.trim().length === 0) {
          throw new Error(`Row ${rowNum}: Student name is required`);
        }
        if (!row.studentId || row.studentId.trim().length === 0) {
          throw new Error(`Row ${rowNum}: Student ID is required`);
        }
        if (!row.email || !emailRegex.test(row.email.trim())) {
          throw new Error(`Row ${rowNum}: Invalid email format`);
        }
        if (!row.degree || row.degree.trim().length === 0) {
          throw new Error(`Row ${rowNum}: Degree is required`);
        }
        if (!row.course || row.course.trim().length === 0) {
          throw new Error(`Row ${rowNum}: Course is required`);
        }
        if (!row.department || row.department.trim().length === 0) {
          throw new Error(`Row ${rowNum}: Department is required`);
        }
        const gradYear = Number(row.graduationYear);
        if (isNaN(gradYear) || gradYear < 1900 || gradYear > 2100) {
          throw new Error(`Row ${rowNum}: Invalid graduation year`);
        }
        if (duplicateStudentIds.has(row.studentId)) {
          throw new Error(`Row ${rowNum}: Duplicate student ID '${row.studentId}' in upload batch`);
        }

        const certificateId = `BC-${uuidv4().slice(0, 8).toUpperCase()}`;
        const clientBase = (process.env.PUBLIC_VERIFY_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost') ? process.env.CLIENT_URL : '') || 'https://blockcertify-blush.vercel.app').replace(/\/$/, '');
        const verificationUrl = `${clientBase}/certificate/${certificateId}`;

        const pdfBuffer = await createCertificatePdfBuffer({
          certificateId,
          studentName: row.studentName,
          studentId: row.studentId,
          degree: row.degree,
          course: row.course,
          department: row.department,
          institutionName: institution.name,
          issueDate: row.issueDate,
          expiryDate: row.expiryDate,
          verificationUrl,
        });

        const certificate = await issueCertificate({
          payload: {
            certificateId,
            studentName: row.studentName,
            studentId: row.studentId,
            email: row.email,
            degree: row.degree,
            course: row.course,
            department: row.department,
            institutionId: String(institution._id),
            institutionName: institution.name,
            graduationYear: gradYear,
            issueDate: row.issueDate,
            expiryDate: row.expiryDate,
          },
          pdfBuffer,
          pdfFileName: `${row.studentId}.pdf`,
          actorId,
        });

        return { row, certificateId: certificate.certificateId };
      })
    );

    results.forEach((result, batchIndex) => {
      const row = batch[batchIndex];

      if (result.status === 'fulfilled') {
        succeeded.push({ row, success: true, certificateId: result.value.certificateId });
        return;
      }

      failed.push({ row, success: false, error: getErrorMessage(result.reason) });
    });
  }

  return { succeeded, failed };
};

export type VerificationContext = {
  method: VerificationMethod;
  ipAddress?: string;
  userAgent?: string;
  actor?: string;
};

export const verifyByCertificateId = async (certificateId: string, context?: VerificationContext) => {
  let valid = false;

  try {
    const cleanId = (certificateId || '').trim();
    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: cleanId },
        { certificateId: cleanId.toUpperCase() },
        { certificateId: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
      ],
    }).populate('student institution');
    if (!certificate) throw new ApiError(404, 'Credential Not Found — We could not find a credential matching the provided Certificate ID.');

    let chainRecord;
    try {
      chainRecord = await getCertificateOnChain(cleanId);
      valid =
        !certificate.revokedAt &&
        certificate.status !== 'revoked' &&
        !chainRecord.revoked;
    } catch {
      // Fallback to database verification
      valid = !certificate.revokedAt && certificate.status !== 'revoked';
      chainRecord = {
        certificateId: certificate.certificateId,
        metadataHash: certificate.metadataHash || '',
        fileHash: certificate.fileHash || '',
        metadataUri: certificate.metadataUrl || '',
        revoked: Boolean(certificate.revokedAt),
        issuedAt: certificate.issueDate ? new Date(certificate.issueDate).getTime().toString() : Date.now().toString(),
        updatedAt: certificate.issueDate ? new Date(certificate.issueDate).getTime().toString() : Date.now().toString(),
        issuer: certificate.institutionName || 'BlockCertify Network',
        reason: certificate.revokedReason || '',
      };
    }

    // Read-only integrity: do NOT mutate certificate status away from issued/revoked
    // Update verification analytics counters atomically without altering certificate lifecycle state
    certificate.lastVerifiedAt = new Date();
    certificate.verificationCount = (certificate.verificationCount || 0) + 1;
    await certificate.save();

    const verifiedAt = new Date().toISOString();
    return {
      certificate,
      sanitized: sanitizePublicVerification(certificate, valid, verifiedAt, chainRecord),
      onChain: chainRecord,
      verifiedAt,
      valid,
    };
  } finally {
    // Record verification event asynchronously
    try {
      await VerificationLog.create({
        certificateId,
        method: context?.method ?? 'id',
        valid,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        actor: context?.actor,
      });
    } catch {
      // Ignore background analytics write errors
    }
  }
};

export const verifyByHash = async (hash: string, context?: Omit<VerificationContext, 'method'>) => {
  const certificate = await Certificate.findOne({ $or: [{ fileHash: hash }, { blockchainHash: hash }] });
  if (!certificate) throw new ApiError(404, 'Credential Not Found — No credential matches the provided document hash.');
  return verifyByCertificateId(certificate.certificateId, { ...context, method: 'hash' });
};

export const verifyByTransaction = async (transactionHash: string, context?: Omit<VerificationContext, 'method'>) => {
  const transaction = await BlockchainTransaction.findOne({ transactionHash }).populate('certificate');
  if (!transaction || !transaction.certificate) throw new ApiError(404, 'Credential Not Found — No credential matches the provided transaction hash.');
  const certificateDoc = transaction.certificate as unknown as { certificateId: string };
  return verifyByCertificateId(certificateDoc.certificateId, { ...context, method: 'transaction' });
};

export const verifyBulk = async (certificateIds: string[], context?: Omit<VerificationContext, 'method'>) => {
  const results: Array<{
    certificateId: string;
    success: boolean;
    data?: Awaited<ReturnType<typeof verifyByCertificateId>>;
    error?: string;
  }> = [];

  for (let index = 0; index < certificateIds.length; index += BULK_ISSUE_BATCH_SIZE) {
    const batch = certificateIds.slice(index, index + BULK_ISSUE_BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map((id) => verifyByCertificateId(id, { ...context, method: 'bulk' })));

    settled.forEach((result, batchIndex) => {
      const certificateId = batch[batchIndex];
      if (result.status === 'fulfilled') {
        results.push({ certificateId, success: true, data: result.value });
        return;
      }
      results.push({ certificateId, success: false, error: getErrorMessage(result.reason) });
    });
  }

  return results;
};

export const revokeCertificate = async ({
  certificateId,
  reason,
  actor,
}: {
  certificateId: string;
  reason: string;
  actor: Express.Request['user'];
}) => {
  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) throw new ApiError(404, 'Certificate not found');

  await assertCertificateAccess(actor, certificate);
  const chainResult = await revokeCertificateOnChain(certificateId, reason);

  certificate.status = 'revoked';
  certificate.revokedAt = new Date();
  certificate.revokedReason = reason;
  certificate.history.push({
    action: 'revoked',
    timestamp: new Date(),
    actor: actor?._id,
    reason,
    transactionHash: chainResult.transactionHash,
  });
  await certificate.save();

  await Institution.findByIdAndUpdate(certificate.institution, { $inc: { 'stats.certificatesRevoked': 1 } });

  await BlockchainTransaction.create({
    certificate: certificate._id,
    action: 'revoke',
    network: 'ethereum',
    chainId: chainResult.chainId || '31337',
    contractAddress: process.env.ETH_CONTRACT_ADDRESS,
    transactionHash: chainResult.transactionHash,
    blockNumber: chainResult.blockNumber,
    gasUsed: chainResult.gasUsed,
    status: 'confirmed',
    payload: { certificateId, reason },
  });

  return certificate;
};

export const revokeBulk = async ({
  certificateIds,
  reason,
  actor,
}: {
  certificateIds: string[];
  reason: string;
  actor: Express.Request['user'];
}) => {
  const results: Array<{
    certificateId: string;
    success: boolean;
    error?: string;
  }> = [];

  for (let index = 0; index < certificateIds.length; index += BULK_ISSUE_BATCH_SIZE) {
    const batch = certificateIds.slice(index, index + BULK_ISSUE_BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((id) => revokeCertificate({ certificateId: id, reason, actor }))
    );

    settled.forEach((result, batchIndex) => {
      const certificateId = batch[batchIndex];
      if (result.status === 'fulfilled') {
        results.push({ certificateId, success: true });
        return;
      }
      results.push({ certificateId, success: false, error: result.reason instanceof Error ? result.reason.message : 'Unknown error' });
    });
  }

  return results;
};

export const updateCertificate = async ({
  certificateId,
  updates,
  actor,
}: {
  certificateId: string;
  updates: CertificateUpdateInput;
  actor: Express.Request['user'];
}) => {
  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) throw new ApiError(404, 'Certificate not found');

  await assertCertificateAccess(actor, certificate);

  if (updates.degree !== undefined) certificate.degree = updates.degree;
  if (updates.course !== undefined) certificate.course = updates.course;
  if (updates.department !== undefined) certificate.department = updates.department;
  if (updates.graduationYear !== undefined) certificate.graduationYear = updates.graduationYear;
  if (updates.expiryDate !== undefined) certificate.expiryDate = updates.expiryDate ? new Date(updates.expiryDate) : undefined;
  if (updates.tags !== undefined) certificate.tags = updates.tags;

  const metadataPayload = buildUpdateMetadataPayload(certificateId, updates);
  const metadataHash = sha256(JSON.stringify(metadataPayload));
  const metadataPin = await pinJsonToIpfs(metadataPayload);
  const chainResult = await updateCertificateOnChain(certificateId, metadataHash, metadataPin.url);

  certificate.metadataHash = metadataHash;
  certificate.metadataCid = metadataPin.cid;
  certificate.metadataUrl = metadataPin.url;
  certificate.version = (certificate.version || 1) + 1;
  certificate.history.push({
    action: 'updated',
    timestamp: new Date(),
    actor: actor?._id,
    changes: updates as unknown as Record<string, unknown>,
    transactionHash: chainResult.transactionHash,
  });
  await certificate.save();

  await BlockchainTransaction.create({
    certificate: certificate._id,
    action: 'update',
    network: 'ethereum',
    chainId: chainResult.chainId || '31337',
    contractAddress: process.env.ETH_CONTRACT_ADDRESS,
    transactionHash: chainResult.transactionHash,
    blockNumber: chainResult.blockNumber,
    gasUsed: chainResult.gasUsed,
    status: 'confirmed',
    payload: { certificateId, updates: metadataPayload },
  });

  return certificate;
};

export const reconcilePendingCertificate = async (certificateId: string) => {
  const certificate = await Certificate.findOne({ certificateId });
  if (!certificate) throw new ApiError(404, 'Certificate not found');

  if (certificate.blockchainStatus === 'confirmed') {
    return { reconciled: false, message: 'Certificate is already confirmed on blockchain', certificate };
  }

  // 1. Check if the certificate is already on chain
  try {
    const chainRecord = await getCertificateOnChain(certificateId);
    if (chainRecord && chainRecord.issuedAt && chainRecord.issuedAt !== '0') {
      certificate.blockchainStatus = 'confirmed';
      certificate.status = chainRecord.revoked ? 'revoked' : 'issued';
      certificate.confirmedAt = new Date();
      certificate.history.push({
        action: 'reconciled_from_chain',
        timestamp: new Date(),
        actor: 'system',
      });
      await certificate.save();

      await BlockchainTransaction.findOneAndUpdate(
        { certificate: certificate._id, action: 'issue' },
        { status: 'confirmed', confirmedAt: new Date() }
      );

      return { reconciled: true, message: 'Certificate successfully reconciled with on-chain record', certificate };
    }
  } catch {
    // Contract check failed, proceed to re-anchoring attempt
  }

  // 2. If not on chain and has metadataHash/fileHash, attempt to re-anchor
  if (certificate.metadataHash && certificate.fileHash) {
    try {
      const chainResult = await issueCertificateOnChain({
        certificateId: certificate.certificateId,
        metadataHash: certificate.metadataHash,
        fileHash: certificate.fileHash,
        metadataUri: certificate.metadataUrl || certificate.ipfsUrl || '',
      });

      if (chainResult && chainResult.transactionHash) {
        certificate.blockchainStatus = 'confirmed';
        certificate.status = 'issued';
        certificate.transactionHash = chainResult.transactionHash;
        certificate.blockNumber = chainResult.blockNumber ?? undefined;
        certificate.contractAddress = process.env.ETH_CONTRACT_ADDRESS;
        certificate.chainId = chainResult.chainId || '31337';
        certificate.confirmedAt = new Date();
        certificate.history.push({
          action: 'reconciled_reanchored_on_chain',
          timestamp: new Date(),
          actor: 'system',
          transactionHash: chainResult.transactionHash,
        });
        await certificate.save();

        await BlockchainTransaction.findOneAndUpdate(
          { certificate: certificate._id, action: 'issue' },
          {
            status: 'confirmed',
            transactionHash: chainResult.transactionHash,
            blockNumber: chainResult.blockNumber,
            gasUsed: chainResult.gasUsed,
            confirmedAt: new Date(),
          },
          { upsert: true }
        );

        return { reconciled: true, message: 'Certificate successfully re-anchored and reconciled on blockchain', certificate };
      }
    } catch (reAnchorErr) {
      certificate.retryCount = (certificate.retryCount || 0) + 1;
      if (certificate.retryCount >= 5) {
        certificate.blockchainStatus = 'failed';
        certificate.failureReason = reAnchorErr instanceof Error ? reAnchorErr.message : 'Exceeded maximum reconciliation retries';
      }
      await certificate.save();
    }
  }

  return { reconciled: false, message: 'Certificate could not be confirmed on blockchain yet', certificate };
};

export const reconcileAllPendingCertificates = async () => {
  const pendingCertificates = await Certificate.find({ blockchainStatus: 'pending' }).limit(50);
  const results = [];
  for (const cert of pendingCertificates) {
    const outcome = await reconcilePendingCertificate(cert.certificateId);
    results.push(outcome);
  }
  return {
    processed: pendingCertificates.length,
    reconciled: results.filter((r) => r.reconciled).length,
    results,
  };
};

export const getLatestCertificates = async (limit = 10) => {
  const certificates = await Certificate.find({ status: 'issued', blockchainStatus: 'confirmed' })
    .sort({ issueDate: -1 })
    .limit(limit)
    .populate('institution', 'name logo')
    .select('certificateId studentName course institutionName issueDate transactionHash');

  return certificates;
};
