import mongoose from 'mongoose';

export const ContestEntrySchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      required: [true, 'Contest reference is required'],
      index: true
    },
    contestCode: {
      type: String,
      required: [true, 'Contest code is required'],
      uppercase: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [80, 'Full name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true
    },
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: '{VALUE} is not a valid gender option'
      },
      default: 'other'
    },
    categoryPreference: {
      type: String,
      trim: true,
      default: 'Universal Complications'
    },
    cityLocation: {
      type: String,
      required: [true, 'City and location are required'],
      trim: true,
      maxlength: [100, 'City location cannot exceed 100 characters']
    },
    ipAddress: { type: String, trim: true },
    isWinner: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// One entry per email per contest
ContestEntrySchema.index({ email: 1, contestId: 1 }, { unique: true });

export const ContestEntry = mongoose.model('ContestEntry', ContestEntrySchema);
export default ContestEntry;