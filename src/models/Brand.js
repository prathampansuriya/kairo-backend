import mongoose from 'mongoose';

export const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'Brand name cannot exceed 80 characters']
    },
    slug: {
      type: String,
      required: [true, 'Brand slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Brand description cannot exceed 500 characters']
    },
    logoUrl: {
      type: String,
      trim: true
    },
    originCountry: {
      type: String,
      default: 'India',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

BrandSchema.index({ isActive: 1, displayOrder: 1 });

export const Brand = mongoose.model('Brand', BrandSchema);
export default Brand;
