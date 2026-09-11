
import { jest } from '@jest/globals';

jest.mock('../models/Certificate.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findById: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../models/Institution.js', () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

jest.mock('../models/Student.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('../models/BlockchainTransaction.js', () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../services/blockchainService.js', () => ({
  issueCertificateOnChain: jest.fn(),
  revokeCertificateOnChain: jest.fn(),
  updateCertificateOnChain: jest.fn(),
  getCertificateOnChain: jest.fn(),
}));

jest.mock('../services/ipfsService.js', () => ({
  pinFileToIpfs: jest.fn(),
  pinJsonToIpfs: jest.fn(),
}));

jest.mock('../services/notificationService.js', () => ({
  createNotification: jest.fn(),
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn(),
}));

import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { revokeCertificateOnChain, updateCertificateOnChain } from '../services/blockchainService.js';
import { revokeCertificate, updateCertificate } from '../services/certificateService.js';

describe('certificate service authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents cross-institution revocation attempts', async () => {
    (Certificate.findOne as jest.Mock).mockResolvedValue({
      certificateId: 'BC-1001',
      institution: 'institution-a',
      student: 'student-a',
      studentId: 'STU-1',
    });

    (User.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'user-2',
        isActive: true,
        role: 'institution',
        institution: 'institution-b',
      }),
    });

    await expect(
      revokeCertificate({ certificateId: 'BC-1001', reason: 'test revoke', actor: { _id: 'user-2', role: 'institution' } })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(revokeCertificateOnChain).not.toHaveBeenCalled();
  });

  it('prevents cross-institution updates before any on-chain write', async () => {
    (Certificate.findOne as jest.Mock).mockResolvedValue({
      certificateId: 'BC-1002',
      institution: 'institution-a',
      student: 'student-a',
      studentId: 'STU-1',
    });

    (User.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'user-3',
        isActive: true,
        role: 'institution',
        institution: 'institution-b',
      }),
    });

    await expect(
      updateCertificate({ certificateId: 'BC-1002', updates: { degree: 'Updated Degree' }, actor: { _id: 'user-3', role: 'institution' } })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(updateCertificateOnChain).not.toHaveBeenCalled();
  });
});
