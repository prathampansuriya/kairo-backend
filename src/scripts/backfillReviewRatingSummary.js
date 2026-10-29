/**
 * KAIRO — Backfill Product.ratingSummary from approved reviews
 * Run once after deploying the reviewService change.
 *
 * Usage: node backend/scripts/backfillReviewRatingSummary.js
 */
import mongoose from 'mongoose';
import { env } from '../../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Product } from '../../src/models/Product.js';
import { Review } from '../../src/models/Review.js';
import { logger } from '../../src/config/logger.js';

async function run() {
    await connectDatabase(env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}\n`);

    const products = await Product.find({}).select('_id name ratingSummary').lean();
    let updated = 0;

    for (const p of products) {
        const [agg] = await Review.aggregate([
            {
                $match: {
                    productId: p._id,
                    isApproved: true,
                    moderationStatus: 'approved'
                }
            },
            { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const average = agg?.count ? Math.round(agg.average * 10) / 10 : 0;
        const count = agg?.count || 0;

        const prevAvg = p.ratingSummary?.average ?? 0;
        const prevCount = p.ratingSummary?.count ?? 0;

        if (prevAvg !== average || prevCount !== count) {
            await Product.updateOne(
                { _id: p._id },
                { $set: { 'ratingSummary.average': average, 'ratingSummary.count': count } }
            );
            console.log(
                `  ✓ ${p.name}: ${prevAvg.toFixed(1)} (${prevCount}) → ${average.toFixed(1)} (${count})`
            );
            updated++;
        }
    }

    console.log(`\nDone. Updated ${updated}/${products.length} products.\n`);
}

run()
    .then(async () => {
        await disconnectDatabase();
        process.exit(0);
    })
    .catch(async (err) => {
        logger.error('Rating backfill failed', { error: err.message, stack: err.stack });
        try {
            await disconnectDatabase();
        } catch { }
        process.exit(1);
    });