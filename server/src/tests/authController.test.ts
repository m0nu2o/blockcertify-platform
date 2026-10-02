
import { jest } from '@jest/globals';

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn() },
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../services/auditService.js', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

import User from '../models/User.js';
import { sendEmail } from '../services/emailService.js';
import { forgotPassword } from '../controllers/authController.js';
import { createMockResponse } from './testUtils.js';

describe('forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the same response for existing and non-existing emails', async () => {
    const req = { body: { email: 'student@example.com' } };
    const resExisting = createMockResponse();
    const resMissing = createMockResponse();
    const next = jest.fn();

    const save = jest.fn().mockResolvedValue(undefined);
    (User.findOne as jest.Mock)
      .mockResolvedValueOnce({ email: 'student@example.com', save })
      .mockResolvedValueOnce(null);

    forgotPassword(req as never, resExisting as never, next);
    await new Promise((resolve) => setTimeout(resolve, 20));
    forgotPassword(req as never, resMissing as never, next);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(resExisting.status).toHaveBeenCalledWith(200);
    expect(resMissing.status).toHaveBeenCalledWith(200);
    expect(resExisting.json.mock.calls[0][0]).toEqual(resMissing.json.mock.calls[0][0]);
    expect(resExisting.json.mock.calls[0][0]).toEqual({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      data: null,
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
