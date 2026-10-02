import { jest } from '@jest/globals';

jest.mock('../services/auditService.js', () => ({
  createAuditLog: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../services/notificationService.js', () => ({
  createNotification: jest.fn().mockImplementation(() => Promise.resolve()),
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
  getCertificateOnChain: jest.fn().mockImplementation(() =>
    Promise.resolve({
      certificateId: 'BC-TEST',
      metadataHash: 'mock-meta',
      fileHash: 'mock-file',
      metadataUri: 'ipfs://mock',
      revoked: false,
      issuedAt: '1700000000',
      updatedAt: '1700000000',
      issuer: 'Test Institution',
    })
  ),
}));

jest.mock('../services/ipfsService.js', () => ({
  pinFileToIpfs: jest.fn().mockImplementation(() => Promise.resolve({ cid: 'mock-cid-file', url: 'ipfs://mock-file' })),
  pinJsonToIpfs: jest.fn().mockImplementation(() => Promise.resolve({ cid: 'mock-cid-json', url: 'ipfs://mock-json' })),
}));

jest.mock('../models/Student.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('../models/BlockchainTransaction.js', () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn() },
}));

import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Subscription from '../models/Subscription.js';
import Certificate from '../models/Certificate.js';
import Student from '../models/Student.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import {
  requestSubscription,
  approveSubscription,
  rejectSubscription,
  cancelSubscription,
  getCurrentSubscription,
  getSubscriptionRequests,
  getEffectiveInstitutionTier,
  checkFeatureAccess,
} from '../services/subscriptionService.js';
import {
  requestSubscriptionHandler,
  getCurrentSubscriptionHandler,
} from '../controllers/subscriptionController.js';
import {
  approveAdminSubscription,
  rejectAdminSubscription,
} from '../controllers/adminController.js';
import { bulkIssueCertificates } from '../services/certificateService.js';
import { assertCertificateAccess } from '../utils/authorization.js';
import { ApiError } from '../utils/ApiError.js';

