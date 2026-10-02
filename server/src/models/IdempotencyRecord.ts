import { Schema, model, Document, Types } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  user: Types.ObjectId;
  route: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    route: { type: String, required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // 24 hours TTL
  },
  { timestamps: false }
);

export default model<IIdempotencyRecord>('IdempotencyRecord', IdempotencyRecordSchema);
