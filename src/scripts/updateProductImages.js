import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { env } from '../../src/config/env.js'; // Adjust path if needed
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'; // Adjust path
import { Product } from '../../src/models/Product.js'; // Adjust path
import { uploadBufferToCloudinary, generateTransformations } from '../../src/services/mediaService.js';
import { logger } from '../../src/config/logger.js';

// Resolve paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base path for local images
const PUBLIC_DIR = path.resolve(__dirname, '../../public/products');

// ── Helper to upload a single local file to Cloudinary ──
const processLocalImage = async (filePath, folder, altText) => {
    if (!fs.existsSync(filePath)) {
        logger.warn(`Missing local file: ${filePath}`);
        return null;
    }

    const buffer = fs.readFileSync(filePath);
    const uploadResult = await uploadBufferToCloudinary(buffer, {
        folder,
        resourceType: 'image'
    });

    const { width, height } = uploadResult;
    const transformations = generateTransformations(uploadResult.public_id, 'image', uploadResult.format);

    return {
        assetType: 'image',
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        altText: altText || 'Timepiece View',
        caption: '',
        displayOrder: 0,
        dimensions: { width: width || 0, height: height || 0 },
        deviceTarget: 'all',
        aspectRatio: '1:1', // Force square for variant images based on prompt specs
        videoOrientation: 'none',
        posterThumbnailUrl: transformations.posterThumbnailUrl
    };
};

