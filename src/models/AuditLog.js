import mongoose from 'mongoose';

export const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    actorRole: {
      type: String,
      required: true
    },
    actorEmail: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable append-only
  }
);

// Prevent updating or deleting audit records
AuditLogSchema.pre('updateOne', function () {
  throw new Error('Audit records are immutable and cannot be updated');
});

AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit records are immutable and cannot be updated');
});

AuditLogSchema.pre('deleteOne', function () {
  throw new Error('Audit records are immutable and cannot be deleted');
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
