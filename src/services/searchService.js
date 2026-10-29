import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';

const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Unified faceted search across Products, Categories, and Collections
 */
export const globalSearch = async (query = {}) => {
    const {
        q = '',
        type = 'all', // 'all' | 'products' | 'categories' | 'collections'
        page = 1,
        limit = 12,
        sort = 'relevance'
    } = query;

    const trimmed = (q || '').trim();
    if (!trimmed) {
        return {
            query: trimmed,
            type,
            products: { results: [], totalCount: 0, pagination: { totalCount: 0, totalPages: 0, currentPage: 1, limit } },
            categories: [],
            collections: [],
            suggestions: []
        };
    }

    const regex = new RegExp(escapeRegex(trimmed), 'i');
    const skip = (Number(page) - 1) * Number(limit);

    const results = {
        query: trimmed,
        type,
        products: { results: [], totalCount: 0, pagination: { totalCount: 0, totalPages: 0, currentPage: Number(page), limit: Number(limit) } },
        categories: [],
        collections: [],
        suggestions: []
    };

    // ── 1. Products ──
    if (type === 'all' || type === 'products') {
        const productFilter = {
            publicationStatus: 'published',
            $or: [
                { name: regex },
                { shortDescription: regex },
                { description: regex },
                { masterSku: regex },
                { 'variants.sku': regex },
                { tags: regex },
                { 'technicalSpecifications.movementType': regex },
                { 'technicalSpecifications.caseMaterial': regex },
                { 'technicalSpecifications.dialColor': regex },
                { 'technicalSpecifications.strapMaterial': regex }
            ]
        };

        let sortOptions = { createdAt: -1 };
        if (sort === 'price_asc') sortOptions = { 'variants.pricePaise': 1 };
        else if (sort === 'price_desc') sortOptions = { 'variants.pricePaise': -1 };
        else if (sort === 'bestsellers') sortOptions = { 'merchandisingFlags.isBestseller': -1, 'ratingSummary.average': -1 };

        const [products, totalCount] = await Promise.all([
            Product.find(productFilter)
                .sort(sortOptions)
                .skip(skip)
                .limit(Number(limit))
                .populate('category', 'name slug')
                .populate('collections', 'name slug')
                .lean(),
            Product.countDocuments(productFilter)
        ]);

        const augmented = products.map((prod) => {
            const defaultVariant = prod.variants?.find((v) => v.isDefault) || prod.variants?.[0];
            const prices = (prod.variants || []).map((v) => v.pricePaise);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            return {
                ...prod,
                defaultVariant,
                priceRange: { minPricePaise: minPrice, maxPricePaise: maxPrice, hasRange: minPrice !== maxPrice },
                totalStock: (prod.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
            };
        });

        results.products = {
            results: augmented,
            totalCount,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / Number(limit)),
                currentPage: Number(page),
                limit: Number(limit)
            }
        };
    }

    // ── 2. Categories ──
    if (type === 'all' || type === 'categories') {
        const categories = await Category.find({
            isActive: true,
            $or: [{ name: regex }, { description: regex }, { slug: regex }]
        })
            .limit(6)
            .select('name slug description image bannerImage')
            .lean();

        results.categories = categories.map((cat) => ({
            ...cat,
            type: 'category'
        }));
    }

    // ── 3. Collections ──
    if (type === 'all' || type === 'collections') {
        const collections = await Collection.find({
            status: 'active',
            $or: [{ name: regex }, { story: regex }, { slug: regex }]
        })
            .limit(6)
            .select('name slug story image themeAccent thumbnailMedia bannerDesktopMedia')
            .lean();

        results.collections = collections.map((col) => ({
            ...col,
            type: 'collection',
            image: col.image || col.thumbnailMedia?.secureUrl || col.bannerDesktopMedia?.secureUrl || ''
        }));
    }

    // ── 4. Suggestions (for inline typeahead) ──
    const suggestions = [
        ...results.categories.map((c) => ({ label: c.name, type: 'category', slug: c.slug })),
        ...results.collections.map((c) => ({ label: c.name, type: 'collection', slug: c.slug })),
        ...results.products.results.slice(0, 5).map((p) => ({ label: p.name, type: 'product', slug: p.slug }))
    ];

    results.suggestions = suggestions;

    return results;
};

/**
 * Fast autocomplete endpoint for search modal dropdown
 */
export const autocompleteSearch = async (q = '') => {
    const trimmed = (q || '').trim();
    if (!trimmed || trimmed.length < 2) {
        return { query: trimmed, categories: [], collections: [], products: [] };
    }

    const regex = new RegExp(escapeRegex(trimmed), 'i');

    const [categories, collections, products] = await Promise.all([
        Category.find({
            isActive: true,
            $or: [{ name: regex }, { slug: regex }]
        })
            .limit(4)
            .select('name slug')
            .lean(),

        Collection.find({
            status: 'active',
            $or: [{ name: regex }, { slug: regex }]
        })
            .limit(4)
            .select('name slug themeAccent image thumbnailMedia bannerDesktopMedia')
            .lean(),

        Product.find({
            publicationStatus: 'published',
            $or: [
                { name: regex },
                { masterSku: regex },
                { 'variants.sku': regex },
                { tags: regex }
            ]
        })
            .limit(6)
            .select('name slug masterSku shortDescription media variants category ratingSummary')
            .populate('category', 'name slug')
            .lean()
    ]);

    const normalizedProducts = products.map((p) => {
        const defaultVariant = p.variants?.find((v) => v.isDefault) || p.variants?.[0] || {};
        const primaryImage =
            defaultVariant.media?.[0]?.secureUrl ||
            p.media?.[0]?.secureUrl ||
            '';
        return {
            _id: p._id,
            name: p.name,
            slug: p.slug,
            masterSku: p.masterSku,
            shortDescription: p.shortDescription,
            categoryName: p.category?.name || 'Timepieces',
            pricePaise: defaultVariant.pricePaise || 0,
            ratingAverage: p.ratingSummary?.average || 0,
            image: primaryImage
        };
    });

    const normalizedCollections = collections.map((c) => ({
        ...c,
        image: c.image || c.thumbnailMedia?.secureUrl || c.bannerDesktopMedia?.secureUrl || ''
    }));

    return {
        query: trimmed,
        categories,
        collections: normalizedCollections,
        products: normalizedProducts
    };
};

export default { globalSearch, autocompleteSearch };