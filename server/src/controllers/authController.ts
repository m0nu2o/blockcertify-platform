
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { sendSuccess } from '../utils/response.js';
import { createAuditLog } from '../services/auditService.js';
import { randomToken, sha256 } from '../utils/hash.js';
import { sendEmail } from '../services/emailService.js';
import { ApiError } from '../utils/ApiError.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'institution', 'student']),
  institutionName: z.string().optional(),
  studentId: z.string().optional(),
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const FORGOT_PASSWORD_MESSAGE = 'If that email exists, a reset link has been sent.';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: body.email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const password = await bcrypt.hash(body.password, 12);
  const user = await User.create({ name: body.name, email: body.email, password, role: body.role });

  if (body.role === 'institution' && body.institutionName) {
    const institution = await Institution.create({
      name: body.institutionName,
      slug: body.institutionName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      email: body.email,
      contactPerson: body.name,
      user: user._id,
      status: 'pending',
    });
    user.institution = institution._id;
    await user.save();

    await createAuditLog({
      req,
      actor: user.id,
      actorEmail: user.email,
      action: 'institution.registered',
      entity: 'Institution',
      entityId: institution.id,
      metadata: { institutionName: institution.name },
    });
  }

  if (body.role === 'student' && body.studentId) {
    const student = await Student.create({
      user: user._id,
      studentId: body.studentId,
      name: body.name,
      email: body.email,
      degree: 'Bachelor of Science',
      course: 'Computer Science',
      department: 'Engineering',
      graduationYear: new Date().getFullYear(),
    });
    user.student = student._id;
    await user.save();
  }

  await createAuditLog({ req, actor: user.id, actorEmail: user.email, action: 'user.registered', entity: 'User', entityId: user.id });

  return sendSuccess(res, { user }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email }).populate('institution student');
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const match = await bcrypt.compare(body.password, user.password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  await createAuditLog({ req, actor: user.id, actorEmail: user.email, action: 'user.logged_in', entity: 'User', entityId: user.id });

  return sendSuccess(
    res,
    {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        institution: user.institution,
        student: user.student,
      },
    },
    'Login successful'
  );
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id).select('-password').populate('institution student');
  return sendSuccess(res, user, 'Current user');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const email = z.string().email().parse(req.body.email);
  const user = await User.findOne({ email });

  if (user) {
    const rawToken = randomToken();
    user.resetPasswordToken = sha256(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: 'Reset your BlockCertify password',
      html: `<p>Use the following secure link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
  }

  return sendSuccess(res, null, FORGOT_PASSWORD_MESSAGE);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string().min(10), email: z.string().email(), password: z.string().min(8) });
  const body = schema.parse(req.body);
  const user = await User.findOne({
    email: body.email,
    resetPasswordToken: sha256(body.token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw new ApiError(400, 'Reset token is invalid or expired');

  user.password = await bcrypt.hash(body.password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return sendSuccess(res, null, 'Password reset successful');
});