// ── Main Script Execution ──
async function updateProductImagesOnly() {
    console.log('============================================================');
    console.log('   KAIRO — LIVE PRODUCT IMAGE UPLOADER & DB SYNC');
    console.log('============================================================');

    try {
        await connectDatabase(env.MONGODB_URI);
        console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

        // Define all 30 Product Slugs and their variant counts
        const productConfigs = [
            // 15 Single-Variant Products
            { slug: 'kairo-nocturne-chronograph', hasTwoVariants: false },
            { slug: 'kairo-celestia-moonphase', hasTwoVariants: false },
            { slug: 'kairo-imperium-tourbillon', hasTwoVariants: false },
            { slug: 'kairo-aurelian-perpetual', hasTwoVariants: false },
            { slug: 'kairo-sovereign-diver', hasTwoVariants: false },
            { slug: 'kairo-reine-diamond', hasTwoVariants: false },
            { slug: 'kairo-altiplano-ultra-thin', hasTwoVariants: false },
            { slug: 'kairo-chronomaster-sport-carbon', hasTwoVariants: false },
            { slug: 'kairo-heritage-monopusher', hasTwoVariants: false },
            { slug: 'kairo-st-moritz-quartz', hasTwoVariants: false },
            { slug: 'kairo-geneva-slim', hasTwoVariants: false },
            { slug: 'kairo-petite-lune-diamond', hasTwoVariants: false },
            { slug: 'kairo-chrono-heritage-quartz', hasTwoVariants: false },
            { slug: 'kairo-sub-aqua-diver', hasTwoVariants: false },
            { slug: 'kairo-classique-small-seconds', hasTwoVariants: false },

            // 15 Two-Variant Products
            { slug: 'kairo-meridian-automatic', hasTwoVariants: true },
            { slug: 'kairo-meridian-skeleton', hasTwoVariants: true },
            { slug: 'kairo-royal-horology-gold', hasTwoVariants: true },
            { slug: 'kairo-reine-petite-nacre', hasTwoVariants: true },
            { slug: 'kairo-chronomaster-sport-cw', hasTwoVariants: true },
            { slug: 'kairo-sovereign-abyss-ti', hasTwoVariants: true },
            { slug: 'kairo-celestia-meteorite', hasTwoVariants: true },
            { slug: 'kairo-atelier-heritage-gmt', hasTwoVariants: true },
            { slug: 'kairo-portofino-slim-dress', hasTwoVariants: true },
            { slug: 'kairo-monaco-chronograph', hasTwoVariants: true },
            { slug: 'kairo-royale-diamond-automatic', hasTwoVariants: true },
            { slug: 'kairo-sub-mariner-pro', hasTwoVariants: true },
            { slug: 'kairo-vintage-field-automatic', hasTwoVariants: true },
            { slug: 'kairo-urban-chrono-quartz', hasTwoVariants: true },
            { slug: 'kairo-petite-stella-elegance', hasTwoVariants: true },
        ];

        let updatedProductsCount = 0;

        for (const config of productConfigs) {
            const { slug, hasTwoVariants } = config;
            console.log(`\n--- Processing Product: ${slug} ---`);

            // 1. Find the existing product
            const product = await Product.findOne({ slug });
            if (!product) {
                logger.error(`Product not found in DB: ${slug}. Skipping.`);
                continue;
            }

            const productFolderPath = path.join(PUBLIC_DIR, slug);
            if (!fs.existsSync(productFolderPath)) {
                logger.error(`Local folder missing for product: ${slug}`);
                continue;
            }

            const newMasterMedia = [];
            const updatedVariants = [...product.variants];

            // 2. Process each variant based on the folder structure
            for (let vIdx = 0; vIdx < updatedVariants.length; vIdx++) {
                const variant = updatedVariants[vIdx];
                const isSingle = updatedVariants.length === 1;
                const variantNum = vIdx + 1;

                // Determine file names based on single vs dual variant structure
                const img1Name = isSingle ? 'image-1.png' : `variant-${variantNum}-image-1.png`;
                const img2Name = isSingle ? 'image-2.png' : `variant-${variantNum}-image-2.png`;

                const localPath1 = path.join(productFolderPath, img1Name);
                const localPath2 = path.join(productFolderPath, img2Name);

                // Cloudinary folder path: kairo/products/{slug}/variant-{num}
                const cloudFolder = `kairo/products/${slug}/variant-${variantNum}`;

                console.log(`  Uploading images for Variant ${variantNum} (SKU: ${variant.sku})...`);

                const uploadedImg1 = await processLocalImage(localPath1, cloudFolder, `${product.name} - ${variant.name} View 1`);
                const uploadedImg2 = await processLocalImage(localPath2, cloudFolder, `${product.name} - ${variant.name} View 2`);

                // 3. Update Variant Media (Retain videos if they exist, replace only images)
                let existingVideo = variant.media?.find(m => m.assetType === 'video');
                const newVariantMedia = [];

                if (uploadedImg1) newVariantMedia.push(uploadedImg1);
                if (uploadedImg2) newVariantMedia.push(uploadedImg2);

                // We want to keep the video if there is one, but the user requested "delete only product videos data", 
                // and "only image update". So we drop the video intentionally as requested.
                if (existingVideo) {
                    // Explicitly omitting to delete
                    console.log(`    -> Removing existing video asset for Variant ${variantNum}`);
                }

                variant.media = newVariantMedia;

                // 4. Populate Master Media using the first image of the first variant
                if (vIdx === 0) {
                    if (uploadedImg1) {
                        // Create a primary image record from variant 1 image 1
                        newMasterMedia.push({
                            ...uploadedImg1,
                            displayOrder: 0,
                            altText: `${product.name} Primary View`
                        });
                    }
                    if (uploadedImg2) {
                        // Create a secondary image record from variant 1 image 2
                        newMasterMedia.push({
                            ...uploadedImg2,
                            displayOrder: 1,
                            altText: `${product.name} Angle View`
                        });
                    }
                }
            }

            // 5. Assign new master media
            product.media = newMasterMedia;
            product.variants = updatedVariants;

            // 6. Save the product
            await product.save();
            updatedProductsCount++;
            console.log(`✓ Successfully updated DB and Cloudinary for: ${product.name}`);
        }

        console.log('\n============================================================');
        console.log(`   ✅ COMPLETED: Updated ${updatedProductsCount} products with new Cloudinary images.`);
        console.log('============================================================\n');

    } catch (error) {
        console.error('\n❌ SCRIPT FAILED WITH ERROR:', error.message);
        console.error(error.stack);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
}

// Start execution
updateProductImagesOnly();