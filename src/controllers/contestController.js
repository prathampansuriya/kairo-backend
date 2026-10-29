import { ApiResponse } from '../utils/ApiResponse.js';
import * as contestService from '../services/contestService.js';

export const getPublicActiveContestHandler = async (req, res, next) => {
    try {
        const contest = await contestService.getPublicActiveContest();
        return res.status(200).json(ApiResponse.success(contest, 'Active contest retrieved'));
    } catch (error) {
        next(error);
    }
};

export const submitContestEntryHandler = async (req, res, next) => {
    try {
        const { contestId, fullName, email, gender, cityLocation, categoryPreference } = req.body;
        if (!contestId || !fullName || !email || !cityLocation) {
            return res.status(400).json(ApiResponse.badRequest('Missing required contest entry fields'));
        }
        const result = await contestService.submitEntry({
            contestId,
            fullName,
            email,
            gender,
            cityLocation,
            categoryPreference,
            ipAddress: req.ip || req.socket?.remoteAddress
        });
        return res.status(201).json(ApiResponse.created(result.entry, 'Entry registered successfully'));
    } catch (error) {
        next(error);
    }
};

export const getAllContestsAdminHandler = async (req, res, next) => {
    try {
        const { search, status, page, limit } = req.query;
        const result = await contestService.getAllContestsAdmin({ search, status, page, limit });
        return res.status(200).json(ApiResponse.success(result, 'Contests retrieved'));
    } catch (error) {
        next(error);
    }
};

export const getContestByIdHandler = async (req, res, next) => {
    try {
        const contest = await contestService.getContestById(req.params.id);
        return res.status(200).json(ApiResponse.success(contest, 'Contest retrieved'));
    } catch (error) {
        next(error);
    }
};

export const createContestHandler = async (req, res, next) => {
    try {
        const contest = await contestService.createContest(req.body);
        return res.status(201).json(ApiResponse.created(contest, 'Contest created'));
    } catch (error) {
        next(error);
    }
};

export const updateContestHandler = async (req, res, next) => {
    try {
        const contest = await contestService.updateContest(req.params.id, req.body);
        return res.status(200).json(ApiResponse.success(contest, 'Contest updated'));
    } catch (error) {
        next(error);
    }
};

export const deleteContestHandler = async (req, res, next) => {
    try {
        const result = await contestService.deleteContest(req.params.id);
        return res.status(200).json(ApiResponse.success(result, 'Contest deleted'));
    } catch (error) {
        next(error);
    }
};

export const getContestEntriesHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { search, page, limit } = req.query;
        const result = await contestService.getEntriesForContest(id, { search, page, limit });
        return res.status(200).json(ApiResponse.success(result, 'Entries retrieved'));
    } catch (error) {
        next(error);
    }
};

export const drawWinnerHandler = async (req, res, next) => {
    try {
        const result = await contestService.drawWinner(req.params.id);
        return res.status(200).json(ApiResponse.success(result, 'Winner drawn'));
    } catch (error) {
        next(error);
    }
};