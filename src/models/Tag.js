import mongoose from 'mongoose';

export const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: 50
    },
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    group: {
      type: String,
      enum: {
        values: ['complication', 'material', 'style', 'movement', 'occasion', 'editorial'],
        message: '{VALUE} is not a valid tag group'
      },
      default: 'style',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Tag = mongoose.model('Tag', TagSchema);
export default Tag;
