
import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: Types.ObjectId;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'critical';
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    actorEmail: { type: String },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  },
  { timestamps: true }
);

export default model<IAuditLog>('AuditLog', AuditLogSchema);
