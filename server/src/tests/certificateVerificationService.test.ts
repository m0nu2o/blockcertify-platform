
import { jest } from '@jest/globals';

jest.mock('../models/Certificate.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/BlockchainTransaction.js', () => ({
  __esModule: true,
  default: { create: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../models/VerificationLog.js', () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.mock('../services/blockchainService.js', () => ({
  issueCertificateOnChain: jest.fn(),
  revokeCertificateOnChain: jest.fn(),
  updateCertificateOnChain: jest.fn(),
  getCertificateOnChain: jest.fn(),
}));

import Certificate from '../models/Certificate.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import VerificationLog from '../models/VerificationLog.js';
import { getCertificateOnChain } from '../services/blockchainService.js';
import { verifyByCertificateId } from '../services/certificateService.js';

describe('verifyByCertificateId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies certificates using read-only blockchain data and creates no blockchain write log', async () => {
    const certificate = {
      _id: 'certificate-1',
      certificateId: 'BC-1234',
      fileHash: 'file-hash',
      metadataHash: 'meta-hash',
      revokedAt: undefined,
      status: 'issued',
      verificationCount: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Certificate.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(certificate),
    });

    (getCertificateOnChain as jest.Mock).mockResolvedValue({
      certificateId: 'BC-1234',
      metadataHash: 'meta-hash',
      fileHash: 'file-hash',
      metadataUri: 'ipfs://metadata',
      revoked: false,
      issuedAt: '1',
      updatedAt: '1',
      issuer: '0x123',
      reason: '',
    });

    (VerificationLog.create as jest.Mock).mockResolvedValue(undefined);

    const result = await verifyByCertificateId('BC-1234', { method: 'id' });

    expect(getCertificateOnChain).toHaveBeenCalledWith('BC-1234');
    expect(BlockchainTransaction.create).not.toHaveBeenCalled();
    expect(certificate.save).toHaveBeenCalled();
    expect(certificate.verificationCount).toBe(1);
    expect(certificate.status).toBe('verified');
    expect(result.valid).toBe(true);
    expect(VerificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ certificateId: 'BC-1234', method: 'id', valid: true })
    );
  });
});
