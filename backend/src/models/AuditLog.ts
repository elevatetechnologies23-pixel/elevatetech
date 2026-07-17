import { Schema, model } from 'mongoose';
import type { IAuditLog } from '../types/models';

const auditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String, required: true },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
