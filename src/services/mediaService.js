import { Readable } from 'stream';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

/**
 * Derives closest luxury aspect ratio tag from numeric width and height
 */
export const deriveAspectRatio = (width, height) => {
  if (!width || !height) return '1:1';
  const ratio = width / height;

  if (Math.abs(ratio - 1.0) < 0.1) return '1:1';
  if (Math.abs(ratio - 0.75) < 0.1) return '3:4';
  if (Math.abs(ratio - 0.8) < 0.1) return '4:5';
  if (Math.abs(ratio - (16 / 9)) < 0.15) return '16:9';
  if (Math.abs(ratio - (9 / 16)) < 0.15) return '9:16';

  return ratio > 1 ? '16:9' : '3:4';
};

/**
 * Builds responsive Cloudinary URLs and derivative thumbnails
 */
export const generateTransformations = (publicId, assetType = 'image', format = 'webp') => {
  const isVideo = assetType === 'video';

  const thumbnailUrl = cloudinary.url(publicId, {
    resource_type: isVideo ? 'video' : 'image',
    format: isVideo ? 'jpg' : 'webp',
    transformation: [
      {
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  });

  const pdpZoomUrl = cloudinary.url(publicId, {
    resource_type: isVideo ? 'video' : 'image',
    transformation: [
      {
        width: 1600,
        crop: 'limit',
        quality: 'auto:best',
        fetch_format: 'auto'
      }
    ]
  });

  const plpCardUrl = cloudinary.url(publicId, {
    resource_type: isVideo ? 'video' : 'image',
    transformation: [
      {
        width: 600,
        height: 800,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  });

  const showcase16x9Url = cloudinary.url(publicId, {
    resource_type: isVideo ? 'video' : 'image',
    transformation: [
      {
        width: 1920,
        height: 1080,
        crop: 'pad',
        background: 'auto',
        quality: 'auto'
      }
    ]
  });

  const reel9x16Url = cloudinary.url(publicId, {
    resource_type: isVideo ? 'video' : 'image',
    transformation: [
      {
        width: 720,
        height: 1280,
        crop: 'pad',
        background: 'auto',
        quality: 'auto'
      }
    ]
  });

  const posterThumbnailUrl = isVideo
    ? cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        {
          start_offset: '0',
          width: 720,
          height: 1280,
          crop: 'fill',
          gravity: 'auto',
          quality: 'auto'
        }
      ]
    })
    : thumbnailUrl;

  return {
    thumbnailUrl,
    pdpZoomUrl,
    plpCardUrl,
    showcase16x9Url,
    reel9x16Url,
    posterThumbnailUrl
  };
};

/**
 * Generates a video poster (first-frame JPG) URL from a Cloudinary video public_id.
 */
export const generateVideoThumbnail = (publicId, options = {}) => {
  if (!publicId) return '';
  const { width = 720, height = 1280 } = options;
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      {
        start_offset: '0',
        width,
        height,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto'
      }
    ]
  });
};

/**
 * Generates a poster thumbnail URL directly from a full Cloudinary video URL.
 * Handles:
 *   - Plain video URLs:          /video/upload/v123/folder/file.mp4
 *   - With transformations:      /video/upload/q_auto,w_720/v123/folder/file.mp4
 *   - Authenticated/private:     /video/upload/s--abc--/v123/folder/file.mp4
 *   - HLS streams (.m3u8)        /video/upload/v123/folder/file.m3u8
 * Returns '' for non-Cloudinary videos (cannot derive poster).
 */
export const generatePosterFromVideoUrl = (videoUrl, { width = 720, height = 1280 } = {}) => {
  if (!videoUrl || typeof videoUrl !== 'string') return '';
  const trimmed = videoUrl.trim();
  if (!trimmed) return '';

  // Already an image URL — return as-is
  if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(trimmed)) return trimmed;

  // Cloudinary video URL — inject a poster transformation
  // Matches:  .../video/upload/(anything before /v123 or filename)/file.mp4|webm|mov|mkv|avi|m3u8
  // We capture the base (`.../video/upload/`) and the path (including version + folders + filename)
  const match = trimmed.match(
    /^(https?:\/\/[^/]+\/video\/upload\/)(?:(?:[^/]+\/)?)([^/]+?\.(?:mp4|webm|mov|mkv|avi|m3u8))(\?.*)?$/i
  );

  if (match) {
    const [, base, filename] = match;
    // Build: base + transformations + filename-without-ext + .jpg
    // Strip any existing transformation segment — we rebuild from scratch
    const filenameWithoutExt = filename.replace(/\.[^.]+$/, '');
    return `${base}so_0,w_${width},h_${height},c_fill,g_auto,q_auto/${filenameWithoutExt}.jpg`;
  }

  return '';
};

/**
 * Uploads a buffer directly to Cloudinary using an async stream pipeline
 */
