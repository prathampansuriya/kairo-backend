import mongoose from 'mongoose';

export const HomepageSectionSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: true,
      unique: true,
      trim: true // e.g. "hero_carousel", "bestsellers", "movement_in_time", "video_reels", "editorial_stories"
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

export const HomepageSection = mongoose.model('HomepageSection', HomepageSectionSchema);
export default HomepageSection;
