import crypto from 'crypto';
import { Contest } from '../models/Contest.js';
import { ContestEntry } from '../models/ContestEntry.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import emailService from './emailService.js';

const generateSlug = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const createContest = async (data) => {
    const slug = data.slug ? generateSlug(data.slug) : generateSlug(data.title);
    const existing = await Contest.findOne({ $or: [{ slug }, { contestCode: data.contestCode.toUpperCase() }] });
    if (existing) {
        throw ApiError.conflict('A contest with this slug or code already exists');
    }

    if (data.eligibilityCategories?.length) {
        const validCats = await Category.countDocuments({ _id: { $in: data.eligibilityCategories } });
        if (validCats !== data.eligibilityCategories.length) {
            throw ApiError.badRequest('One or more eligible categories do not exist');
        }
    }

    const contest = await Contest.create({ ...data, slug, contestCode: data.contestCode.toUpperCase() });
    logger.info(`Contest created: ${contest.title} (${contest.contestCode})`);
    return contest;
};

export const getAllContestsAdmin = async ({ search, status, page = 1, limit = 20 } = {}) => {
    const filter = {};
    if (status && status !== 'all') filter.publicationStatus = status;
    if (search && search.trim()) {
        filter.$or = [
            { title: new RegExp(search.trim(), 'i') },
            { contestCode: new RegExp(search.trim(), 'i') },
            { prizeName: new RegExp(search.trim(), 'i') }
        ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [contests, totalCount] = await Promise.all([
        Contest.find(filter)
            .populate('eligibilityCategories', 'name slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Contest.countDocuments(filter)
    ]);

    return {
        contests,
        pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
        }
    };
};

export const getPublicActiveContest = async () => {
    const contest = await Contest.findOne({ publicationStatus: 'active' })
        .populate('eligibilityCategories', 'name slug')
        .sort({ createdAt: -1 })
        .lean();

    if (!contest) {
        // Return latest contest regardless of status so the page is not blank
        const latest = await Contest.findOne()
            .populate('eligibilityCategories', 'name slug')
            .sort({ createdAt: -1 })
            .lean();
        if (!latest) {
            throw ApiError.notFound('No active contest available at this time', 'NO_ACTIVE_CONTEST');
        }
        return latest;
    }
    return contest;
};

export const getContestById = async (id) => {
    const contest = await Contest.findById(id).populate('eligibilityCategories', 'name slug').lean();
    if (!contest) throw ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND');
    return contest;
};

export const updateContest = async (id, data) => {
    const contest = await Contest.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND');

    if (data.slug && data.slug !== contest.slug) {
        data.slug = generateSlug(data.slug);
        const conflict = await Contest.findOne({ slug: data.slug, _id: { $ne: id } });
        if (conflict) throw ApiError.conflict('Contest slug already exists');
    }

    if (data.contestCode) data.contestCode = data.contestCode.toUpperCase();

    Object.assign(contest, data);
    await contest.save();
    logger.info(`Contest updated: ${contest.title} (${contest.contestCode})`);
    return contest;
};

export const deleteContest = async (id) => {
    const contest = await Contest.findById(id);
    if (!contest) throw ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND');

    await ContestEntry.deleteMany({ contestId: id });
    await Contest.findByIdAndDelete(id);
    logger.info(`Contest deleted: ${contest.title} (${contest.contestCode})`);
    return { deleted: true, contestId: id };
};

export const submitEntry = async ({ contestId, fullName, email, gender, cityLocation, categoryPreference, ipAddress }) => {
    const contest = await Contest.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND');
    if (contest.publicationStatus !== 'active') {
        throw ApiError.badRequest('This contest is not currently accepting entries', 'CONTEST_NOT_ACTIVE');
    }
    if (contest.winnerAnnounced) {
        throw ApiError.badRequest('This contest has already been drawn', 'CONTEST_DRAWN');
    }

    const existing = await ContestEntry.findOne({ contestId, email: email.toLowerCase().trim() });
    if (existing) {
        throw ApiError.conflict('You have already entered this contest', 'DUPLICATE_ENTRY');
    }

    const entry = await ContestEntry.create({
        contestId,
        contestCode: contest.contestCode,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        gender: gender || 'other',
        cityLocation: cityLocation.trim(),
        categoryPreference: categoryPreference || 'Universal Complications',
        ipAddress
    });

    await Contest.findByIdAndUpdate(contestId, { $inc: { totalEntries: 1 } });

    try {
        await emailService.sendContestEntryEmail({
            to: entry.email,
            fullName: entry.fullName,
            contest,
            entry
        });
    } catch (err) {
        logger.warn(`Contest entry email could not be dispatched: ${err.message}`);
    }

    logger.info(`New contest entry: ${entry.email} -> ${contest.contestCode}`);
    return { entry, contest };
};

export const getEntriesForContest = async (contestId, { search, page = 1, limit = 100 } = {}) => {
    const filter = { contestId };
    if (search && search.trim()) {
        filter.$or = [
            { fullName: new RegExp(search.trim(), 'i') },
            { email: new RegExp(search.trim(), 'i') },
            { cityLocation: new RegExp(search.trim(), 'i') }
        ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 100), 500);
    const skip = (pageNum - 1) * limitNum;

    const [entries, totalCount] = await Promise.all([
        ContestEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        ContestEntry.countDocuments(filter)
    ]);

    return {
        entries,
        pagination: {
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            limit: limitNum
        }
    };
};

export const drawWinner = async (contestId) => {
    const contest = await Contest.findById(contestId);
    if (!contest) throw ApiError.notFound('Contest not found', 'CONTEST_NOT_FOUND');
    if (contest.winnerAnnounced) {
        throw ApiError.badRequest('A winner has already been drawn for this contest', 'ALREADY_DRAWN');
    }

    const entries = await ContestEntry.find({ contestId }).lean();
    if (entries.length === 0) {
        throw ApiError.badRequest('No entries available to draw a winner', 'NO_ENTRIES');
    }

    // Cryptographic random index
    const randomBytes = crypto.randomBytes(4);
    const randomInt = randomBytes.readUInt32BE(0);
    const winnerIndex = randomInt % entries.length;
    const winner = entries[winnerIndex];

    await ContestEntry.findByIdAndUpdate(winner._id, { isWinner: true });

    contest.winner = {
        entryId: winner._id,
        fullName: winner.fullName,
        email: winner.email,
        cityLocation: winner.cityLocation,
        announcedAt: new Date()
    };
    contest.winnerAnnounced = true;
    contest.publicationStatus = 'closed';
    await contest.save();

    try {
        await emailService.sendContestWinnerEmail({
            to: winner.email,
            fullName: winner.fullName,
            contest
        });
    } catch (err) {
        logger.warn(`Winner email could not be dispatched: ${err.message}`);
    }

    logger.info(`Winner drawn for ${contest.contestCode}: ${winner.email}`);

    return {
        winner,
        totalPoolSize: entries.length,
        contest: {
            _id: contest._id,
            title: contest.title,
            contestCode: contest.contestCode,
            prizeName: contest.prizeName
        },
        drawnAt: new Date()
    };
};

export default {
    createContest,
    getAllContestsAdmin,
    getPublicActiveContest,
    getContestById,
    updateContest,
    deleteContest,
    submitEntry,
    getEntriesForContest,
    drawWinner
};