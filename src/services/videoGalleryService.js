import { VideoGalleryItem } from '../models/VideoGalleryItem.js';
import { ApiError } from '../utils/ApiError.js';

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    // If slug already exists, append unique suffix
    const existing = await VideoGalleryItem.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const video = new VideoGalleryItem({
    ...payload,
    slug
  });

  await video.save();
  return video;
};

export const updateVideo = async (id, payload) => {
  const video = await VideoGalleryItem.findById(id);
  if (!video) {
    throw ApiError.notFound('Video asset not found', 'VIDEO_NOT_FOUND');
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
