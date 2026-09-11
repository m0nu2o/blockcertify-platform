
import { Schema, model, Document, Types } from 'mongoose';

export type VerificationMethod = 'id' | 'hash' | 'transaction' | 'qr' | 'bulk';

export interface IVerificationLog extends Document {
  certificateId: string;
  method: VerificationMethod;
  valid: boolean;
  ipAddress?: string;
  userAgent?: string;
  actor?: Types.ObjectId;
}

const VerificationLogSchema = new Schema<IVerificationLog>(
  {
    certificateId: { type: String, required: true, index: true },
    method: { type: String, enum: ['id', 'hash', 'transaction', 'qr', 'bulk'], required: true },
    valid: { type: Boolean, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default model<IVerificationLog>('VerificationLog', VerificationLogSchema);
