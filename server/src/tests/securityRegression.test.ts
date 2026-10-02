import { jest } from '@jest/globals';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_mock_password')),
    compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
  },
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_mock_password')),
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../models/Institution.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../models/Student.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../models/Certificate.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../models/BlockchainTransaction.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../models/VerificationLog.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('../services/ipfsService.js', () => ({
  pinFileToIpfs: jest.fn(),
  pinJsonToIpfs: jest.fn(),
}));

jest.mock('../services/blockchainService.js', () => ({
  issueCertificateOnChain: jest.fn(),
  revokeCertificateOnChain: jest.fn(),
  updateCertificateOnChain: jest.fn(),
  getCertificateOnChain: jest.fn(),
}));

jest.mock('../services/notificationService.js', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../services/auditService.js', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import Certificate from '../models/Certificate.js';
import { pinFileToIpfs, pinJsonToIpfs } from '../services/ipfsService.js';
import { issueCertificateOnChain } from '../services/blockchainService.js';
import { sendEmail } from '../services/emailService.js';
import { register, resetPassword } from '../controllers/authController.js';
import {
  issueCertificate,
  bulkIssueCertificates,
  revokeCertificate,
  updateCertificate,
  verifyByCertificateId,
  sanitizePublicVerification,
} from '../services/certificateService.js';
import { assertCertificateAccess } from '../utils/authorization.js';
import { createMockResponse } from './testUtils.js';
import { sha256 } from '../utils/hash.js';

describe('Production Hardening & Security Regression Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Authentication & Role Privilege Escalation', () => {
    it('strictly forbids public registration with admin role', async () => {
      const req = {
        body: {
          name: 'Attacker Admin',
          email: 'attacker@example.com',
          password: 'Password123!',
          role: 'admin',
        },
      };
      const res = createMockResponse();
      const next = jest.fn();

      register(req as never, res as never, next);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/invalid|admin|forbidden/i),
        })
      );
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Multi-Tenant Institution Isolation', () => {
    it('prevents Institution A from accessing Institution B certificate', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'user-inst-a',
          role: 'institution',
          institution: 'inst-a',
          isActive: true,
        }),
      });

      const certB = {
        institution: 'inst-b',
        student: 'student-1',
        studentId: 'STU-1',
      };

      await expect(
        assertCertificateAccess(
          { _id: 'user-inst-a', role: 'institution', email: 'a@uni.edu' } as never,
          certB as never
        )
      ).rejects.toThrow('Cross-institution operations are strictly forbidden');
    });

    it('prevents Institution A from revoking Institution B certificate', async () => {
      (Certificate.findOne as jest.Mock).mockResolvedValue({
        _id: 'cert-1',
        certificateId: 'BC-1234',
        institution: 'inst-b',
        revokedAt: null,
      });

      await expect(
        revokeCertificate({
          certificateId: 'BC-1234',
          reason: 'Revoke attempt by unauthorized tenant',
          actor: { _id: 'user-a', role: 'institution', institution: 'inst-a', email: 'a@uni.edu' } as never,
        })
      ).rejects.toThrow('Cross-institution operations are strictly forbidden');
    });

    it('prevents Institution A from updating Institution B certificate', async () => {
      (Certificate.findOne as jest.Mock).mockResolvedValue({
        _id: 'cert-1',
        certificateId: 'BC-1234',
        institution: 'inst-b',
        revokedAt: null,
      });

      await expect(
        updateCertificate({
          certificateId: 'BC-1234',
          updates: { degree: 'Master of Science' },
          actor: { _id: 'user-a', role: 'institution', institution: 'inst-a', email: 'a@uni.edu' } as never,
        })
      ).rejects.toThrow('Cross-institution operations are strictly forbidden');
    });
  });

  describe('3. Student Privacy & Isolation', () => {
    it('prevents student from accessing another student certificate', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'user-student-1',
          role: 'student',
          student: { studentId: 'STU-001' },
          isActive: true,
        }),
      });

      const certStudent2 = {
        institution: 'inst-a',
        student: 'other-student-obj',
        studentId: 'STU-999',
      };

      await expect(
        assertCertificateAccess(
          { _id: 'user-student-1', role: 'student', email: 's1@example.com' } as never,
          certStudent2 as never
        )
      ).rejects.toThrow('Certificate access denied');
    });
  });

  describe('4. Subscription Tier Quota Enforcement', () => {
    it('enforces free tier maximum limit of 3 certificates', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue({
        _id: 'inst-free',
        name: 'Free College',
        status: 'approved',
        subscription: { tier: 'free', maxCertificates: 3 },
      });

      (Certificate.countDocuments as jest.Mock).mockResolvedValue(3);

      await expect(
        issueCertificate({
          payload: {
            studentName: 'Charlie',
            studentId: 'STU-CHARLIE',
            email: 'charlie@example.com',
            degree: 'BA',
            course: 'History',
            department: 'Humanities',
            institutionId: 'inst-free',
            institutionName: 'Free College',
            graduationYear: 2024,
            issueDate: '2024-06-01',
          },
          pdfBuffer: Buffer.from('dummy pdf'),
          pdfFileName: 'cert.pdf',
          actorId: 'actor-1',
        })
      ).rejects.toThrow(/Subscription limit reached|Free plan is limited to 3 certificates/i);
    });

    it('blocks bulk certificate issuance for free plan', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue({
        _id: 'inst-free',
        name: 'Free College',
        status: 'approved',
        subscription: { tier: 'free' },
      });

      const csv = Buffer.from(
        'studentName,studentId,email,degree,course,department,graduationYear,issueDate\nAlice,STU-1,alice@example.com,BSc,CS,Eng,2024,2024-05-01'
      );

      await expect(
        bulkIssueCertificates({
          csvBuffer: csv,
          institutionId: 'inst-free',
          actorId: 'actor-1',
        })
      ).rejects.toThrow(/Bulk issuance is not available on the Free plan/i);
    });
  });

  describe('5. Password Reset Security', () => {
    it('successfully resets password with valid hashed token and matches confirmation', async () => {
      const rawToken = 'valid-reset-token-12345';
      const userMock = {
        email: 'user@example.com',
        resetPasswordToken: sha256(rawToken),
        resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins in future
        save: jest.fn().mockResolvedValue(undefined),
      };

      (User.findOne as jest.Mock).mockResolvedValue(userMock);

      const req = {
        body: {
          token: rawToken,
          email: 'user@example.com',
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        },
      };
      const res = createMockResponse();
      const next = jest.fn();

      resetPassword(req as never, res as never, next);
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (next.mock.calls.length > 0) {
        console.error('RESET_PASSWORD_FAILED_WITH:', next.mock.calls[0][0]);
      }

      expect(res.status).toHaveBeenCalledWith(200);
      expect(userMock.save).toHaveBeenCalled();
      expect(userMock.resetPasswordToken).toBeUndefined();
      expect(userMock.resetPasswordExpires).toBeUndefined();
    });

    it('rejects password reset with expired token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = {
        body: {
          token: 'expired-token-12345',
          email: 'user@example.com',
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        },
      };
      const res = createMockResponse();
      const next = jest.fn();

      resetPassword(req as never, res as never, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/invalid or expired/i),
        })
      );
    });

    it('rejects password reset when passwords do not match', async () => {
      const req = {
        body: {
          token: 'some-token-12345',
          email: 'user@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword456!',
        },
      };
      const res = createMockResponse();
      const next = jest.fn();

      resetPassword(req as never, res as never, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/passwords do not match/i),
        })
      );
    });
  });

  describe('6. Public Verification Read-Only & Privacy', () => {
    it('preserves issued status and updates only verification metadata during verification', async () => {
      const certDoc = {
        _id: 'cert-1',
        certificateId: 'BC-READONLY-1',
        studentName: 'Alice Smith',
        status: 'issued',
        fileHash: 'sha256-file-hash',
        metadataHash: 'sha256-meta-hash',
        verificationCount: 5,
        lastVerifiedAt: undefined,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Certificate.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(certDoc),
      });

      const result = await verifyByCertificateId('BC-READONLY-1');

      expect(certDoc.status).toBe('issued');
      expect(certDoc.verificationCount).toBe(6);
      expect(certDoc.save).toHaveBeenCalled();
      expect(result.valid).toBe(true);
    });

    it('sanitizes public verification data without leaking student email or internal database IDs', () => {
      const internalCert = {
        _id: 'mongo-id-secret-999',
        certificateId: 'BC-PUBLIC-1',
        student: { _id: 'student-mongo-id', email: 'private_student@example.com' },
        studentName: 'Private Student',
        email: 'private_student@example.com',
        degree: 'Bachelor of Science',
        course: 'Computer Science',
        department: 'Engineering',
        institutionName: 'State Tech',
        issueDate: new Date('2024-01-01'),
        status: 'issued',
        blockchainStatus: 'confirmed',
        transactionHash: '0xabc123',
        network: 'ethereum',
      };

      const sanitized = sanitizePublicVerification(internalCert as never, true, new Date().toISOString());

      expect(sanitized.certificateId).toBe('BC-PUBLIC-1');
      expect(sanitized.studentName).toBe('Private Student');
      expect(sanitized.degree).toBe('Bachelor of Science');
      expect((sanitized as Record<string, unknown>)._id).toBeUndefined();
      expect((sanitized as Record<string, unknown>).email).toBeUndefined();
      expect((sanitized as Record<string, unknown>).student).toBeUndefined();
    });
  });

  describe('7. Bulk CSV Processing & Row-Level Error Handling', () => {
    it('detects invalid rows and invalid email format with row numbers while processing valid rows', async () => {
      const institution = {
        _id: 'inst-growth',
        name: 'Growth Academy',
        status: 'approved',
        subscription: { tier: 'Growth', allowBulk: true },
        stats: { certificatesIssued: 0, studentsManaged: 0 },
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Institution.findById as jest.Mock).mockResolvedValue(institution);
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'actor-1', subscription: { tier: 'Growth' } });
      (Student.findOne as jest.Mock).mockResolvedValue(null);
      (Student.create as jest.Mock).mockResolvedValue({ _id: 'student-id-1' });
      (pinFileToIpfs as jest.Mock).mockResolvedValue({ cid: 'cid-1', url: 'ipfs://file-1' });
      (pinJsonToIpfs as jest.Mock).mockResolvedValue({ cid: 'meta-1', url: 'ipfs://meta-1' });
      (issueCertificateOnChain as jest.Mock).mockResolvedValue({
        transactionHash: '0x123',
        blockNumber: 1,
        gasUsed: '1000',
        walletAddress: '0xabc',
      });
      (sendEmail as jest.Mock).mockResolvedValue(undefined);

      const csv = Buffer.from(
        [
          'studentName,studentId,email,degree,course,department,graduationYear,issueDate',
          'Good Student,STU-VALID,good@example.com,BSc,Math,Sciences,2024,2024-01-01',
          'Bad Email,STU-INVALID,not-an-email,BSc,Math,Sciences,2024,2024-01-01',
        ].join('\n')
      );

      (Certificate.create as jest.Mock).mockImplementation(async (payload: Record<string, unknown>) => ({
        ...payload,
        _id: 'doc-id',
        save: jest.fn().mockResolvedValue(undefined),
      }));

      const results = await bulkIssueCertificates({
        csvBuffer: csv,
        institutionId: 'inst-growth',
        actorId: 'actor-1',
      });

      expect(results.succeeded).toHaveLength(1);
      expect(results.failed).toHaveLength(1);
      expect(results.failed[0].error).toContain('Row 3: Invalid email format');
    });
  });
});
