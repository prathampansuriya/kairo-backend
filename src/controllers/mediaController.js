import { ProductMedia } from '../models/ProductMedia.js';
import { Product } from '../models/Product.js';
import { VideoGalleryItem } from '../models/VideoGalleryItem.js';
import mediaService from '../services/mediaService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { recordAuditLog } from '../utils/auditHelper.js';

export const uploadMedia = async (req, res, next) => {
  try {
    const files = [];
    if (req.file) {
      files.push(req.file);
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else if (typeof req.files === 'object') {
        for (const field of Object.values(req.files)) {
          if (Array.isArray(field)) files.push(...field);
        }
      }
    }

    if (files.length === 0) {
      throw ApiError.badRequest('At least one media file must be provided for upload', [], 'NO_FILE_UPLOADED');
    }

    const {
      folder = 'kairo/products',
      altText = '',
      caption = '',
      deviceTarget = 'all',
      displayOrder = 0
    } = req.body;

    const processedAssets = [];

    try {
      // 1. Process and upload all files to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const processed = await mediaService.processUpload(file, {
          folder,
          altText: altText || file.originalname,
          caption,
          deviceTarget,
          displayOrder: Number(displayOrder) + i
        });
        processedAssets.push(processed);
      }

      // 2. Persist media documents in MongoDB
      const mediaDocs = processedAssets.map((asset) => ({
        assetType: asset.assetType,
        secureUrl: asset.secureUrl,
        publicId: asset.publicId,
        altText: asset.altText,
        caption: asset.caption,
        displayOrder: asset.displayOrder,
        dimensions: asset.dimensions,
        durationSeconds: asset.durationSeconds,
        posterThumbnailUrl: asset.posterThumbnailUrl,
        deviceTarget: asset.deviceTarget,
        aspectRatio: asset.aspectRatio,
        videoOrientation: asset.videoOrientation
      }));

      const savedDocs = await ProductMedia.insertMany(mediaDocs);

      logger.info(`Successfully uploaded and persisted ${savedDocs.length} media assets into ${folder}`);

      return res.status(201).json({
        success: true,
        message: `Successfully uploaded ${savedDocs.length} media asset(s)`,
        data: {
          assets: savedDocs,
          count: savedDocs.length
        }
      });
    } catch (uploadOrDbError) {
      // 3. ORPHAN ASSET PREVENTION: Roll back any assets uploaded to Cloudinary if DB persistence failed
      if (processedAssets.length > 0) {
        logger.warn(`Persistence failed; cleaning up ${processedAssets.length} orphan Cloudinary assets`);
        await mediaService.cleanupUploadedAssets(processedAssets);
      }
      throw uploadOrDbError;
    }
  } catch (error) {
    next(error);
  }
};

export const replaceMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw ApiError.badRequest('A replacement media file must be provided', [], 'NO_FILE_UPLOADED');
    }

    const existingMedia = await ProductMedia.findById(id);
    if (!existingMedia) {
      throw ApiError.notFound('Target media asset record not found', 'NOT_FOUND');
    }

    const oldPublicId = existingMedia.publicId;
    const oldAssetType = existingMedia.assetType;

    const {
      folder = 'kairo/products',
      altText,
      caption,
      deviceTarget
    } = req.body;

    let newProcessedAsset = null;

    try {
      // 1. Upload new asset to Cloudinary
      newProcessedAsset = await mediaService.processUpload(file, {
        folder,
        altText: altText !== undefined ? altText : existingMedia.altText,
        caption: caption !== undefined ? caption : existingMedia.caption,
        deviceTarget: deviceTarget || existingMedia.deviceTarget,
        displayOrder: existingMedia.displayOrder
      });

      // 2. Update existing MongoDB document
      existingMedia.secureUrl = newProcessedAsset.secureUrl;
      existingMedia.publicId = newProcessedAsset.publicId;
      existingMedia.assetType = newProcessedAsset.assetType;
      existingMedia.dimensions = newProcessedAsset.dimensions;
      existingMedia.durationSeconds = newProcessedAsset.durationSeconds;
      existingMedia.posterThumbnailUrl = newProcessedAsset.posterThumbnailUrl;
      existingMedia.aspectRatio = newProcessedAsset.aspectRatio;
      existingMedia.videoOrientation = newProcessedAsset.videoOrientation;
      if (altText !== undefined) existingMedia.altText = altText;
      if (caption !== undefined) existingMedia.caption = caption;
      if (deviceTarget) existingMedia.deviceTarget = deviceTarget;

      await existingMedia.save();

      // 3. REPLACEMENT CLEANUP: Delete old asset from Cloudinary ONLY after DB update succeeds
      await mediaService.deleteFromCloudinary(oldPublicId, oldAssetType);

      logger.info(`Replaced media asset ${id}: Old publicId (${oldPublicId}) purged, new publicId (${newProcessedAsset.publicId}) active`);

      return res.status(200).json({
        success: true,
        message: 'Media asset replaced successfully',
        data: {
          asset: existingMedia
        }
      });
    } catch (replaceError) {
      // If DB update failed, clean up the NEW asset from Cloudinary to prevent orphans, keeping old asset safe
      if (newProcessedAsset) {
        logger.warn(`Replacement update failed; purging newly uploaded asset ${newProcessedAsset.publicId}`);
        await mediaService.cleanupUploadedAssets([newProcessedAsset]);
      }
      throw replaceError;
    }
  } catch (error) {
    next(error);
  }
};

