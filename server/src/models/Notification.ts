
import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  link?: string;
  payload: Record<string, unknown>;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default model<INotification>('Notification', NotificationSchema);
