import mongoose from 'mongoose';

export const EmailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP record'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true
    },
    otpHash: {
      type: String,
      required: [true, 'Hashed OTP is required']
    },
    purpose: {
      type: String,
      enum: {
        values: ['email_verification', 'password_reset', 'login_challenge'],
        message: '{VALUE} is not a valid OTP purpose'
      },
      required: true,
      index: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: [3, 'Exceeded maximum verification attempts']
    },
    consumed: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically cleans up expired OTPs
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying active unconsumed OTPs
EmailOtpSchema.index({ email: 1, purpose: 1, consumed: 1 });

export const EmailOtp = mongoose.model('EmailOtp', EmailOtpSchema);
export default EmailOtp;
