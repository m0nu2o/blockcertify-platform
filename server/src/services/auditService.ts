
import { Request } from 'express';
import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  req,
  actor,
  actorEmail,
  action,
  entity,
  entityId,
  metadata,
  severity = 'info',
}: {
  req?: Request;
  actor?: string;
  actorEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical';
}) => {
  return AuditLog.create({
    actor,
    actorEmail,
    action,
    entity,
    entityId,
    metadata: metadata || {},
    ipAddress: req?.ip,
    userAgent: req?.headers['user-agent'],
    severity,
  });
};
