/**
 * KAIRO — Order Item Media Snapshot Sync
 * ---------------------------------------
 * Purpose:
 *   Orders seeded BEFORE the live Cloudinary image upload still carry
 *   Unsplash URLs in `items[].mediaSnapshot.url` and
 *   `pricingSnapshot.lines[].thumbnailUrl`.
 *   This script re-resolves each order item back to its live Product variant
 *   and writes the current Cloudinary URL into the order snapshot.
 *
 * Usage:
 *   node backend/scripts/syncOrderItemMediaSnapshots.js            # apply
 *   node backend/scripts/syncOrderItemMediaSnapshots.js --dry-run  # preview only
 *   node backend/scripts/syncOrderItemMediaSnapshots.js --order KRO-ORD-2026-01005
 *
 * Safe to run repeatedly — only updates when the URL actually changes.
 */

import mongoose from 'mongoose';
import { env } from '../../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Order } from '../../src/models/Order.js';
import { Product } from '../../src/models/Product.js';
import { ProductVariant } from '../../src/models/ProductVariant.js';
import { logger } from '../../src/config/logger.js';

const DRY_RUN = process.argv.includes('--dry-run');
const singleOrderArg = (() => {
    const idx = process.argv.indexOf('--order');
    return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the best live media URL for a given variant, mirroring the exact
 * precedence used by orderService._buildAndValidateLineItems:
 *   variant.media[0].secureUrl → variant.media[0].url
 *   → product.primaryMedia.secureUrl → product.media[0].secureUrl → product.media[0].url
 *
 * @returns {{ url: string|null, publicId: string|null, altText: string|null, assetType: string|null }}
 */
function resolveLiveMedia(product, variant) {
    const pick = (obj) => (obj && typeof obj.secureUrl === 'string' && obj.secureUrl.trim()) || null;

    const variantPrimary = (variant?.media || []).find(
        (m) => m && (m.secureUrl || m.url) && m.assetType !== 'video'
    );
    const productPrimary = (product?.media || []).find(
        (m) => m && (m.secureUrl || m.url) && m.assetType !== 'video'
    );

    const chosen =
        pick(variantPrimary) && variantPrimary
            ? variantPrimary
            : productPrimary;

    if (!chosen) {
        return { url: null, publicId: null, altText: null, assetType: null };
    }

    const url = chosen.secureUrl || chosen.url || null;
    const publicId = chosen.publicId || null;
    const altText =
        chosen.altText ||
        `${product?.name || 'Timepiece'}${variant?.name ? ' – ' + variant.name : ''}`;
    const assetType = chosen.assetType || 'image';

    return { url, publicId, altText, assetType };
}

/**
 * Find the live variant for an order line.
 * Primary lookup: by sku on the parent Product (embedded variants).
 * Fallback: standalone ProductVariant model lookup by sku.
 * Last resort: match by variantId in the embedded variants array.
 */
async function findLiveVariant(orderItem, productCache) {
    const productId = orderItem.productId?.toString();
    const sku = orderItem.sku;

    // Use cache to avoid hitting the DB once per line item
    let product = productCache.get(productId);
    if (product === undefined) {
        product = await Product.findById(productId).lean();
        productCache.set(productId, product || null);
    }

    if (product) {
        const embedded =
            product.variants?.find((v) => v.sku === sku) ||
            (orderItem.variantId
                ? product.variants?.find(
                    (v) => v._id?.toString() === orderItem.variantId.toString()
                )
                : null);
        if (embedded) return { product, variant: embedded };
    }

    // Fallback to standalone ProductVariant model
    const standalone = await ProductVariant.findOne({ sku }).lean();
    if (standalone) {
        const parent = await Product.findById(standalone.productId).lean();
        return { product: parent || null, variant: standalone };
    }

    return { product: product || null, variant: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
    console.log('============================================================');
    console.log('   KAIRO — ORDER ITEM MEDIA SNAPSHOT SYNC');
    console.log(`   Mode: ${DRY_RUN ? 'DRY-RUN (no writes)' : 'APPLY (will update DB)'}`);
    if (singleOrderArg) console.log(`   Scope: single order → ${singleOrderArg}`);
    console.log('============================================================\n');

    await connectDatabase(env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}\n`);

    const query = singleOrderArg ? { orderNumber: singleOrderArg } : {};
    const orders = await Order.find(query).sort({ createdAt: 1 }).lean();

    console.log(`Found ${orders.length} order(s) to inspect.\n`);

    const productCache = new Map();

    let ordersScanned = 0;
    let ordersUpdated = 0;
    let linesScanned = 0;
    let linesUpdated = 0;
    let linesSkippedNoVariant = 0;
    let linesSkippedNoUrl = 0;
    let linesSkippedUnchanged = 0;

    for (const order of orders) {
        ordersScanned++;

        let orderHasChange = false;
        const updatedItems = [];
        const updatedSnapshotLines = [];
        const changeLog = [];

        // Build a map of current pricingSnapshot.lines by SKU for quick lookup
        const snapshotLinesBySku = new Map();
        (order.pricingSnapshot?.lines || []).forEach((l) => {
            if (l.variantSku) snapshotLinesBySku.set(l.variantSku, { ...l });
        });

        // ── 1. Update Order.items[] ─────────────────────────────────────────────
        for (let i = 0; i < (order.items || []).length; i++) {
            const item = order.items[i];
            linesScanned++;

            const { product, variant } = await findLiveVariant(item, productCache);

            if (!product || !variant) {
                linesSkippedNoVariant++;
                console.log(
                    `  ⚠ [${order.orderNumber}] SKU ${item.sku} — live variant not found; leaving snapshot untouched.`
                );
                updatedItems.push(item);
                continue;
            }

            const liveMedia = resolveLiveMedia(product, variant);

            if (!liveMedia.url) {
                linesSkippedNoUrl++;
                console.log(
                    `  ⚠ [${order.orderNumber}] SKU ${item.sku} — live product has no image; skipping.`
                );
                updatedItems.push(item);
                continue;
            }

            const previousUrl = item?.mediaSnapshot?.url || null;

            if (previousUrl === liveMedia.url) {
                linesSkippedUnchanged++;
                updatedItems.push(item);
                continue;
            }

            // Preserve existing publicId/altText if the live one is null
            const nextMediaSnapshot = {
                url: liveMedia.url,
                publicId: liveMedia.publicId || item?.mediaSnapshot?.publicId || undefined,
                altText: liveMedia.altText || item?.mediaSnapshot?.altText || undefined
            };

            const nextItem = {
                ...item,
                mediaSnapshot: nextMediaSnapshot
            };

            updatedItems.push(nextItem);
            orderHasChange = true;
            linesUpdated++;
            changeLog.push(
                `    ✓ items[${i}] ${item.sku}: ${truncate(previousUrl)} → ${truncate(liveMedia.url)}`
            );

            // Also update the matching pricingSnapshot line (same SKU) if present
            const snapLine = snapshotLinesBySku.get(item.sku);
            if (snapLine) {
                snapLine.thumbnailUrl = liveMedia.url;
                snapLine.mediaUrl = liveMedia.url;
            }
        }

        // ── 2. Update pricingSnapshot.lines[] thumbnailUrl (any that weren't matched) ──
        // Iterate over the (possibly updated) map, and also cover lines that had no
        // matching OrderItem (defensive — snapshot should always mirror items).
        for (const [sku, line] of snapshotLinesBySku.entries()) {
            if (!line) continue;

            // If we already updated it via items[] loop, skip
            const wasUpdatedAbove = updatedItems.some(
                (it) => it.sku === sku && it.mediaSnapshot?.url === line.thumbnailUrl
            );
            if (wasUpdatedAbove) {
                updatedSnapshotLines.push(line);
                continue;
            }

            // Otherwise, resolve and update independently
            const matchingItem = updatedItems.find((it) => it.sku === sku);
            if (matchingItem?.mediaSnapshot?.url) {
                line.thumbnailUrl = matchingItem.mediaSnapshot.url;
                line.mediaUrl = matchingItem.mediaSnapshot.url;
                updatedSnapshotLines.push(line);
                continue;
            }

            const { product, variant } = await findLiveVariant(
                { productId: line.productId, sku, variantId: line.variantId },
                productCache
            );
            const liveMedia = product && variant ? resolveLiveMedia(product, variant) : null;
            if (liveMedia?.url && line.thumbnailUrl !== liveMedia.url) {
                const prev = line.thumbnailUrl;
                line.thumbnailUrl = liveMedia.url;
                line.mediaUrl = liveMedia.url;
                orderHasChange = true;
                changeLog.push(
                    `    ✓ pricingSnapshot.lines[${sku}].thumbnailUrl: ${truncate(prev)} → ${truncate(liveMedia.url)}`
                );
            }
            updatedSnapshotLines.push(line);
        }

        // ── 3. Persist (if changed) ─────────────────────────────────────────────
        if (orderHasChange) {
            ordersUpdated++;
            console.log(`\n── [${order.orderNumber}] updating ${changeLog.length} media URL(s)`);
            changeLog.forEach((c) => console.log(c));

            if (!DRY_RUN) {
                const pricingSnapshot = order.pricingSnapshot
                    ? { ...order.pricingSnapshot, lines: updatedSnapshotLines }
                    : order.pricingSnapshot;

                await Order.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            items: updatedItems,
                            ...(pricingSnapshot ? { pricingSnapshot } : {})
                        }
                    }
                );
            }
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log('   SUMMARY');
    console.log('============================================================');
    console.log(`Orders scanned            : ${ordersScanned}`);
    console.log(`Orders with URL changes   : ${ordersUpdated}`);
    console.log(`Line items scanned        : ${linesScanned}`);
    console.log(`Line items updated        : ${linesUpdated}`);
    console.log(`Skipped — no live variant : ${linesSkippedNoVariant}`);
    console.log(`Skipped — no live URL     : ${linesSkippedNoUrl}`);
    console.log(`Skipped — already synced  : ${linesSkippedUnchanged}`);
    console.log(`Mode                      : ${DRY_RUN ? 'DRY-RUN' : 'APPLIED'}`);
    console.log('============================================================\n');

    if (DRY_RUN && ordersUpdated > 0) {
        console.log('👉 Re-run without --dry-run to persist these changes.\n');
    }
}

function truncate(url, max = 68) {
    if (!url) return '∅';
    return url.length <= max ? url : `${url.slice(0, max - 3)}...`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

run()
    .then(async () => {
        await disconnectDatabase();
        process.exit(0);
    })
    .catch(async (err) => {
        logger.error('Order media snapshot sync failed', {
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