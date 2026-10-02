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

jest.mock('../models/User.js', () => {
  const defaultUser = {
    _id: 'user-default',
    id: 'user-default',
    email: 'user@test.edu',
    role: 'institution',
    institution: 'inst-real-1',
    isActive: true,
    subscription: { tier: 'free' },
    save: jest.fn().mockResolvedValue(undefined),
  };

  const createThenable = (data: any) => ({
    ...data,
    populate: jest.fn().mockResolvedValue(data),
    then(resolve: any, reject: any) {
      return Promise.resolve(data).then(resolve, reject);
    },
  });

  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      findById: jest.fn().mockImplementation((id: string) =>
        createThenable({ ...defaultUser, _id: id, id })
      ),
      create: jest.fn(),
    },
  };
});

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
    find: jest.fn(),
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
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../models/VerificationLog.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

jest.mock('../services/ipfsService.js', () => ({
  pinFileToIpfs: jest.fn().mockImplementation(() => Promise.resolve({ cid: 'mock-cid-file', url: 'ipfs://mock-file' })),
  pinJsonToIpfs: jest.fn().mockImplementation(() => Promise.resolve({ cid: 'mock-cid-json', url: 'ipfs://mock-json' })),
}));

jest.mock('../services/blockchainService.js', () => ({
  issueCertificateOnChain: jest.fn().mockImplementation(() =>
    Promise.resolve({
      transactionHash: '0xmocktxhash',
      blockNumber: 12345,
      gasUsed: '21000',
      walletAddress: '0xmocksigner',
      chainId: '31337',
    })
  ),
  updateCertificateOnChain: jest.fn().mockImplementation(() =>
    Promise.resolve({
      transactionHash: '0xmocktxhashupdate',
      blockNumber: 12346,
      gasUsed: '22000',
      chainId: '31337',
    })
  ),
  revokeCertificateOnChain: jest.fn().mockImplementation(() =>
    Promise.resolve({
      transactionHash: '0xmocktxhashrevoke',
      blockNumber: 12347,
      gasUsed: '23000',
    })
  ),
  getCertificateOnChain: jest.fn().mockImplementation(() =>
    Promise.resolve({
      certificateId: 'BC-MOCK',
      metadataHash: 'mock-meta-hash',
      fileHash: 'mock-file-hash',
      metadataUri: 'ipfs://mock-json',
      revoked: false,
      issuedAt: '1700000000',
      updatedAt: '1700000000',
      issuer: 'Test Institution',
    })
  ),
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../services/auditService.js', () => ({
  createAuditLog: jest.fn().mockImplementation(() => Promise.resolve()),
}));

import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import Certificate from '../models/Certificate.js';
import {
  issueCertificate,
  sanitizePublicVerification,
  reconcilePendingCertificate,
} from '../services/certificateService.js';
import { resolveAuthorizedInstitutionId, assertCertificateAccess } from '../utils/authorization.js';
import { register, updateSubscription } from '../controllers/authController.js';
import { createStudent, listStudents } from '../controllers/studentController.js';
import { getCertificateOnChain, issueCertificateOnChain } from '../services/blockchainService.js';

const defaultUser = {
  _id: 'user-default',
  id: 'user-default',
  email: 'user@test.edu',
  role: 'institution',
  institution: 'inst-real-1',
  isActive: true,
  subscription: { tier: 'free' },
  save: jest.fn().mockResolvedValue(undefined),
};

const createThenable = (data: any) => ({
  ...data,
  populate: jest.fn().mockResolvedValue(data),
  then(resolve: any, reject: any) {
    return Promise.resolve(data).then(resolve, reject);
  },
});

const executeController = (controller: any, req: any, res: any) =>
  new Promise<{ res: any; error?: any }>((resolve) => {
    const next = (err: any) => {
      resolve({ res, error: err });
    };
    try {
      controller(req, res, next);
    } catch (err) {
      resolve({ res, error: err });
    }
    setTimeout(() => resolve({ res }), 50);
  });

