
import { jest } from '@jest/globals';

jest.mock('../models/Institution.js', () => ({
  __esModule: true,
  default: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

jest.mock('../models/Student.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('../models/Certificate.js', () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../models/BlockchainTransaction.js', () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn() },
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

import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import Certificate from '../models/Certificate.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import User from '../models/User.js';
import { pinFileToIpfs, pinJsonToIpfs } from '../services/ipfsService.js';
import { issueCertificateOnChain } from '../services/blockchainService.js';
import { sendEmail } from '../services/emailService.js';
import { bulkIssueCertificates } from '../services/certificateService.js';

describe('bulkIssueCertificates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('continues processing when one CSV row fails', async () => {
    const institution = {
      _id: 'institution-1',
      name: 'Future University',
      status: 'approved',
      stats: { certificatesIssued: 0, studentsManaged: 0 },
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Institution.findById as jest.Mock).mockResolvedValue(institution);
    (Student.findOne as jest.Mock).mockResolvedValue(null);
    (Student.create as jest.Mock).mockResolvedValue({ _id: 'student-1' });
    (Student.countDocuments as jest.Mock).mockResolvedValue(1);
    (Certificate.create as jest.Mock).mockImplementation(async (payload: Record<string, unknown>) => ({
      ...payload,
      _id: `doc-${String(payload.certificateId)}`,
      id: `doc-${String(payload.certificateId)}`,
    }));
    (BlockchainTransaction.create as jest.Mock).mockResolvedValue(undefined);
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (pinFileToIpfs as jest.Mock)
      .mockResolvedValueOnce({ cid: 'cid-1', url: 'ipfs://file-1' })
      .mockRejectedValueOnce(new Error('Pinata unavailable'));
    (pinJsonToIpfs as jest.Mock).mockResolvedValue({ cid: 'meta-1', url: 'ipfs://meta-1' });
    (issueCertificateOnChain as jest.Mock).mockResolvedValue({ transactionHash: '0x123', blockNumber: 1, gasUsed: '1000', walletAddress: '0xabc' });
    (sendEmail as jest.Mock).mockResolvedValue(undefined);

    const csv = Buffer.from(
      [
        'studentName,studentId,email,degree,course,department,graduationYear,issueDate,expiryDate',
        'Alice,STU-1,alice@example.com,BSc,Computer Science,Engineering,2024,2024-05-01,',
        'Bob,STU-2,bob@example.com,MSc,Blockchain,Engineering,2024,2024-05-02,',
      ].join('\n')
    );

    const result = await bulkIssueCertificates({ csvBuffer: csv, institutionId: 'institution-1', actorId: 'actor-1' });

    expect(result.succeeded).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(result.succeeded[0]).toEqual(expect.objectContaining({ success: true, row: expect.objectContaining({ studentId: 'STU-1' }) }));
    expect(result.failed[0]).toEqual(expect.objectContaining({ success: false, row: expect.objectContaining({ studentId: 'STU-2' }), error: 'Pinata unavailable' }));
  });
});
