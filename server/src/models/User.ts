
import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'institution' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  institution?: Types.ObjectId;
  student?: Types.ObjectId;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'institution', 'student'], required: true, index: true },
    avatar: { type: String },
    phone: { type: String },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution' },
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    preferences: {
      theme: { type: String, default: 'crystal-glass' },
      language: { type: String, default: 'en' },
      notifications: { type: Boolean, default: true },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export default model<IUser>('User', UserSchema);
