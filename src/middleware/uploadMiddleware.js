import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.mp4',
  '.webm'
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
const MAX_FILES_COUNT = 10;

/**
 * Validates file buffer magic bytes (file signature) against expected formats
 */
export const validateFileSignature = (buffer, mimetype) => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // JPEG signature: FF D8 FF
  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }

  // PNG signature: 89 50 4E 47
  if (mimetype === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    );
  }

  // WebP signature: RIFF (bytes 0-3) and WEBP (bytes 8-11)
  if (mimetype === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  }

  // MP4 signature: ftyp box at offset 4
  if (mimetype === 'video/mp4') {
    if (buffer.length < 12) return false;
    const ftyp = buffer.toString('ascii', 4, 8);
    return ftyp === 'ftyp';
  }

  // WebM signature: 1A 45 DF A3 (EBML header)
  if (mimetype === 'video/webm') {
    return (
      buffer[0] === 0x1A &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xDF &&
      buffer[3] === 0xA3
    );
  }

  return false;
};

// Multer memory storage configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      ApiError.badRequest(
        `File extension '${ext}' is not permitted. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
        [],
        'INVALID_FILE_EXTENSION'
      ),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `MIME type '${file.mimetype}' is not permitted. Allowed MIME types: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`,
        [],
        'INVALID_MIME_TYPE'
      ),
      false
    );
  }

  cb(null, true);
};

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES, // Global ceiling; images checked specifically post-upload
    files: MAX_FILES_COUNT
  },
  fileFilter
});

/**
 * Express middleware wrapper to validate file size limits by type and inspect buffer signatures
 */
export const validateUploadedFiles = (req, res, next) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (typeof req.files === 'object') {
      for (const field of Object.values(req.files)) {
        if (Array.isArray(field)) {
          files.push(...field);
        }
      }
    }
  }

  if (files.length === 0 && req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    return next(ApiError.badRequest('No media file was uploaded in request payload', [], 'NO_FILE_UPLOADED'));
  }

  for (const file of files) {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    // Check size limit per asset type
    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      return next(
        ApiError.badRequest(
          `Image '${file.originalname}' (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of 5 MB`,
          [],
          'IMAGE_SIZE_LIMIT_EXCEEDED'
        )
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      return next(
        ApiError.badRequest(
          `Video '${file.originalname}' (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of 30 MB`,
          [],
          'VIDEO_SIZE_LIMIT_EXCEEDED'
        )
      );
    }

    // Inspect binary file signature
    const isValidSignature = validateFileSignature(file.buffer, file.mimetype);
    if (!isValidSignature) {
      return next(
        ApiError.badRequest(
          `File '${file.originalname}' failed cryptographic signature verification. Content does not match MIME type '${file.mimetype}'.`,
          [],
          'INVALID_FILE_SIGNATURE'
        )
      );
    }
  }

  next();
};

/**
 * Wrapped multer error handler translating Multer errors to ApiError
 */
export const handleMulterErrors = (uploadMiddlewareFn) => {
  return (req, res, next) => {
    uploadMiddlewareFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest('Uploaded file exceeds maximum permissible payload size', [], 'FILE_TOO_LARGE')
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            ApiError.badRequest(`Too many files. Maximum allowed per request is ${MAX_FILES_COUNT}`, [], 'TOO_MANY_FILES')
          );
        }
        return next(ApiError.badRequest(`Upload error: ${err.message}`, [], 'UPLOAD_ERROR'));
      }
      if (err) {
        return next(err);
      }
      validateUploadedFiles(req, res, next);
    });
  };
};

export const uploadSingle = (fieldName = 'file') => handleMulterErrors(multerUpload.single(fieldName));
export const uploadMultiple = (fieldName = 'files', maxCount = MAX_FILES_COUNT) => handleMulterErrors(multerUpload.array(fieldName, maxCount));
export const uploadFields = (fields) => handleMulterErrors(multerUpload.fields(fields));

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  validateFileSignature,
  validateUploadedFiles
};
