
import { Schema, model, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: Record<string, unknown>;
  description?: string;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: {} },
    description: { type: String },
  },
  { timestamps: true }
);

export default model<ISetting>('Setting', SettingSchema);