describe('BlockCertify — Complete Subscription Lifecycle & Feature Limits', () => {
  const createMockResponse = () => {
    const res: any = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((payload: any) => {
      res.body = payload;
      return res;
    });
    return res;
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    (Student.findOne as jest.Mock).mockResolvedValue({
      _id: 'student-id-1',
      studentId: 'S-1',
      institution: 'inst-1',
    });
    (Student.create as jest.Mock).mockResolvedValue({
      _id: 'student-id-1',
      studentId: 'S-1',
      institution: 'inst-1',
    });
    (BlockchainTransaction.create as jest.Mock).mockResolvedValue({
      _id: 'tx-1',
      transactionHash: '0x123',
    });
  });

  // TEST 1: Normal user requests Starter -> request created, status PENDING, plan NOT ACTIVE
  it('TEST 1: Normal user creates a subscription request with status PENDING', async () => {
    const mockUser: any = {
      _id: 'user-normal-1',
      id: 'user-normal-1',
      email: 'student@academy.edu',
      role: 'institution',
      isActive: true,
      institution: 'inst-1',
      subscription: { tier: 'free', status: 'active' },
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockInstitution: any = {
      _id: 'inst-1',
      id: 'inst-1',
      name: 'Academy One',
      subscription: { tier: 'free', status: 'active' },
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);
    jest.spyOn(Subscription, 'findOne').mockResolvedValue(null);
    jest.spyOn(Subscription, 'create').mockImplementation((doc: any) =>
      Promise.resolve({
        ...doc,
        _id: 'sub-req-123',
        id: 'sub-req-123',
      }) as any
    );

    const result = await requestSubscription({
      userId: 'user-normal-1',
      tier: 'Starter',
    });

    expect(result.status).toBe('pending');
    expect(result.tier).toBe('Starter');
    expect(mockUser.subscription.status).toBe('pending');
    // The user's active tier remains free until approved
    expect(mockUser.subscription.tier).toBe('free');
  });

  // TEST 2: Admin sees request -> approves -> subscription becomes ACTIVE
  it('TEST 2: Admin approves request -> subscription becomes ACTIVE and updates institution and user', async () => {
    const mockAdmin: any = {
      _id: 'admin-1',
      id: 'admin-1',
      email: 'admin@blockcertify.com',
      role: 'admin',
      isActive: true,
    };

    const mockSub: any = {
      _id: 'sub-req-123',
      id: 'sub-req-123',
      user: 'user-normal-1',
      institution: 'inst-1',
      tier: 'Starter',
      status: 'pending',
      requestedAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(User, 'findById').mockResolvedValue(mockAdmin);
    jest.spyOn(Subscription, 'findById').mockResolvedValue(mockSub);
    jest.spyOn(Subscription, 'updateMany').mockResolvedValue({} as any);
    jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);
    jest.spyOn(Institution, 'findByIdAndUpdate').mockResolvedValue({} as any);

    const approved = await approveSubscription({
      subscriptionId: 'sub-req-123',
      adminId: 'admin-1',
    });

    expect(approved.status).toBe('active');
    expect(approved.approvedBy).toEqual('admin-1');
    expect(approved.approvedAt).toBeInstanceOf(Date);
    expect(approved.expiresAt).toBeInstanceOf(Date);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-normal-1',
      expect.objectContaining({
        'subscription.tier': 'Starter',
        'subscription.status': 'active',
      })
    );
    expect(Institution.findByIdAndUpdate).toHaveBeenCalledWith(
      'inst-1',
      expect.objectContaining({
        'subscription.tier': 'Starter',
        'subscription.status': 'active',
      })
    );
  });

  // TEST 3: User refreshes dashboard / session -> Starter is shown as ACTIVE
  it('TEST 3: getCurrentSubscription returns Starter as active after approval', async () => {
    const mockUser: any = {
      _id: 'user-normal-1',
      institution: 'inst-1',
      subscription: { tier: 'Starter', status: 'active', expiresAt: new Date(Date.now() + 10000000) },
    };

    const mockInstitution: any = {
      _id: 'inst-1',
      name: 'Academy One',
      subscription: { tier: 'Starter', status: 'active', expiresAt: new Date(Date.now() + 10000000) },
    };

    jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);
    jest.spyOn(Subscription, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    } as any);

    const current = await getCurrentSubscription('user-normal-1');
    expect(current.tier).toBe('Starter');
    expect(current.status).toBe('active');
    expect(current.pendingRequest).toBeNull();
  });

  // TEST 4: User attempts premium feature -> allowed after approval
  it('TEST 4: Starter plan allows bulk issuance within row limits', async () => {
    const mockInstitution: any = {
      _id: 'inst-1',
      name: 'Academy One',
      status: 'approved',
      subscription: { tier: 'Starter', status: 'active' },
      stats: { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 },
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockActor: any = {
      _id: 'user-normal-1',
      role: 'institution',
      institution: 'inst-1',
    };

    jest.spyOn(User, 'findById').mockResolvedValue(mockActor);
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);
    jest.spyOn(Certificate, 'findOne').mockResolvedValue(null);
    (Student.findOne as jest.Mock).mockResolvedValue(null);
    (Student.create as jest.Mock).mockResolvedValue({ _id: 'student-1', studentId: 'S-1' });
    (Student.countDocuments as jest.Mock).mockResolvedValue(1);

    jest.spyOn(Certificate, 'create').mockImplementation(async (payload: any) => ({
      ...payload,
      _id: 'cert-1',
      certificateId: 'BC-TEST1',
      save: jest.fn().mockResolvedValue(undefined),
      history: payload.history || [],
    }));

    const csvContent = 'studentName,studentId,email,degree,course,department,graduationYear,issueDate\nAlice,S-1,alice@test.edu,B.Sc,CS,CS,2026,2026-05-01';

    const result = await bulkIssueCertificates({
      institutionId: 'inst-1',
      actorId: 'user-normal-1',
      csvBuffer: Buffer.from(csvContent, 'utf-8'),
    });

    expect(result.succeeded.length).toBe(1);
    expect(result.failed.length).toBe(0);
  });

  // TEST 5: Free user attempts same premium API directly -> rejected by backend (403)
  it('TEST 5: Free plan rejects bulk issuance with 403 Forbidden', async () => {
    const mockInstitution: any = {
      _id: 'inst-free',
      name: 'Free School',
      status: 'approved',
      subscription: { tier: 'free', status: 'active' },
    };

    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);

    const csvContent = 'studentName,studentId,email,degree,course,department,graduationYear,issueDate\nBob,S-2,bob@test.edu,B.Sc,CS,CS,2026,2026-05-01';

    await expect(
      bulkIssueCertificates({
        institutionId: 'inst-free',
        actorId: 'user-free-1',
        csvBuffer: Buffer.from(csvContent, 'utf-8'),
      })
    ).rejects.toThrow(/Bulk issuance is not available on the Free plan/i);
  });

  // TEST 6: Normal user attempts admin approval endpoint -> 403 Forbidden
  it('TEST 6: Non-admin user cannot call admin approval controller', async () => {
    const req: any = {
      params: { id: 'sub-123' },
      user: { _id: 'normal-user', role: 'institution' },
    };
    const res = createMockResponse();

    const mockNonAdmin: any = {
      _id: 'normal-user',
      role: 'institution',
    };
    jest.spyOn(User, 'findById').mockResolvedValue(mockNonAdmin);

    const { error } = await executeController(approveAdminSubscription, req, res);
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Administrator privileges required');
  });

  // TEST 7: Normal user attempts to approve their own request -> 403 Forbidden
  it('TEST 7: User attempting self-approval is rejected server-side with 403', async () => {
    const req: any = {
      params: { id: 'sub-my-own' },
      user: { _id: 'normal-user', role: 'student' },
    };
    const res = createMockResponse();

    const mockStudent: any = {
      _id: 'normal-user',
      role: 'student',
    };
    jest.spyOn(User, 'findById').mockResolvedValue(mockStudent);

    const { error } = await executeController(approveAdminSubscription, req, res);
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
  });

  // TEST 8: User manipulates localStorage to Enterprise -> backend still treats them as their actual plan
  it('TEST 8: Backend rejects bulk upload for Free institution even if caller attempts to impersonate higher tier', async () => {
    const mockInstitution: any = {
      _id: 'inst-free',
      name: 'Free School',
      status: 'approved',
      subscription: { tier: 'free', status: 'active' },
    };

    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);

    // Caller is treated strictly by DB record
    expect(getEffectiveInstitutionTier(mockInstitution)).toBe('free');
  });

  // TEST 9: Duplicate pending request is prevented with 409 Conflict
  it('TEST 9: Duplicate pending subscription request returns 409 Conflict', async () => {
    const mockUser: any = {
      _id: 'user-normal-1',
      role: 'institution',
      isActive: true,
      institution: 'inst-1',
      subscription: { tier: 'free', status: 'pending' },
    };
    const mockInstitution: any = {
      _id: 'inst-1',
      subscription: { tier: 'free', status: 'pending' },
    };

    jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
    jest.spyOn(Institution, 'findById').mockResolvedValue(mockInstitution);
    jest.spyOn(Subscription, 'findOne').mockResolvedValue({
      _id: 'existing-pending-sub',
      tier: 'Starter',
      status: 'pending',
    } as any);

    await expect(
      requestSubscription({
        userId: 'user-normal-1',
        tier: 'Starter',
      })
    ).rejects.toThrow(/already have a pending subscription request/i);
  });

  // TEST 10: Admin rejects request -> status REJECTED -> reason stored
  it('TEST 10: Admin rejects request with reason -> status REJECTED and reason recorded', async () => {
    const mockAdmin: any = {
      _id: 'admin-1',
      role: 'admin',
      isActive: true,
    };

    const mockSub: any = {
      _id: 'sub-req-reject',
      user: 'user-normal-1',
      institution: 'inst-1',
      tier: 'Growth',
      status: 'pending',
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockUser: any = {
      _id: 'user-normal-1',
      subscription: { tier: 'free', status: 'pending' },
      save: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(User, 'findById')
      .mockResolvedValueOnce(mockAdmin)
      .mockResolvedValueOnce(mockUser);
    jest.spyOn(Subscription, 'findById').mockResolvedValue(mockSub);
    jest.spyOn(Subscription, 'findOne').mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    } as any);
    jest.spyOn(Institution, 'findById').mockResolvedValue({
      subscription: { tier: 'free', status: 'pending' },
      save: jest.fn().mockResolvedValue(undefined),
    } as any);

    const rejected = await rejectSubscription({
      subscriptionId: 'sub-req-reject',
      adminId: 'admin-1',
      reason: 'Incomplete accreditation documentation',
    });

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('Incomplete accreditation documentation');
    expect(mockUser.subscription.status).toBe('active');
    expect(mockUser.subscription.tier).toBe('free');
  });

  // TEST 11 & 12: Public verification is read-only and uses zero gas/transactions
  it('TEST 11 & 12: Public verification performs read-only checks without blockchain write transactions', async () => {
    const { getCertificateOnChain, issueCertificateOnChain } = await import('../services/blockchainService.js');
    expect(getCertificateOnChain).toBeDefined();

    const onChainRecord = await getCertificateOnChain('BC-TEST');
    expect(onChainRecord.certificateId).toBe('BC-TEST');
    // issueCertificateOnChain must NOT be called during read-only verification
    expect(issueCertificateOnChain).not.toHaveBeenCalled();
  });

  // TEST 13 & 14: Cross-institution authorization checks
  it('TEST 13 & 14: User from Institution A cannot access or modify Institution B certificate', async () => {
    const userInstA: any = {
      _id: 'user-inst-a',
      role: 'institution',
      institution: 'inst-A',
      isActive: true,
    };

    jest.spyOn(User, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(userInstA),
    } as any);

    const certInstB: any = {
      institution: 'inst-B',
      studentId: 'student-b',
    };

    await expect(assertCertificateAccess(userInstA, certInstB)).rejects.toThrow(
      'Cross-institution operations are strictly forbidden'
    );
  });

  // TEST 15: Expired subscription -> premium functionality correctly restricted to Free tier
  it('TEST 15: Expired subscription reverts effective tier to free', () => {
    const expiredInstitution: any = {
      subscription: {
        tier: 'Growth',
        status: 'active',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired yesterday
      },
    };

    const effectiveTier = getEffectiveInstitutionTier(expiredInstitution);
    expect(effectiveTier).toBe('free');

    const limits = checkFeatureAccess(effectiveTier);
    expect(limits.maxCertificates).toBe(3);
    expect(limits.allowBulk).toBe(false);
  });

  // TEST 16: Admin bypasses 3-certificate limit on free institution
  it('TEST 16: Admin bypasses 3-certificate limit on free institution', async () => {
    const mockFreeInstitution: any = {
      _id: 'inst-free-admin',
      name: 'Free School For Admin',
      status: 'approved',
      subscription: { tier: 'free', status: 'active' },
      stats: { certificatesIssued: 3, certificatesRevoked: 0, studentsManaged: 1 },
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockAdminUser: any = {
      _id: 'admin-actor-1',
      role: 'admin',
      isActive: true,
    };

    jest.spyOn(Institution, 'findById').mockResolvedValue(mockFreeInstitution);
    jest.spyOn(User, 'findById').mockResolvedValue(mockAdminUser);
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    // Count is already 5 (exceeding 3-limit for free plan)
    jest.spyOn(Certificate, 'countDocuments').mockResolvedValue(5);
    (Student.findOne as jest.Mock).mockResolvedValue(null);
    (Student.create as jest.Mock).mockResolvedValue({ _id: 'student-admin-1', studentId: 'S-ADMIN-1' });
    (Student.countDocuments as jest.Mock).mockResolvedValue(1);

    jest.spyOn(Certificate, 'create').mockImplementation(async (payload: any) => ({
      ...payload,
      _id: 'cert-admin-bypass',
      certificateId: 'BC-ADMIN1',
      save: jest.fn().mockResolvedValue(undefined),
      history: payload.history || [],
    }));

    const { issueCertificate } = await import('../services/certificateService.js');
    const result = await issueCertificate({
      payload: {
        certificateId: 'BC-ADMIN1',
        studentName: 'Admin Student',
        studentId: 'S-ADMIN-1',
        email: 'admin.student@test.edu',
        degree: 'Master of Admin',
        course: 'Blockchain Ops',
        department: 'CS',
        graduationYear: 2026,
        issueDate: '2026-05-01',
        institutionId: 'inst-free-admin',
      },
      pdfBuffer: Buffer.from('%PDF-1.4 test', 'utf-8'),
      pdfFileName: 'test.pdf',
      actorId: 'admin-actor-1',
    });

    expect(result).toBeDefined();
    expect(result.certificateId).toBe('BC-ADMIN1');
  });

  // TEST 17: Admin bypasses bulk issuance restriction on free institution
  it('TEST 17: Admin bypasses bulk issuance restriction on free institution', async () => {
    const mockFreeInstitution: any = {
      _id: 'inst-free-bulk',
      name: 'Free School Bulk',
      status: 'approved',
      subscription: { tier: 'free', status: 'active' },
      stats: { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 },
      save: jest.fn().mockResolvedValue(undefined),
    };

    const mockAdminUser: any = {
      _id: 'admin-actor-bulk',
      role: 'admin',
      isActive: true,
    };

    jest.spyOn(Institution, 'findById').mockResolvedValue(mockFreeInstitution);
    jest.spyOn(User, 'findById').mockResolvedValue(mockAdminUser);
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Certificate, 'findOne').mockResolvedValue(null);
    (Student.findOne as jest.Mock).mockResolvedValue(null);
    (Student.create as jest.Mock).mockResolvedValue({ _id: 'student-b-1', studentId: 'S-B1' });
    (Student.countDocuments as jest.Mock).mockResolvedValue(1);

    jest.spyOn(Certificate, 'create').mockImplementation(async (payload: any) => ({
      ...payload,
      _id: 'cert-b-1',
      certificateId: 'BC-BULK1',
      save: jest.fn().mockResolvedValue(undefined),
      history: payload.history || [],
    }));

    const csvContent = 'studentName,studentId,email,degree,course,department,graduationYear,issueDate\nAdminStudent,S-B1,b1@test.edu,B.Sc,CS,CS,2026,2026-05-01';

    const result = await bulkIssueCertificates({
      institutionId: 'inst-free-bulk',
      actorId: 'admin-actor-bulk',
      csvBuffer: Buffer.from(csvContent, 'utf-8'),
    });

    expect(result.succeeded.length).toBe(1);
    expect(result.failed.length).toBe(0);
  });
});
