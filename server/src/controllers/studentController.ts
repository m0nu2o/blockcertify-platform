import { Request, Response } from 'express';
import { z } from 'zod';
import Student from '../models/Student.js';
import Institution from '../models/Institution.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { createAuditLog } from '../services/auditService.js';
import { resolveAuthorizedInstitutionId } from '../utils/authorization.js';

const studentCreateSchema = z.object({
  name: z.string().min(2, 'Student name must be at least 2 characters'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Invalid email address'),
  degree: z.string().min(1, 'Degree is required'),
  course: z.string().min(1, 'Course is required'),
  department: z.string().min(1, 'Department is required'),
  graduationYear: z.coerce.number().int().min(1900).max(2100),
  institutionId: z.string().optional(),
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const body = studentCreateSchema.parse(req.body);
  const institutionId = await resolveAuthorizedInstitutionId(req.user, body.institutionId);

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    throw new ApiError(404, 'Your institution could not be verified. Please contact an administrator.');
  }

  // Check if student with this studentId already exists
  const existingByStudentId = await Student.findOne({ studentId: body.studentId });
  if (existingByStudentId) {
    if (String(existingByStudentId.institution) !== String(institutionId)) {
      throw new ApiError(403, 'This student belongs to another institution and cannot be registered here.');
    }
    throw new ApiError(409, `Student with ID "${body.studentId}" already exists in your institution.`);
  }

  const student = await Student.create({
    name: body.name.trim(),
    studentId: body.studentId.trim(),
    email: body.email.trim().toLowerCase(),
    degree: body.degree.trim(),
    course: body.course.trim(),
    department: body.department.trim(),
    graduationYear: body.graduationYear,
    institution: institution._id,
  });

  await createAuditLog({
    req,
    actor: req.user!._id,
    actorEmail: req.user!.email,
    action: 'student.created',
    entity: 'Student',
    entityId: student.id,
    metadata: { studentId: student.studentId, institutionId: String(institution._id) },
  });

  return sendSuccess(res, student, 'Student created successfully and linked to your institution.', 201);
});

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const query: Record<string, unknown> = {};

  if (req.user?.role === 'admin') {
    if (req.query.institutionId) {
      query.institution = req.query.institutionId;
    }
  } else {
    const institutionId = await resolveAuthorizedInstitutionId(req.user, req.query.institutionId as string | undefined);
    query.institution = institutionId;
  }

  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { studentId: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
      { degree: { $regex: escaped, $options: 'i' } },
      { course: { $regex: escaped, $options: 'i' } },
    ];
  }

  const students = await Student.find(query).sort({ createdAt: -1 }).limit(100);
  return sendSuccess(res, { items: students, total: students.length }, 'Students retrieved');
});

export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const query: Record<string, unknown> = { _id: req.params.id };
  if (req.user?.role !== 'admin') {
    const institutionId = await resolveAuthorizedInstitutionId(req.user);
    query.institution = institutionId;
  }
  const student = await Student.findOne(query);
  if (!student) {
    throw new ApiError(404, 'Student not found in your institution');
  }
  return sendSuccess(res, student, 'Student retrieved');
});
