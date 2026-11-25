
import { jest } from '@jest/globals';

jest.mock('../models/User.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() },
}));

jest.mock('../models/Institution.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../models/Student.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../services/emailService.js', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../services/auditService.js', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import { sendEmail } from '../services/emailService.js';
import { forgotPassword, login, register } from '../controllers/authController.js';
import { errorHandler } from '../middlewares/errorHandler.js';
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

describe('auth security regressions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register does not return password hash in response', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (Institution.findOne as jest.Mock).mockResolvedValue({ _id: 'inst-1' });
    (Student.create as jest.Mock).mockResolvedValue({ _id: 'stu-1' });
    (User.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      _id: 'user-1',
      name: 'Test Student',
      email: 'student@test.com',
      password: '$2a$12$hashedpasswordvalue',
      role: 'student',
      subscription: { tier: 'free' },
      save: jest.fn().mockResolvedValue(undefined),
    });

    const req = {
      body: {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'StrongPassword123!',
        role: 'student',
      },
    };
    const res = createMockResponse();
    await new Promise<void>((resolve) => {
      const origJson = res.json;
      res.json = jest.fn((...args: unknown[]) => {
        const out = origJson(...args);
        resolve();
        return out;
      }) as typeof res.json;
      const next = jest.fn(() => resolve());
      register(req as never, res as never, next);
    });

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.user.password).toBeUndefined();
    expect(payload.data.user.email).toBe('student@test.com');
  });

  it('login rejects wrong password for admin@blockcertify.com (no backdoor)', async () => {
    const adminHash = await bcrypt.hash('DifferentRealPassword99!', 4);
    (User.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'admin@blockcertify.com',
        password: adminHash,
        role: 'admin',
        isActive: true,
      }),
    });

    const req = {
      body: { email: 'admin@blockcertify.com', password: 'Admin@123456' },
    };
    const res = createMockResponse();
    let capturedErr: { statusCode?: number; message?: string } | undefined;
    await new Promise<void>((resolve) => {
      const next = jest.fn((err?: unknown) => {
        capturedErr = err as { statusCode?: number; message?: string };
        resolve();
      });
      login(req as never, res as never, next);
    });

    expect(capturedErr).toBeDefined();
    expect(capturedErr?.statusCode).toBe(401);
    expect(capturedErr?.message).toBe('Invalid credentials');
  });

  it('errorHandler returns 400 for malformed JSON body SyntaxError', () => {
    const syntaxErr = new SyntaxError('Unexpected token');
    (syntaxErr as SyntaxError & { body?: string }).body = '{bad';
    const res = createMockResponse();
    errorHandler(syntaxErr, {} as never, res as never, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid JSON request body' });
  });
});
