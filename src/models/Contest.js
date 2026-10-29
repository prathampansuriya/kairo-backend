import mongoose from 'mongoose';
import { MediaSchema } from './ProductMedia.js';

export const ContestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Contest title is required'],
            trim: true,
            maxlength: [140, 'Title cannot exceed 140 characters']
        },
        slug: {
            type: String,
            required: [true, 'Contest slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        contestCode: {
            type: String,
            required: [true, 'Contest code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            required: [true, 'Contest description is required']
        },
        prizeName: {
            type: String,
            required: [true, 'Prize name is required'],
            trim: true
        },
        prizeValuationPaise: {
            type: Number,
            default: 0,
            min: 0
        },
        prizeReference: {
            type: String,
            trim: true
        },
        prizeMedia: [MediaSchema],
        heroMedia: [MediaSchema],
        drawingDate: {
            type: Date,
            required: [true, 'Drawing date is required']
        },
        rules: [
            {
                type: String,
                trim: true
            }
        ],
        eligibilityCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            }
        ],
        publicationStatus: {
            type: String,
            enum: ['draft', 'active', 'closed', 'archived'],
            default: 'active',
            index: true
        },
        winnerAnnounced: {
            type: Boolean,
            default: false
        },
        winner: {
            entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContestEntry' },
            fullName: { type: String, trim: true },
            email: { type: String, trim: true, lowercase: true },
            cityLocation: { type: String, trim: true },
            announcedAt: { type: Date }
        },
        totalEntries: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

export const Contest = mongoose.model('Contest', ContestSchema);
export default Contest;