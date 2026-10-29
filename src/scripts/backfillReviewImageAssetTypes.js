/**
 * KAIRO — Backfill Review.images[] + reclassify assetType
 *            + replace non-Cloudinary (Unsplash) URLs with real product Cloudinary URLs
 * ---------------------------------------------------------------------------------
 * Three responsibilities:
 *  1) For reviews whose `images` array is empty/missing → populate with 1–3
 *     deterministic images from the review's own product Cloudinary media.
 *  2) For reviews that already have images, correct any missing or wrong
 *     `assetType` field based on URL heuristics.
 *  3) For any review image whose URL is NOT a Cloudinary URL
 *     (Unsplash, placehold.co, etc.) → replace it in place with a
 *     product-specific Cloudinary URL (deterministic per review+slot).
 *
 * Guarantees:
 *  - Idempotent   : running twice changes nothing the second time
 *  - Deterministic: same review id → same image set every run
 *  - Atomic       : single updateOne per review
 *  - Safe         : Cloudinary URLs that already exist are never overwritten
 *  - Video URLs   : excluded from image arrays
 *
 * Usage:
 *   node backend/scripts/backfillReviewImageAssetTypes.js --dry-run
 *   node backend/scripts/backfillReviewImageAssetTypes.js
 *   node backend/scripts/backfillReviewImageAssetTypes.js --force
 *   node backend/scripts/backfillReviewImageAssetTypes.js --limit 50
 *   node backend/scripts/backfillReviewImageAssetTypes.js --verbose
 */

import mongoose from 'mongoose';
import { env } from '../../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Review } from '../../src/models/Review.js';
import { Product } from '../../src/models/Product.js';
import { logger } from '../../src/config/logger.js';

// ── CLI flags ──────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');
const LIMIT = (() => {
    const i = process.argv.indexOf('--limit');
    if (i === -1) return null;
    const n = parseInt(process.argv[i + 1], 10);
    return Number.isInteger(n) && n > 0 ? n : null;
})();

// ── URL helpers ────────────────────────────────────────────────────────────
const isCloudinaryUrl = (url) =>
    typeof url === 'string' && url.includes('res.cloudinary.com');

