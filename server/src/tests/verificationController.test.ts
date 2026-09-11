
import { jest } from '@jest/globals';

jest.mock('../services/certificateService.js', () => ({
  verifyByCertificateId: jest.fn(),
  verifyByHash: jest.fn(),
  verifyByTransaction: jest.fn(),
}));

import { verifyByCertificateId } from '../services/certificateService.js';
import { verifyByQrController } from '../controllers/verificationController.js';
import { createMockResponse } from './testUtils.js';

describe('verifyByQrController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to certificate ID lookup when the payload is not a URL', async () => {
    const req = { body: { payload: 'BC-QR-1234' } };
    const res = createMockResponse();
    const next = jest.fn();

    (verifyByCertificateId as jest.Mock).mockResolvedValue({ valid: true });

    verifyByQrController(req as never, res as never, next);
    await new Promise(process.nextTick);

    expect(verifyByCertificateId).toHaveBeenCalledWith('BC-QR-1234', expect.objectContaining({ method: 'qr' }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns a clean 400 error for invalid short payloads', async () => {
    const req = { body: { payload: 'abc' } };
    const res = createMockResponse();
    const next = jest.fn();

    verifyByQrController(req as never, res as never, next);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
