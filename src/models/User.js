import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number']
    },
    avatarUrl: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: [
          'customer',
          'admin',
          'superadmin',
          'catalog_manager',
          'order_manager',
          'content_manager',
          'support'
        ],
        message: '{VALUE} is not a valid user role'
      },
      default: 'customer',
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'pending_verification'],
        message: '{VALUE} is not a valid account status'
      },
      default: 'active',
      index: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    lockUntil: {
      type: Date
    },
    lastLoginAt: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual for customer full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual password setter / getter for transparent bcrypt hashing
UserSchema.virtual('password')
  .set(function (password) {
    this._password = password;
  })
  .get(function () {
    return this._password;
  });

// Pre-validate hook: automatically hash password virtual if supplied
UserSchema.pre('validate', async function (next) {
  if (this._password) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this._password, salt);
  }
  next();
});

// Pre-save hook: ensure passwordHash is hashed with bcrypt cost factor 12
UserSchema.pre('save', async function (next) {
  if (this._password && !this.passwordHash) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this._password, salt);
    this._password = undefined;
  }
  next();
});

// Check if account is currently locked due to failed attempts
UserSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Compare raw password against bcrypt hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', UserSchema);
export default User;
