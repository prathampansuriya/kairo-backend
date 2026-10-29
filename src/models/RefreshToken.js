import mongoose from 'mongoose';

export const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    family: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    ipAddress: {
      type: String
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically evicts expired sessions
    }
  },
  {
    timestamps: true
  }
);

export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
export default RefreshToken;
