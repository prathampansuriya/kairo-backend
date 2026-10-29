import { globalSearch, autocompleteSearch } from '../services/searchService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const globalSearchHandler = async (req, res, next) => {
    try {
        const data = await globalSearch(req.query);
        return res.status(200).json(ApiResponse.success(data, 'Search results retrieved successfully'));
    } catch (err) {
        next(err);
    }
};

export const autocompleteHandler = async (req, res, next) => {
    try {
        const q = req.query.q || '';
        const data = await autocompleteSearch(q);
        return res.status(200).json(ApiResponse.success(data, 'Autocomplete suggestions retrieved'));
    } catch (err) {
        next(err);
    }
};