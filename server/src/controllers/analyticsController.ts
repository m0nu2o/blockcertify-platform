
import { Request, Response } from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { getAdminAnalytics, getInstitutionAnalytics, getOverviewAnalytics, getStudentAnalytics } from '../services/analyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const overviewAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getOverviewAnalytics();
  return sendSuccess(res, analytics, 'Overview analytics');
});

export const adminAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAdminAnalytics();
  return sendSuccess(res, analytics, 'Admin analytics');
});

export const institutionAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  const instId = user?.institution ? String(user.institution) : undefined;
  const analytics = await getInstitutionAnalytics(instId);
  return sendSuccess(res, analytics, 'Institution analytics');
});

export const studentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).populate('student');
  let studentId = (user?.student as { studentId?: string })?.studentId || undefined;
  if (!studentId && user?.email) {
    const student = await Student.findOne({ email: user.email });
    if (student) studentId = student.studentId;
  }
  const analytics = await getStudentAnalytics(studentId, user?.email);
  return sendSuccess(res, analytics, 'Student analytics');
});
