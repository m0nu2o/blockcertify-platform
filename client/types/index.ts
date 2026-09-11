
export type Role = 'admin' | 'institution' | 'student';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  accessToken: string;
}

export interface Certificate {
  certificateId: string;
  studentName: string;
  studentId: string;
  degree: string;
  course: string;
  department: string;
  grade?: string;
  approvedBy?: string;
  graduationYear?: number;
  institutionName: string;
  issueDate: string;
  expiryDate?: string;
  status: 'issued' | 'verified' | 'revoked' | 'expired';
  transactionHash?: string;
  ipfsUrl?: string;
  metadataUrl?: string;
  verificationCount: number;
  qrCodeDataUrl?: string;
}