export const uploadBufferToCloudinary = async (buffer, {
  folder = 'kairo/general',
  resourceType = 'auto',
  publicId = undefined,
  tags = ['kairo', 'horology']
} = {}) => {
  if (!isCloudinaryConfigured()) {
    throw ApiError.internal(
      'Cloudinary media provider is not configured. Please supply valid CLOUDINARY_* environment credentials.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      timeout: 60000,
      tags
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error(`Cloudinary stream upload failed: ${error.message}`, { error });
        return reject(
          ApiError.internal(`Media upload failed: ${error.message}`, 'CLOUDINARY_UPLOAD_FAILED')
        );
      }
      resolve(result);
    });

    const readable = new Readable();
    readable._read = () => { };
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Uploads a video buffer and auto-generates a poster thumbnail from Cloudinary.
 */
export const uploadVideoWithThumbnail = async (buffer, {
  folder = 'kairo/videos/streams',
  width = 720,
  height = 1280
} = {}) => {
  if (!isCloudinaryConfigured()) {
    throw ApiError.internal(
      'Cloudinary media provider is not configured. Please supply valid CLOUDINARY_* environment credentials.',
      'CLOUDINARY_NOT_CONFIGURED'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'video',
      timeout: 120000,
      tags: ['kairo', 'video']
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error(`Cloudinary video upload failed: ${error.message}`, { error });
        return reject(
          ApiError.internal(`Video upload failed: ${error.message}`, 'CLOUDINARY_VIDEO_UPLOAD_FAILED')
        );
      }

      const posterUrl = generateVideoThumbnail(result.public_id, { width, height });

      resolve({
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        durationSeconds: result.duration || 0,
        dimensions: { width: result.width || 0, height: result.height || 0 },
        posterThumbnailUrl: posterUrl,
        bytes: result.bytes
      });
    });

    const readable = new Readable();
    readable._read = () => { };
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Deletes a single asset from Cloudinary
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  if (!isCloudinaryConfigured()) {
    logger.warn(`Skipping Cloudinary deletion for ${publicId} because Cloudinary is unconfigured.`);
    return null;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`Deleted asset from Cloudinary: ${publicId} (result: ${result.result})`);
    return result;
  } catch (err) {
    logger.error(`Failed to delete asset from Cloudinary: ${publicId}`, { error: err.message });
    throw ApiError.internal(`Failed to purge media asset from Cloudinary: ${err.message}`, 'CLOUDINARY_DELETE_FAILED');
  }
};

/**
 * Cleans up a batch of uploaded assets (used for transaction rollbacks to prevent orphans)
 */
export const cleanupUploadedAssets = async (assets = []) => {
  if (!Array.isArray(assets) || assets.length === 0) return;

  const deletePromises = assets.map(async (asset) => {
    try {
      const publicId = typeof asset === 'string' ? asset : asset.publicId;
      const resourceType = typeof asset === 'object' && asset.assetType === 'video' ? 'video' : 'image';
      if (publicId) {
        await deleteFromCloudinary(publicId, resourceType);
      }
    } catch (e) {
      logger.warn(`Orphan asset rollback warning for ${asset}: ${e.message}`);
    }
  });

  await Promise.allSettled(deletePromises);
};

/**
 * Processes a single file upload with metadata extraction and responsive transformation calculation
 */
export const processUpload = async (file, {
  folder = 'kairo/products',
  altText = '',
  caption = '',
  displayOrder = 0,
  deviceTarget = 'all'
} = {}) => {
  const isVideo = file.mimetype.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';

  const uploadResult = await uploadBufferToCloudinary(file.buffer, {
    folder,
    resourceType
  });

  const width = uploadResult.width || 0;
  const height = uploadResult.height || 0;
  const duration = uploadResult.duration || 0;
  const derivedRatio = deriveAspectRatio(width, height);

  let videoOrientation = 'none';
  if (isVideo) {
    if (width > height) videoOrientation = 'horizontal';
    else if (height > width) videoOrientation = 'vertical';
  }

  const transformations = generateTransformations(uploadResult.public_id, resourceType, uploadResult.format);

  return {
    secureUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    assetType: resourceType,
    format: uploadResult.format,
    altText: altText || file.originalname,
    caption: caption || '',
    displayOrder: Number(displayOrder) || 0,
    dimensions: { width, height },
    durationSeconds: duration,
    posterThumbnailUrl: transformations.posterThumbnailUrl,
    deviceTarget,
    aspectRatio: derivedRatio,
    videoOrientation,
    transformations,
    bytes: uploadResult.bytes
  };
};

export default {
  uploadBufferToCloudinary,
  uploadVideoWithThumbnail,
  deleteFromCloudinary,
  cleanupUploadedAssets,
  processUpload,
  generateTransformations,
  generateVideoThumbnail,
  generatePosterFromVideoUrl,
  deriveAspectRatio
};