const isVideoUrl = (url) => {
    if (typeof url !== 'string') return false;
    return (
        /\.(mp4|webm|mov|m3u8)(\?|#|$)/i.test(url) ||
        url.includes('/video/upload/')
    );
};

const short = (url, max = 70) => {
    if (!url) return '∅';
    return url.length <= max ? url : `${url.slice(0, max - 3)}...`;
};

// ── Deterministic count for empty-array population ─────────────────────────
function pickImageCount(reviewId, isVerified) {
    const idStr = reviewId.toString();
    const seed = parseInt(idStr.slice(-8), 16) || 0;
    const roll = seed % 10;

    let count = 1;
    if (roll < 6) count = 1;      // 60%
    else if (roll < 9) count = 2; // 30%
    else count = 3;               // 10%

    if (isVerified && count === 1 && seed % 3 === 0) {
        count = 2;
    }
    return count;
}

// ── Build Cloudinary-only pool for a product ───────────────────────────────
function collectProductCloudinaryPool(product) {
    if (!product) return [];

    const pool = [];
    const seen = new Set();

    const pushCandidate = (media, fallbackAlt) => {
        if (!media) return;
        const url = media.secureUrl || media.url || '';
        if (!url) return;
        if (seen.has(url)) return;
        if (media.assetType === 'video' || isVideoUrl(url)) return;
        if (!isCloudinaryUrl(url)) return; // Cloudinary images only

        seen.add(url);
        pool.push({
            url,
            publicId: media.publicId || undefined,
            altText: media.altText || fallbackAlt || 'Timepiece view',
            assetType: 'image'
        });
    };

    // Master media first
    for (const m of product.media || []) {
        pushCandidate(m, product.name);
    }

    // Then variant media, default variant first
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const ordered = [
        ...variants.filter((v) => v.isDefault),
        ...variants.filter((v) => !v.isDefault)
    ];

    for (const variant of ordered) {
        for (const m of variant.media || []) {
            pushCandidate(
                m,
                `${product.name}${variant.name ? ' – ' + variant.name : ''}`
            );
        }
    }

    return pool;
}

/**
 * Deterministic pick for (reviewId, slot). Same inputs → same URL.
 * Falls back to slot 0 if pool is small.
 */
function pickFromPool(pool, reviewId, slot) {
    if (!pool || pool.length === 0) return null;
    const idStr = reviewId.toString();
    const seed = parseInt(idStr.slice(-8), 16) || 0;
    const idx = (seed + slot * 7) % pool.length;
    return pool[idx];
}

/**
 * Choose `count` distinct images from the pool.
 */
function chooseImagesFromPool(pool, reviewId, isVerified) {
    if (!pool || pool.length === 0) return [];

    const wantCount = pickImageCount(reviewId, isVerified);
    const take = Math.min(wantCount, pool.length);

    const usedIdx = new Set();
    const picked = [];
    const idStr = reviewId.toString();
    const seed = parseInt(idStr.slice(-8), 16) || 0;

    for (let i = 0; i < take; i++) {
        let idx = (seed + i * 7) % pool.length;
        let guard = 0;
        while (usedIdx.has(idx) && guard < pool.length) {
            idx = (idx + 1) % pool.length;
            guard++;
        }
        usedIdx.add(idx);

        const c = pool[idx];
        picked.push({
            url: c.url,
            publicId: c.publicId,
            altText: c.altText,
            assetType: 'image'
        });
    }

    return picked;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
    await connectDatabase(env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    console.log(
        `Mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'APPLY'}${FORCE ? ' | FORCE overwrite' : ''}${VERBOSE ? ' | VERBOSE' : ''
        }\n`
    );

    let query = Review.find({}).select(
        '_id productId images isVerifiedPurchase rating title'
    );
    if (LIMIT) query = query.limit(LIMIT);

    const reviews = await query.lean();
    console.log(`Found ${reviews.length} review(s) to scan.\n`);

    // Product cache
    const productCache = new Map();
    async function getProduct(productId) {
        const key = productId?.toString();
        if (!key) return null;
        if (productCache.has(key)) return productCache.get(key);

        const product = await Product.findById(key)
            .select('name media variants.name variants.isDefault variants.media')
            .lean();
        productCache.set(key, product || null);
        return productCache.get(key);
    }

    // ── Counters ─────────────────────────────────────────────────────────────
    let reviewsScanned = 0;
    let reviewsUpdated = 0;
    let reviewsSkipped = 0;
    let reviewsNoProduct = 0;
    let reviewsNoProductMedia = 0;

    let imagesPopulated = 0;             // empty → filled
    let imagesReplacedWithCloudinary = 0; // non-Cloudinary → Cloudinary
    let assetTypeCorrected = 0;           // missing/wrong assetType fixed

    for (const review of reviews) {
        reviewsScanned++;

        const existing = Array.isArray(review.images) ? review.images : [];
        const hasExisting = existing.length > 0;

        // Skip fully-synced reviews when not FORCE and nothing to do
        // (still may need URL replacement — so we don't skip on hasExisting alone)

        // Resolve product (only when we actually need Cloudinary URLs)
        const needsProduct =
            !hasExisting ||
            FORCE ||
            existing.some((img) => {
                const url = img.url || img.secureUrl || '';
                return !isCloudinaryUrl(url);
            });

        let pool = [];
        if (needsProduct) {
            const product = await getProduct(review.productId);
            if (!product) {
                reviewsNoProduct++;
                console.log(
                    `  ⚠ [${review._id}] productId ${review.productId} → product not found, skipping`
                );
                continue;
            }

            pool = collectProductCloudinaryPool(product);
            if (pool.length === 0 && needsProduct) {
                // If we can't resolve any Cloudinary URL for this product, we
                // can't safely replace anything, nor populate a new array.
                reviewsNoProductMedia++;
                console.log(
                    `  ⚠ [${review._id}] product "${product.name}" has no Cloudinary image media, skipping`
                );
                continue;
            }

            if (VERBOSE) {
                console.log(
                    `  · [${review._id}] product "${short(product.name, 42)}" → ${pool.length} Cloudinary image(s) available`
                );
            }
        }

        let nextImages;
        let changed = false;
        let mode = 'skip';
        let perReviewReplaced = 0;
        let perReviewPopulated = 0;
        let perReviewAssetFixed = 0;

        // ── PATH A: Empty array → populate ─────────────────────────────────────
        if (!hasExisting) {
            nextImages = chooseImagesFromPool(
                pool,
                review._id,
                review.isVerifiedPurchase
            );
            if (nextImages.length === 0) {
                reviewsNoProductMedia++;
                continue;
            }
            changed = true;
            mode = 'populate';
            perReviewPopulated = nextImages.length;
            imagesPopulated += nextImages.length;
        }

        // ── PATH B: Existing array → replace non-Cloudinary + fix assetType ────
        else {
            nextImages = existing.map((img, slot) => {
                const originalUrl = img.url || img.secureUrl || '';
                let newUrl = originalUrl;
                let wasReplaced = false;

                // 1. Replace non-Cloudinary URLs
                if (!isCloudinaryUrl(originalUrl)) {
                    const candidate = pickFromPool(pool, review._id, slot);
                    if (candidate) {
                        newUrl = candidate.url;
                        wasReplaced = true;
                        changed = true;
                        perReviewReplaced++;
                        imagesReplacedWithCloudinary++;
                    } else {
                        // No Cloudinary candidate — keep original (safer than emptying)
                        if (VERBOSE) {
                            console.log(
                                `  ⚠ [${review._id}] slot ${slot}: no Cloudinary candidate for replacement, keeping ${short(originalUrl)}`
                            );
                        }
                    }
                }

                // 2. Fix assetType based on final URL (or existing claim)
                const currentType = img.assetType;
                const inferredType = isVideoUrl(newUrl) ? 'video' : 'image';
                let finalType = currentType;

                if (!currentType || (currentType !== 'image' && currentType !== 'video')) {
                    finalType = inferredType;
                    changed = true;
                    perReviewAssetFixed++;
                    assetTypeCorrected++;
                } else if (currentType === 'image' && inferredType === 'video') {
                    finalType = 'video';
                    changed = true;
                    perReviewAssetFixed++;
                    assetTypeCorrected++;
                }
                // Never downgrade an explicit 'video' to 'image' — safer to trust the claim

                // 3. Preserve publicId/altText; prefer candidate's publicId if replaced
                let publicId = img.publicId;
                let altText = img.altText;
                if (wasReplaced) {
                    const candidate = pickFromPool(pool, review._id, slot);
                    if (candidate) {
                        publicId = candidate.publicId || publicId;
                        altText = candidate.altText || altText;
                    }
                }

                return {
                    url: newUrl,
                    publicId,
                    altText,
                    assetType: finalType
                };
            });

            // If nothing changed (all Cloudinary + correct assetType) → skip write
            if (!changed) {
                reviewsSkipped++;
                continue;
            }

            mode =
                perReviewReplaced > 0 && perReviewAssetFixed > 0
                    ? 'replace+fix'
                    : perReviewReplaced > 0
                        ? 'replace'
                        : 'fix-assetType';
        }

        // ── Persist ────────────────────────────────────────────────────────────
        if (DRY_RUN) {
            console.log(
                `  · [${mode}] review ${review._id} — would write ${nextImages.length} image(s)` +
                (perReviewReplaced
                    ? ` (${perReviewReplaced} unsplash→cloudinary)`
                    : '') +
                (perReviewPopulated ? ` (${perReviewPopulated} populated)` : '') +
                (perReviewAssetFixed ? ` (${perReviewAssetFixed} assetType fixed)` : '')
            );
            if (VERBOSE) {
                nextImages.forEach((im, i) => {
                    const orig = existing[i]?.url || existing[i]?.secureUrl || '∅';
                    const tag = im.assetType === 'video' ? '🎥' : '🖼 ';
                    if (orig !== im.url) {
                        console.log(`       ${tag} [${i}]  ${short(orig, 42)}  →  ${short(im.url, 42)}`);
                    } else {
                        console.log(`       ${tag} [${i}]  ${short(im.url, 42)}`);
                    }
                });
            }
        } else {
            await Review.updateOne(
                { _id: review._id },
                { $set: { images: nextImages } }
            );
            console.log(
                `  ✓ [${mode}] review ${review._id} — wrote ${nextImages.length} image(s)` +
                (perReviewReplaced ? ` (${perReviewReplaced} replaced)` : '') +
                (perReviewPopulated ? ` (${perReviewPopulated} populated)` : '') +
                (perReviewAssetFixed ? ` (${perReviewAssetFixed} fixed)` : '')
            );
        }
        reviewsUpdated++;
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log('   BACKFILL SUMMARY');
    console.log('============================================================');
    console.log(`Reviews scanned              : ${reviewsScanned}`);
    console.log(`Reviews updated              : ${reviewsUpdated}`);
    console.log(`Reviews skipped (already OK) : ${reviewsSkipped}`);
    console.log(`Skipped — product not found  : ${reviewsNoProduct}`);
    console.log(`Skipped — no Cloudinary media: ${reviewsNoProductMedia}`);
    console.log(`Images populated (empty→set) : ${imagesPopulated}`);
    console.log(`Images replaced (Unsplash→C) : ${imagesReplacedWithCloudinary}`);
    console.log(`assetType corrections        : ${assetTypeCorrected}`);
    console.log(`Mode                         : ${DRY_RUN ? 'DRY-RUN' : 'APPLIED'}`);
    console.log('============================================================\n');

    if (DRY_RUN && reviewsUpdated > 0) {
        console.log('👉 Re-run without --dry-run to persist these changes.\n');
    }
}

// ── Entry ──────────────────────────────────────────────────────────────────
run()
    .then(async () => {
        await disconnectDatabase();
        process.exit(0);
    })
    .catch(async (err) => {
        logger.error('Review images backfill failed', {
            error: err.message,
            stack: err.stack
        });
        console.error('\n❌ FAILED:', err.message);
        console.error(err.stack);
        try {
            await disconnectDatabase();
        } catch {
            /* ignore */
        }
        process.exit(1);
    });