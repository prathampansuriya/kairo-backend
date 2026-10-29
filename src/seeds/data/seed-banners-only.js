/**
 * KAIRO — Banner-Only Seed
 * File: src/seeds/data/seed-banners-only.js
 *
 * Run from the project root:
 * node src/seeds/data/seed-banners-only.js
 *
 * Updates ONLY the Banner collection.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

import { env } from '../../config/env.js';
import { Banner } from '../../models/index.js';

// =====================================================
// 1. MEDIA URLS — REPLACE WITH ACTUAL CLOUDINARY URLS
// =====================================================

const MEDIA_URLS = {
    // BANNER 1 — ATELIER HERITAGE (VIDEOS)
    atelierHeritageDesktopVideo:
        'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1793052198/Luxury_watch_animation_and_assembly_1080p_20261027032952_m7iwle.mp4',
    atelierHeritageMobileVideo:
        'https://res.cloudinary.com/dbtq4qk6s/video/upload/v1793052207/KAIRO_luxury_watch_product_anima__1080p_20261027032958_indeuk.mp4',

    // BANNER 2 — CELESTIAL MOONPHASE (IMAGES)
    celestialMoonphaseDesktopImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053095/Timeless_Elegance_at_Golden_Hour_lygdvf.png',
    celestialMoonphaseMobileImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053106/Sunset_Elegance_with_a_Celestial_Watch_tkztns.png',

    // BANNER 3 — CHRONOMASTER SPORT (IMAGES)
    chronomasterSportDesktopImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053104/Sunset_Chronograph_Skyline_Ad_ylbo4m.png',
    chronomasterSportMobileImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053097/Luxury_Chronograph_at_Golden_Hour_hm7gf9.png',

    // BANNER 4 — SOVEREIGN DIVER (IMAGES)
    sovereignDiverDesktopImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053236/Luxury_Diver_Watch_by_the_Sea_u3utat.png',
    sovereignDiverMobileImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053232/Seaside_Luxury_Diver_Watch_Moment_mvsxee.png',

    // BANNER 5 — ELEGANCE REINE (IMAGES)
    eleganceReineDesktopImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053275/Burgundy_Elegance__Watch_and_Woman_hndnvi.png',
    eleganceReineMobileImage:
        'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1793053279/Timeless_Elegance_in_Plum_and_Gold_zjw2uh.png',
};

// =====================================================
// 2. MEDIA HELPER
// =====================================================

function makeMedia({
    url,
    assetType,
    altText,
    displayOrder,
    aspectRatio,
    publicId,
}) {
    return {
        assetType,
        secureUrl: url,
        publicId: publicId || `kairo-${crypto.randomBytes(8).toString('hex')}`,
        altText,
        caption: altText,
        displayOrder,
        deviceTarget: 'all',
        aspectRatio,
    };
}

// =====================================================
// 3. SIX BANNERS
// =====================================================

const bannersData = [
    {
        title: 'Atelier Heritage',
        subtitle: 'Elegance, Crafted to Last',
        type: 'home',

        desktopMedia: {
            assetType: 'video',
            secureUrl: MEDIA_URLS.atelierHeritageDesktopVideo,
            publicId: 'kairo/atelier-heritage/desktop-video',
            altText:
                'Young Indian woman wearing the KAIRO Atelier Heritage luxury dress watch',
            caption: 'Timeless Elegance. Lasting Heritage.',
            displayOrder: 1,
            deviceTarget: 'all',
            aspectRatio: '16:9',
        },

        mobileMedia: {
            assetType: 'video',
            secureUrl: MEDIA_URLS.atelierHeritageMobileVideo,
            publicId: 'kairo/atelier-heritage/mobile-video',
            altText:
                'Vertical luxury watch campaign featuring a young Indian female model',
            caption: 'Timeless Elegance. Lasting Heritage.',
            displayOrder: 1,
            deviceTarget: 'all',
            aspectRatio: '9:16',
        },

        altText:
            'KAIRO Atelier Heritage luxury watch campaign featuring a young Indian woman',
        ctaLabel: 'Explore Collection',
        ctaLink: '/collections/atelier-heritage',
        publicationStatus: 'published',
        displayOrder: 1,

    },

    {
        title: 'TIME, IN PERFECT HARMONY',
        subtitle: 'An Artful Expression of Precision',
        type: 'home',

        desktopMedia: makeMedia({
            url: MEDIA_URLS.celestialMoonphaseDesktopImage,
            assetType: 'image',
            altText: 'KAIRO Celestial Moonphase watch with midnight blue dial',
            displayOrder: 2,
            aspectRatio: '16:9',
            publicId: 'kairo-celestial-moonphase-desktop',
        }),

        mobileMedia: makeMedia({
            url: MEDIA_URLS.celestialMoonphaseMobileImage,
            assetType: 'image',
            altText: 'KAIRO Celestial Moonphase luxury watch mobile banner',
            displayOrder: 2,
            aspectRatio: '9:16',
            publicId: 'kairo-celestial-moonphase-mobile',
        }),

        altText: 'KAIRO Celestial Moonphase — Time in Perfect Harmony',
        ctaLabel: 'EXPLORE THE COLLECTION',
        ctaLink: '/collections/celestial-moonphase',
        publicationStatus: 'published',
        displayOrder: 2,
    },

    {
        title: 'MADE TO MOVE FORWARD',
        subtitle: 'Precision for Every Pursuit',
        type: 'home',

        desktopMedia: makeMedia({
            url: MEDIA_URLS.chronomasterSportDesktopImage,
            assetType: 'image',
            altText: 'KAIRO Chronomaster Sport black dial sports chronograph',
            displayOrder: 3,
            aspectRatio: '16:9',
            publicId: 'kairo-chronomaster-sport-desktop',
        }),

        mobileMedia: makeMedia({
            url: MEDIA_URLS.chronomasterSportMobileImage,
            assetType: 'image',
            altText: 'KAIRO Chronomaster Sport mobile luxury watch banner',
            displayOrder: 3,
            aspectRatio: '9:16',
            publicId: 'kairo-chronomaster-sport-mobile',
        }),

        altText: 'KAIRO Chronomaster Sport — Made to Move Forward',
        ctaLabel: 'DISCOVER SPORT',
        ctaLink: '/collections/chronomaster-sport',
        publicationStatus: 'published',
        displayOrder: 3,
    },

    {
        title: 'BUILT FOR THE UNCHARTED',
        subtitle: 'Adventure Beyond Boundaries',
        type: 'home',

        desktopMedia: makeMedia({
            url: MEDIA_URLS.sovereignDiverDesktopImage,
            assetType: 'image',
            altText: 'KAIRO Sovereign Diver professional luxury diving watch',
            displayOrder: 4,
            aspectRatio: '16:9',
            publicId: 'kairo-sovereign-diver-desktop',
        }),

        mobileMedia: makeMedia({
            url: MEDIA_URLS.sovereignDiverMobileImage,
            assetType: 'image',
            altText: 'KAIRO Sovereign Diver luxury diving watch mobile banner',
            displayOrder: 4,
            aspectRatio: '9:16',
            publicId: 'kairo-sovereign-diver-mobile',
        }),

        altText: 'KAIRO Sovereign Diver — Built for the Uncharted',
        ctaLabel: 'EXPLORE DIVER',
        ctaLink: '/collections/sovereign-diver',
        publicationStatus: 'published',
        displayOrder: 4,
    },

    {
        title: 'ELEGANCE, REDEFINED',
        subtitle: 'A Signature of Grace',
        type: 'home',

        desktopMedia: makeMedia({
            url: MEDIA_URLS.eleganceReineDesktopImage,
            assetType: 'image',
            altText: 'KAIRO Elegance Reine refined luxury dress watch',
            displayOrder: 5,
            aspectRatio: '16:9',
            publicId: 'kairo-elegance-reine-desktop',
        }),

        mobileMedia: makeMedia({
            url: MEDIA_URLS.eleganceReineMobileImage,
            assetType: 'image',
            altText: 'KAIRO Elegance Reine luxury watch mobile banner',
            displayOrder: 5,
            aspectRatio: '9:16',
            publicId: 'kairo-elegance-reine-mobile',
        }),

        altText: 'KAIRO Elegance Reine — Elegance, Redefined',
        ctaLabel: 'DISCOVER ELEGANCE',
        ctaLink: '/collections/elegance-reine',
        publicationStatus: 'published',
        displayOrder: 5,
    },
];

// =====================================================
// 4. VALIDATE ALL MEDIA URLS BEFORE DELETING ANYTHING
// =====================================================

function validateMediaUrls() {
    const missing = Object.entries(MEDIA_URLS)
        .filter(
            ([, url]) =>
                typeof url !== 'string' ||
                !/^https?:\/\//i.test(url) ||
                url.includes('REPLACE_WITH_'),
        )
        .map(([key]) => key);

    if (missing.length) {
        throw new Error(
            `Replace these media URL placeholders before running:\n${missing.join('\n')}`,
        );
    }
}

// =====================================================
// 5. SEED ONLY THE BANNER COLLECTION
// =====================================================

async function seedBannersOnly() {
    let openedConnectionHere = false;

    try {
        console.log('\nKAIRO Banner-Only Seed Started\n');

        validateMediaUrls();

        if (!env.MONGODB_URI) {
            throw new Error('MONGODB_URI is missing from environment configuration.');
        }

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(env.MONGODB_URI);
            openedConnectionHere = true;
        }

        console.log('Connected to MongoDB.');

        // IMPORTANT: Only Banner documents are deleted.
        const deleted = await Banner.deleteMany({});
        console.log(`Deleted ${deleted.deletedCount ?? 0} existing banners.`);

        const inserted = await Banner.insertMany(bannersData, {
            ordered: true,
        });

        const saved = await Banner.find({})
            .sort({ displayOrder: 1 })
            .lean();

        console.log(`Inserted ${inserted.length} banners.`);
        console.log(`Verified ${saved.length} banners:\n`);

        for (const banner of saved) {
            console.log({
                title: banner.title,
                order: banner.displayOrder,
                desktopType: banner.desktopMedia?.assetType,
                desktopRatio: banner.desktopMedia?.aspectRatio,
                mobileType: banner.mobileMedia?.assetType,
                mobileRatio: banner.mobileMedia?.aspectRatio,
                status: banner.publicationStatus,
            });
        }

        if (saved.length !== 6) {
            throw new Error(`Expected 6 banners but found ${saved.length}.`);
        }

        console.log('\nBanner-only seed completed successfully.');
        console.log('No other collection was modified.');
    } catch (error) {
        console.error('\nBanner seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (
            openedConnectionHere &&
            mongoose.connection.readyState !== 0
        ) {
            await mongoose.disconnect();
            console.log('MongoDB connection closed.');
        }
    }
}

seedBannersOnly();