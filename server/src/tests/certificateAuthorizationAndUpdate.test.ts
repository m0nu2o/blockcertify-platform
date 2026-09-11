
import { jest } from '@jest/globals';

jest.mock('../models/Certificate.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../services/certificateService.js', () => ({
  bulkIssueCertificates: jest.fn(),
  issueCertificate: jest.fn(),
  revokeCertificate: jest.fn(),
  updateCertificate: jest.fn(),
}));

import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { getCertificate, updateCertificateController } from '../controllers/certificateController.js';
import { updateCertificate } from '../services/certificateService.js';
import { createMockResponse } from './testUtils.js';

describe('certificate authorization and update validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks cross-institution certificate access', async () => {
    const req = {
      params: { id: 'BC-9999' },
      user: { _id: 'user-1', role: 'institution', email: 'issuer@example.com' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    (Certificate.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        certificateId: 'BC-9999',
        institution: 'institution-a',
        student: 'student-a',
        studentId: 'STU-1',
      }),
    });

    (User.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'user-1',
        isActive: true,
        role: 'institution',
        institution: 'institution-b',
      }),
    });

    getCertificate(req as never, res as never, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects mass-assignment fields outside the allow-list', async () => {
    const req = {
      params: { id: 'BC-1000' },
      user: { _id: 'user-1', role: 'institution', email: 'issuer@example.com' },
      body: { degree: 'Bachelor of Science', isAdmin: true },
    };
    const res = createMockResponse();
    const next = jest.fn();

    updateCertificateController(req as never, res as never, next);
    await new Promise(process.nextTick);

    expect(updateCertificate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0] as { name?: string };
    expect(error.name).toBe('ZodError');
  });
});
