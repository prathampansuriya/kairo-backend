import { ApiResponse } from '../utils/ApiResponse.js';
import * as videoGalleryService from '../services/videoGalleryService.js';

export const getPublishedVideosHandler = async (req, res, next) => {
  try {
    const result = await videoGalleryService.getPublishedVideos(req.query);
    return res.status(200).json(ApiResponse.success(result, 'Published videos retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getVideoBySlugHandler = async (req, res, next) => {
  try {
    const video = await videoGalleryService.getVideoBySlug(req.params.slug);
    return res.status(200).json(ApiResponse.success(video, 'Video details retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const createVideoHandler = async (req, res, next) => {
  try {
    const video = await videoGalleryService.createVideo(req.body);
    return res.status(201).json(ApiResponse.created(video, 'Video asset created successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateVideoHandler = async (req, res, next) => {
  try {
    const video = await videoGalleryService.updateVideo(req.params.id, req.body);
    return res.status(200).json(ApiResponse.success(video, 'Video asset updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteVideoHandler = async (req, res, next) => {
  try {
    const result = await videoGalleryService.deleteVideo(req.params.id);
    return res.status(200).json(ApiResponse.success(result, 'Video asset deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAllVideosAdminHandler = async (req, res, next) => {
  try {
    const result = await videoGalleryService.getAllVideosAdmin(req.query);
    return res.status(200).json(ApiResponse.success(result, 'All video assets retrieved'));
  } catch (error) {
    next(error);
  }
};

export default {
  getPublishedVideosHandler,
  getVideoBySlugHandler,
  createVideoHandler,
  updateVideoHandler,
  deleteVideoHandler,
  getAllVideosAdminHandler
};
