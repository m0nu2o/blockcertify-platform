
import { Schema, model, Document, Types } from 'mongoose';

export type CertificateStatus = 'pending_approval' | 'issued' | 'verified' | 'revoked' | 'expired';

export interface ICertificate extends Document {
  certificateId: string;
  student: Types.ObjectId;
  institution: Types.ObjectId;
  studentName: string;
  studentId: string;
  email?: string;
  degree: string;
  course: string;
  department: string;
  institutionName: string;
  graduationYear: number;
  issueDate: Date;
  expiryDate?: Date;
  fileHash: string;
  metadataHash: string;
  ipfsCid?: string;
  ipfsUrl?: string;
  metadataCid?: string;
  metadataUrl?: string;
  blockchainHash?: string;
  blockchainStatus: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  qrCodeDataUrl?: string;
  pdfFileName?: string;
  status: CertificateStatus;
  revokedAt?: Date;
  revokedReason?: string;
  lastVerifiedAt?: Date;
  verificationCount: number;
  tags: string[];
  preparedBy?: string;
  approvedBy?: string;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    email: { type: String },
    degree: { type: String, required: true },
    course: { type: String, required: true },
    department: { type: String, required: true },
    institutionName: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    fileHash: { type: String, required: true, index: true },
    metadataHash: { type: String, required: true },
    ipfsCid: { type: String, index: true },
    ipfsUrl: { type: String },
    metadataCid: { type: String },
    metadataUrl: { type: String },
    blockchainHash: { type: String, index: true },
    blockchainStatus: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    transactionHash: { type: String, index: true },
    qrCodeDataUrl: { type: String },
    pdfFileName: { type: String },
    status: { type: String, enum: ['pending_approval', 'issued', 'verified', 'revoked', 'expired'], default: 'issued', index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String },
    lastVerifiedAt: { type: Date },
    verificationCount: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    preparedBy: { type: String },
    approvedBy: { type: String },
  },
  { timestamps: true }
);

export default model<ICertificate>('Certificate', CertificateSchema);
