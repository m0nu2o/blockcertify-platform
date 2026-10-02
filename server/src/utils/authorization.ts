
import User, { IUser } from '../models/User.js';
import Student from '../models/Student.js';
import { ICertificate } from '../models/Certificate.js';
import { ApiError } from './ApiError.js';

type RequestUser = Express.Request['user'];

type CertificateAccessScope =
  | { role: 'admin' }
  | { role: 'institution'; institutionId: string }
  | { role: 'student'; studentId: string; email?: string };

const normalizeObjectId = (value: unknown): string | undefined => {
  if (!value) return undefined;

  if (typeof value === 'string') return value;

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;

    if (record._id) return String(record._id);
    if (record.id) return String(record.id);
  }

  return String(value);
};

const requireUser = (user: RequestUser): NonNullable<RequestUser> => {
  if (!user?._id || !user.role) {
    throw new ApiError(401, 'Authentication required');
  }

  return user;
};

const loadUserForAuthorization = async (userId: string) => {
  const user = await User.findById(userId).populate('student');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid user session');
  }

  return user;
};

export const getCertificateAccessScope = async (user: RequestUser): Promise<CertificateAccessScope> => {
  const currentUser = requireUser(user);

  if (currentUser.role === 'admin') {
    return { role: 'admin' };
  }

  const hydratedUser = await loadUserForAuthorization(currentUser._id);

  if (hydratedUser.role === 'institution') {
    const institutionId = normalizeObjectId(hydratedUser.institution);

    if (!institutionId) {
      throw new ApiError(403, 'Institution access is not configured for this account');
    }

    return { role: 'institution', institutionId };
  }

  let studentId = (hydratedUser.student as { studentId?: string } | null)?.studentId;

  if (!studentId && hydratedUser.email) {
    const studentDoc = await Student.findOne({ email: hydratedUser.email });
    if (studentDoc) {
      studentId = studentDoc.studentId;
      hydratedUser.student = studentDoc._id;
      await hydratedUser.save();
    }
  }

  return { role: 'student', studentId: studentId || '', email: hydratedUser.email };
};

export const buildCertificateAccessQuery = async (user: RequestUser): Promise<Record<string, unknown>> => {
  const scope = await getCertificateAccessScope(user);

  if (scope.role === 'admin') {
    return {};
  }

  if (scope.role === 'institution') {
    return { institution: scope.institutionId };
  }

  if (scope.studentId && scope.email) {
    return { $or: [{ studentId: scope.studentId }, { email: scope.email }] };
  }

  if (scope.studentId) {
    return { studentId: scope.studentId };
  }

  return { email: scope.email || 'none' };
};

export const assertCertificateAccess = async (user: RequestUser, certificate: Pick<ICertificate, 'institution' | 'student' | 'studentId' | 'email'>) => {
  const scope = await getCertificateAccessScope(user);

  if (scope.role === 'admin') {
    return;
  }

  if (scope.role === 'institution') {
    const certificateInstitutionId = normalizeObjectId(certificate.institution);

    if (certificateInstitutionId === scope.institutionId) {
      return;
    }

    throw new ApiError(403, 'Cross-institution operations are strictly forbidden');
  }

  if (scope.studentId && certificate.studentId === scope.studentId) {
    return;
  }

  const certificateStudentId = normalizeObjectId(certificate.student);
  if (certificateStudentId && certificateStudentId === scope.studentId) {
    return;
  }

  if (scope.email && certificate.email && certificate.email.toLowerCase() === scope.email.toLowerCase()) {
    return;
  }

  throw new ApiError(403, 'Certificate access denied');
};

export const sanitizeUserForAccess = (user: Pick<IUser, '_id' | 'role'>): Pick<IUser, '_id' | 'role'> => ({
  _id: user._id,
  role: user.role,
});

export const resolveAuthorizedInstitutionId = async (
  user: RequestUser,
  requestedInstitutionId?: string
): Promise<string> => {
  const scope = await getCertificateAccessScope(user);

  if (scope.role === 'admin') {
    if (requestedInstitutionId) {
      return requestedInstitutionId;
    }
    throw new ApiError(400, 'Institution ID is required for administrator operations');
  }

  if (scope.role === 'institution') {
    // For authenticated institution users, their authenticated institution ID is authoritative.
    return scope.institutionId;
  }

  throw new ApiError(403, 'User is not authorized for institution operations');
};

export const assertInstitutionOwnership = async (
  user: RequestUser,
  targetInstitutionId: string
): Promise<void> => {
  const scope = await getCertificateAccessScope(user);
  if (scope.role === 'admin') return;
  if (scope.role === 'institution' && scope.institutionId === normalizeObjectId(targetInstitutionId)) return;
  throw new ApiError(403, 'Cross-institution operations are strictly forbidden');
};