export const reorderMedia = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;

    const bulkOperations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index } }
      }
    }));

    await ProductMedia.bulkWrite(bulkOperations);

    const updated = await ProductMedia.find({ _id: { $in: orderedIds } }).sort({ displayOrder: 1 });

    return res.status(200).json({
      success: true,
      message: 'Media ordering updated successfully',
      data: {
        assets: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mediaDoc = await ProductMedia.findById(id);
    if (!mediaDoc) {
      throw ApiError.notFound('Media asset not found or already deleted', 'NOT_FOUND');
    }

    // Purge from Cloudinary using verified server record (not trusting unverified client input)
    await mediaService.deleteFromCloudinary(mediaDoc.publicId, mediaDoc.assetType);

    // Delete record from MongoDB
    await ProductMedia.findByIdAndDelete(id);

    await recordAuditLog({
      action: 'MEDIA_DELETED',
      entity: 'Media',
      entityId: id,
      beforeState: { publicId: mediaDoc.publicId, assetType: mediaDoc.assetType },
      req
    });

    logger.info(`Media asset deleted: ID ${id}, publicId ${mediaDoc.publicId}`);

    return res.status(200).json({
      success: true,
      message: 'Media asset purged successfully from Cloudinary and database',
      data: {
        id,
        publicId: mediaDoc.publicId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const batchDeleteMedia = async (req, res, next) => {
  try {
    const { ids } = req.body;

    const mediaDocs = await ProductMedia.find({ _id: { $in: ids } });
    if (mediaDocs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No matching media assets found to delete',
        data: { deletedCount: 0 }
      });
    }

    // Purge each from Cloudinary
    for (const doc of mediaDocs) {
      try {
        await mediaService.deleteFromCloudinary(doc.publicId, doc.assetType);
      } catch (err) {
        logger.warn(`Failed Cloudinary purge for ${doc.publicId}: ${err.message}`);
      }
    }

    // Delete documents from MongoDB
    const result = await ProductMedia.deleteMany({ _id: { $in: ids } });

    logger.info(`Batch deleted ${result.deletedCount} media assets`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} media assets`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listMedia = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      assetType,
      aspectRatio,
      search
    } = req.query;

    const filter = {};
    if (assetType) filter.assetType = assetType;
    if (aspectRatio) filter.aspectRatio = aspectRatio;
    if (search) {
      filter.$or = [
        { altText: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } },
        { publicId: { $regex: search, $options: 'i' } }
      ];
    }

    // Self-healing fallback: if ProductMedia is empty, sync from existing catalog products & videos
    const totalExisting = await ProductMedia.countDocuments();
    if (totalExisting === 0) {
      try {
        const products = await Product.find({ 'media.0': { $exists: true } }).lean();
        const mediaDocs = [];
        for (const p of products) {
          if (Array.isArray(p.media)) {
            for (const m of p.media) {
              if (m.secureUrl && m.publicId) {
                mediaDocs.push({
                  assetType: m.assetType || 'image',
                  secureUrl: m.secureUrl,
                  publicId: m.publicId,
                  altText: m.altText || p.name,
                  caption: m.caption || p.name,
                  displayOrder: m.displayOrder || 0,
                  deviceTarget: m.deviceTarget || 'all',
                  aspectRatio: m.aspectRatio || '1:1'
                });
              }
            }
          }
        }
        if (mediaDocs.length > 0) {
          await ProductMedia.insertMany(mediaDocs);
          logger.info(`Self-healed ${mediaDocs.length} media assets into ProductMedia collection`);
        }
      } catch (err) {
        logger.warn(`Failed media auto-sync: ${err.message}`);
      }
    }

    const [assets, total] = await Promise.all([
      ProductMedia.find(filter)
        .sort({ displayOrder: 1, _id: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ProductMedia.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Media assets retrieved successfully',
      data: {
        assets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadMedia,
  replaceMedia,
  reorderMedia,
  deleteMedia,
  batchDeleteMedia,
  listMedia
};
