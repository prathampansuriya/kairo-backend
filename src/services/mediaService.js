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

  // 16:9 landscape showcase (pad/fill preserving watch geometry)
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

  // 9:16 vertical reel showcase (pad/fill preserving watch center)
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
    readable._read = () => {};
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

  // Stream directly to Cloudinary
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
  deleteFromCloudinary,
  cleanupUploadedAssets,
  processUpload,
  generateTransformations,
  deriveAspectRatio
};
