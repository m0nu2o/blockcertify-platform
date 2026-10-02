
import { Schema, model, Document, Types } from 'mongoose';

export type CertificateStatus = 'draft' | 'pending_approval' | 'issued' | 'verified' | 'revoked' | 'expired' | 'failed';
export type BlockchainStatus = 'none' | 'pending' | 'confirmed' | 'failed';

export interface ICertificateHistory {
  action: string;
  timestamp: Date;
  actor?: string;
  changes?: Record<string, unknown>;
  transactionHash?: string;
  reason?: string;
}

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
  blockchainStatus: BlockchainStatus;
  transactionHash?: string;
  chainId?: string;
  network?: string;
  contractAddress?: string;
  blockNumber?: number;
  submittedAt?: Date;
  confirmedAt?: Date;
  failureReason?: string;
  idempotencyKey?: string;
  version: number;
  history: ICertificateHistory[];
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
  retryCount?: number;
}

const CertificateHistorySchema = new Schema<ICertificateHistory>(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String },
    changes: { type: Schema.Types.Mixed },
    transactionHash: { type: String },
    reason: { type: String },
  },
  { _id: false }
);

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
    blockchainStatus: {
      type: String,
      enum: ['none', 'pending', 'confirmed', 'failed'],
      default: 'none',
      index: true,
    },
    transactionHash: { type: String, index: true },
    chainId: { type: String },
    network: { type: String, default: 'ethereum' },
    contractAddress: { type: String },
    blockNumber: { type: Number },
    submittedAt: { type: Date },
    confirmedAt: { type: Date },
    failureReason: { type: String },
    idempotencyKey: { type: String, index: true, sparse: true },
    retryCount: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    history: { type: [CertificateHistorySchema], default: [] },
    qrCodeDataUrl: { type: String },
    pdfFileName: { type: String },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'issued', 'verified', 'revoked', 'expired', 'failed'],
      default: 'draft',
      index: true,
    },
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

CertificateSchema.index({ institution: 1, createdAt: -1 });
CertificateSchema.index({ institution: 1, status: 1 });
CertificateSchema.index({ studentId: 1, createdAt: -1 });
CertificateSchema.index({ blockchainStatus: 1, createdAt: -1 });
CertificateSchema.index({ status: 1, blockchainStatus: 1 });

export default model<ICertificate>('Certificate', CertificateSchema);