describe('BlockCertify — Complete Security, Tenant Isolation, Student & Persistence Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockImplementation((id: string) =>
      createThenable({ ...defaultUser, _id: id, id })
    );
  });

  describe('1. Registration & Subscription Role Security', () => {
    it('public registration rejects admin role escalation with 403', async () => {
      const req = {
        body: {
          name: 'Attacker',
          email: 'attacker@evil.com',
          password: 'Password@123',
          role: 'admin',
        },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(register, req, res);
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('Administrator accounts cannot be registered publicly');
    });

    it('updateSubscription rejects non-admin users with 403', async () => {
      const req = {
        user: { _id: 'user-1', email: 'inst@test.edu', role: 'institution' },
        body: { tier: 'Enterprise' },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(updateSubscription, req, res);
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('Subscription plan upgrades require administrator approval or payment checkout.');
    });

    it('updateSubscription allows admin users to upgrade tier', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@blockcertify.com',
        role: 'admin',
        subscription: { tier: 'free' },
        save: jest.fn().mockResolvedValue(undefined),
      };
      (User.findById as jest.Mock).mockReturnValue(createThenable(mockUser));

      const req = {
        user: { _id: 'admin-1', email: 'admin@blockcertify.com', role: 'admin' },
        body: { tier: 'Enterprise' },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(updateSubscription, req, res);
      expect(error).toBeUndefined();
      expect(mockUser.subscription.tier).toBe('Enterprise');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Subscription updated successfully',
        })
      );
    });
  });

  describe('2. Student Management & Scoped Creation', () => {
    it('resolveAuthorizedInstitutionId ignores client-supplied id for institution role', async () => {
      const institutionUser = {
        _id: 'user-inst-1',
        role: 'institution',
        institution: 'inst-authoritative-123',
      };

      (User.findById as jest.Mock).mockReturnValue(
        createThenable({ ...defaultUser, _id: 'user-inst-1', institution: 'inst-authoritative-123' })
      );

      const resolved = await resolveAuthorizedInstitutionId(institutionUser as any, 'inst-attacker-999');
      expect(resolved).toBe('inst-authoritative-123');
    });

    it('createStudent automatically attaches authenticated institution', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue({
        _id: 'inst-real-1',
        name: 'Future University',
        status: 'approved',
      });
      (Student.findOne as jest.Mock).mockResolvedValue(null);
      (Student.create as jest.Mock).mockImplementation((data: any) => Promise.resolve({ ...data, id: 'stu-1' }));

      const req = {
        user: { _id: 'inst-user-1', email: 'registrar@fu.edu', role: 'institution', institution: 'inst-real-1' },
        body: {
          name: 'Varsha Sharma',
          studentId: '21-ICS-054',
          email: 'varsha@fu.edu',
          degree: 'Bachelor of Technology',
          course: 'CSE',
          department: 'School of ICT',
          graduationYear: 2026,
        },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(createStudent, req, res);
      expect(error).toBeUndefined();
      expect(Student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Varsha Sharma',
          studentId: '21-ICS-054',
          institution: 'inst-real-1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('createStudent rejects studentId belonging to another institution with 403', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue({
        _id: 'inst-real-1',
        name: 'Future University',
      });
      (Student.findOne as jest.Mock).mockResolvedValue({
        _id: 'stu-foreign',
        studentId: '21-ICS-054',
        institution: 'inst-other-999',
      });

      const req = {
        user: { _id: 'inst-user-1', email: 'registrar@fu.edu', role: 'institution', institution: 'inst-real-1' },
        body: {
          name: 'Varsha Sharma',
          studentId: '21-ICS-054',
          email: 'varsha@fu.edu',
          degree: 'Bachelor of Technology',
          course: 'CSE',
          department: 'School of ICT',
          graduationYear: 2026,
        },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(createStudent, req, res);
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('This student belongs to another institution and cannot be registered here.');
    });

    it('listStudents scopes query strictly to authenticated institution', async () => {
      const mockStudents = [{ name: 'Alice', studentId: 'A1', institution: 'inst-real-1' }];
      const sortMock = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue(mockStudents) });
      (Student.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const req = {
        user: { _id: 'inst-user-1', role: 'institution', institution: 'inst-real-1' },
        query: { q: 'Alice' },
      } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

      const { error } = await executeController(listStudents, req, res);
      expect(error).toBeUndefined();
      expect(Student.find).toHaveBeenCalledWith(
        expect.objectContaining({
          institution: 'inst-real-1',
        })
      );
    });
  });

  describe('3. Cross-Institution Tenant Isolation & Fallback Removal', () => {
    it('issueCertificate throws 404 when institution is not verified (no fallback allowed)', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        issueCertificate({
          payload: {
            studentName: 'Bob',
            studentId: 'BOB-1',
            email: 'bob@example.com',
            degree: 'BSc',
            course: 'Physics',
            department: 'Science',
            graduationYear: 2025,
            issueDate: '2025-01-01',
          },
          fileBuffer: Buffer.from('fake pdf'),
          originalFileName: 'cert.pdf',
          mimeType: 'application/pdf',
          actor: { _id: 'u-1', email: 'u@test.com', role: 'institution', institution: 'fake-inst' } as any,
        })
      ).rejects.toThrow('Your institution could not be verified. Please contact an administrator.');
    });

    it('issueCertificate rejects issuing certificate for student belonging to another institution with 403', async () => {
      (Institution.findById as jest.Mock).mockResolvedValue({
        _id: 'inst-A',
        name: 'University A',
        status: 'approved',
      });
      (Student.findOne as jest.Mock).mockResolvedValue({
        _id: 'stu-B',
        studentId: 'STU-100',
        institution: 'inst-B',
      });

      await expect(
        issueCertificate({
          payload: {
            studentName: 'Hijacked Student',
            studentId: 'STU-100',
            email: 'hijack@example.com',
            degree: 'BSc',
            course: 'Physics',
            department: 'Science',
            graduationYear: 2025,
            issueDate: '2025-01-01',
          },
          fileBuffer: Buffer.from('fake pdf'),
          originalFileName: 'cert.pdf',
          mimeType: 'application/pdf',
          actor: { _id: 'u-1', email: 'u@test.com', role: 'institution', institution: 'inst-A' } as any,
        })
      ).rejects.toThrow('This student belongs to another institution and cannot be used for this certificate.');
    });

    it('assertCertificateAccess blocks cross-institution view/update/revocation', async () => {
      const foreignCertificate = {
        certificateId: 'BC-FOREIGN',
        institution: 'inst-B',
      } as any;

      const actorFromInstA = {
        _id: 'user-inst-A',
        role: 'institution',
        institution: 'inst-A',
      } as any;

      await expect(assertCertificateAccess(actorFromInstA, foreignCertificate)).rejects.toThrow(
        'Cross-institution operations are strictly forbidden'
      );
    });
  });

  describe('4. Public Verification & Data Leak Prevention', () => {
    it('sanitizePublicVerification hides email, MongoDB _id, and internal references', () => {
      const fullDoc = {
        _id: '654321098765432109876543',
        certificateId: 'BC-VALID-1',
        student: '654321098765432109876544',
        institution: '654321098765432109876545',
        studentName: 'Public Graduate',
        studentId: 'STU-PUB',
        email: 'secret_student@domain.edu',
        degree: 'Bachelor of Arts',
        course: 'History',
        department: 'Humanities',
        institutionName: 'Open Academy',
        graduationYear: 2024,
        issueDate: new Date('2024-05-20'),
        fileHash: 'filehash123',
        metadataHash: 'metahash123',
        blockchainStatus: 'confirmed',
        transactionHash: '0xconfirmedtx',
        network: 'ethereum',
        status: 'issued',
        preparedBy: 'Staff A',
        approvedBy: 'Dean B',
      };

      const result = sanitizePublicVerification(fullDoc as any, true, new Date().toISOString());

      expect(result.certificateId).toBe('BC-VALID-1');
      expect(result.studentName).toBe('Public Graduate');
      expect((result as any)._id).toBeUndefined();
      expect((result as any).email).toBeUndefined();
      expect((result as any).student).toBeUndefined();
      expect((result as any).institution).toBeUndefined();
      expect((result as any).preparedBy).toBeUndefined();
      expect((result as any).approvedBy).toBeUndefined();
    });
  });

  describe('5. Reconciliation Engine Recovery', () => {
    it('reconciles pending certificate by anchoring on chain and setting confirmed', async () => {
      const pendingCert = {
        certificateId: 'BC-PENDING-RECOVER',
        blockchainStatus: 'pending',
        fileHash: 'file-hash-1',
        metadataHash: 'meta-hash-1',
        metadataUrl: 'ipfs://meta-1',
        retryCount: 0,
        history: [],
        save: jest.fn().mockResolvedValue(undefined),
      };

      (Certificate.findOne as jest.Mock).mockResolvedValue(pendingCert);
      (getCertificateOnChain as jest.Mock).mockRejectedValue(new Error('Not yet on chain'));
      (issueCertificateOnChain as jest.Mock).mockResolvedValue({
        transactionHash: '0xrecoverytx',
        blockNumber: 500,
        gasUsed: '25000',
        chainId: '31337',
      });

      const result = await reconcilePendingCertificate('BC-PENDING-RECOVER');

      expect(result.reconciled).toBe(true);
      expect(pendingCert.blockchainStatus).toBe('confirmed');
      expect(pendingCert.save).toHaveBeenCalled();
    });
  });
});
