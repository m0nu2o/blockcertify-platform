
import { Schema, model, Document, Types } from 'mongoose';

export type InstitutionStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface IInstitution extends Document {
  name: string;
  slug: string;
  email: string;
  website?: string;
  logo?: string;
  description?: string;
  address?: string;
  accreditationNumber?: string;
  walletAddress?: string;
  status: InstitutionStatus;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  suspendedAt?: Date;
  suspensionReason?: string;
  contactPerson?: string;
  user?: Types.ObjectId;
  stats: {
    certificatesIssued: number;
    certificatesRevoked: number;
    studentsManaged: number;
  };
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String },
    logo: { type: String },
    description: { type: String },
    address: { type: String },
    accreditationNumber: { type: String },
    walletAddress: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'suspended', 'rejected'], default: 'pending', index: true },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
    contactPerson: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    stats: {
      certificatesIssued: { type: Number, default: 0 },
      certificatesRevoked: { type: Number, default: 0 },
      studentsManaged: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default model<IInstitution>('Institution', InstitutionSchema);
