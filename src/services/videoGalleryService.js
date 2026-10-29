import { VideoGalleryItem } from '../models/VideoGalleryItem.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generatePosterFromVideoUrl,
  generateVideoThumbnail
} from './mediaService.js';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const isVideoFile = (url = '') => /\.(mp4|webm|mov|mkv|avi|m3u8)(\?|$)/i.test(url);

/**
 * Ensure the thumbnailUrl is a real image URL, never a video URL or null.
 *
 * Strategy (in order):
 *   1. If a valid image URL is supplied, keep it.
 *   2. Try to derive a poster from the video URL via Cloudinary transformation.
 *   3. If a cloudinaryPublicId exists, build a poster from it directly.
 *   4. Otherwise return '' (never null/undefined).
 */
const ensurePosterUrl = (thumbnailUrl, videoUrl, cloudinaryPublicId) => {
  const trimmed = (thumbnailUrl || '').trim();
  if (trimmed && !isVideoFile(trimmed)) return trimmed;

  // Try from the video URL
  const fromUrl = generatePosterFromVideoUrl(videoUrl);
  if (fromUrl) return fromUrl;

  // Fallback: build from cloudinary public id
  if (cloudinaryPublicId) {
    const fromId = generateVideoThumbnail(cloudinaryPublicId);
    if (fromId) return fromId;
  }

  // Last resort: keep whatever was there (even '') — never null
  return trimmed || '';
};

export const getPublishedVideos = async ({
  videoType,
  placement,
  aspectRatio,
  linkedProduct,
  linkedCollection,
  page = 1,
  limit = 20
} = {}) => {
  const query = {
    publicationStatus: 'published',
    isActive: true
  };

  if (videoType) query.videoType = videoType;
  if (placement) query.placement = placement;
  if (aspectRatio) query.aspectRatio = aspectRatio;
  if (linkedProduct) query.linkedProduct = linkedProduct;
  if (linkedCollection) query.linkedCollection = linkedCollection;

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, totalCount] = await Promise.all([
    VideoGalleryItem.find(query)
      .populate('linkedProduct', 'name slug masterSku media variants shortDescription')
      .populate('linkedCollection', 'name slug bannerImageUrl')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VideoGalleryItem.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

export const getVideoBySlug = async (slug) => {
  const video = await VideoGalleryItem.findOneAndUpdate(
    { slug: slug.toLowerCase(), publicationStatus: 'published', isActive: true },
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('linkedProduct', 'name slug masterSku media variants shortDescription')
    .populate('linkedCollection', 'name slug bannerImageUrl');

  if (!video) {
    throw ApiError.notFound('Video asset not found or has not been published', 'VIDEO_NOT_FOUND');
  }

  return video;
};

export const createVideo = async (payload) => {
  let { slug } = payload;
  if (!slug) {
    slug = generateSlug(payload.title);
    const existing = await VideoGalleryItem.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  // Auto-generate poster from video URL / public id if not supplied
  const finalThumbnail = ensurePosterUrl(
    payload.thumbnailUrl,
    payload.videoUrl,
    payload.cloudinaryPublicId
  );

  const video = new VideoGalleryItem({
    ...payload,
    slug,
    thumbnailUrl: finalThumbnail // always a string, possibly ''
  });

  await video.save();
  return video;
};

export const updateVideo = async (id, payload) => {
  const video = await VideoGalleryItem.findById(id);
  if (!video) {
    throw ApiError.notFound('Video asset not found', 'VIDEO_NOT_FOUND');
  }

  // Determine the effective video URL / public id after this update
  const effectiveVideoUrl = payload.videoUrl ?? video.videoUrl;
  const effectivePublicId = payload.cloudinaryPublicId ?? video.cloudinaryPublicId;

  // Poster regeneration rule:
  //   - If the caller explicitly supplied a new thumbnail, respect it (unless it's a video file).
  //   - If the video URL changed, or the current poster is empty/video, regenerate.
  const suppliedThumb = payload.thumbnailUrl;
  const currentThumb = video.thumbnailUrl || '';
  const videoUrlChanged = payload.videoUrl && payload.videoUrl !== video.videoUrl;
  const shouldRegenerate =
    suppliedThumb === undefined
      ? (videoUrlChanged || !currentThumb || isVideoFile(currentThumb))
      : false;

  if (suppliedThumb !== undefined) {
    payload.thumbnailUrl = ensurePosterUrl(
      suppliedThumb,
      effectiveVideoUrl,
      effectivePublicId
    );
  } else if (shouldRegenerate) {
    payload.thumbnailUrl = ensurePosterUrl(
      currentThumb,
      effectiveVideoUrl,
      effectivePublicId
    );
  }

  Object.assign(video, payload);
  await video.save();
  return video;
};

export const deleteVideo = async (id) => {
  const video = await VideoGalleryItem.findByIdAndDelete(id);
  if (!video) {
    throw ApiError.notFound('Video asset not found', 'VIDEO_NOT_FOUND');
  }
  return { id, deleted: true };
};

export const getAllVideosAdmin = async ({
  videoType,
  publicationStatus,
  page = 1,
  limit = 50
} = {}) => {
  const query = {};
  if (videoType) query.videoType = videoType;
  if (publicationStatus) query.publicationStatus = publicationStatus;

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, totalCount] = await Promise.all([
    VideoGalleryItem.find(query)
      .populate('linkedProduct', 'name slug masterSku')
      .populate('linkedCollection', 'name slug')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VideoGalleryItem.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

export default {
  getPublishedVideos,
  getVideoBySlug,
  createVideo,
  updateVideo,
  deleteVideo,
  getAllVideosAdmin
};