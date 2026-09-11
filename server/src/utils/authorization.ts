
import User, { IUser } from '../models/User.js';
import { ICertificate } from '../models/Certificate.js';
import { ApiError } from './ApiError.js';

type RequestUser = Express.Request['user'];

type CertificateAccessScope =
  | { role: 'admin' }
  | { role: 'institution'; institutionId: string }
  | { role: 'student'; studentId: string };

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

  const studentId = (hydratedUser.student as { studentId?: string } | null)?.studentId;

  if (!studentId) {
    throw new ApiError(403, 'Student access is not configured for this account');
  }

  return { role: 'student', studentId };
};

export const buildCertificateAccessQuery = async (user: RequestUser): Promise<Record<string, unknown>> => {
  const scope = await getCertificateAccessScope(user);

  if (scope.role === 'admin') {
    return {};
  }

  if (scope.role === 'institution') {
    return { institution: scope.institutionId };
  }

  return { studentId: scope.studentId };
};

export const assertCertificateAccess = async (user: RequestUser, certificate: Pick<ICertificate, 'institution' | 'student' | 'studentId'>) => {
  const scope = await getCertificateAccessScope(user);

  if (scope.role === 'admin') {
    return;
  }

  if (scope.role === 'institution') {
    const certificateInstitutionId = normalizeObjectId(certificate.institution);

    if (certificateInstitutionId === scope.institutionId) {
      return;
    }

    throw new ApiError(403, 'Certificate access denied');
  }

  if (certificate.studentId === scope.studentId) {
    return;
  }

  const certificateStudentId = normalizeObjectId(certificate.student);
  if (certificateStudentId && certificateStudentId === scope.studentId) {
    return;
  }

  throw new ApiError(403, 'Certificate access denied');
};

export const sanitizeUserForAccess = (user: Pick<IUser, '_id' | 'role'>): Pick<IUser, '_id' | 'role'> => ({
  _id: user._id,
  role: user.role,
});
