
import { Schema, model, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  user?: Types.ObjectId;
  institution?: Types.ObjectId;
  studentId: string;
  name: string;
  email: string;
  degree: string;
  course: string;
  department: string;
  graduationYear: number;
  profileImage?: string;
  walletAddress?: string;
  metadata: Record<string, unknown>;
}

const StudentSchema = new Schema<IStudent>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution', index: true },
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    degree: { type: String, required: true },
    course: { type: String, required: true },
    department: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    profileImage: { type: String },
    walletAddress: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default model<IStudent>('Student', StudentSchema);
