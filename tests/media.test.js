import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { ProductMedia } from '../src/models/ProductMedia.js';
import mediaService from '../src/services/mediaService.js';
import { cloudinary } from '../src/config/cloudinary.js';

// Minimal valid JPEG header (FF D8 FF E0 00 10 4A 46 49 46 00 01)
const VALID_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
  0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0xFF, 0xD9
]);

// Minimal valid PNG header (89 50 4E 47 0D 0A 1A 0A)
const VALID_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89
]);

describe('PROMPT-6 Cloudinary Media Service & Secure Upload Pipeline', { timeout: 35000 }, () => {
  let app;
  let adminUser;
  let adminToken;
  let customerUser;
  let customerToken;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // Clean up test users
    await User.deleteMany({ email: { $in: ['media-admin@kairo.com', 'media-cust@kairo.com'] } });

    // Seed test admin
    adminUser = new User({
      firstName: 'Atelier',
      lastName: 'Director',
      email: 'media-admin@kairo.com',
      password: 'StrongAdminPass2026!',
      role: 'admin',
      isEmailVerified: true,
      status: 'active'
    });
    await adminUser.save();

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Seed customer
    customerUser = new User({
      firstName: 'Public',
      lastName: 'Collector',
      email: 'media-cust@kairo.com',
      password: 'CustomerPass2026!',
      role: 'customer',
      isEmailVerified: true,
      status: 'active'
    });
    await customerUser.save();

    customerToken = jwt.sign(
      { id: customerUser._id.toString(), email: customerUser.email, role: customerUser.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['media-admin@kairo.com', 'media-cust@kairo.com'] } });
    await ProductMedia.deleteMany({ altText: /Test Media/ });
    await disconnectDB();
  }, 30000);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Access Control & Authorization Guarantees', () => {
    it('Should reject unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .attach('files', VALID_JPEG_BUFFER, 'watch.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Should reject customer role requests with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('files', VALID_JPEG_BUFFER, 'watch.jpg');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Multer Format & Security Validation', () => {
    it('Should reject files with disallowed extensions (.exe, .php, .sh)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', Buffer.from('malicious executable code'), 'payload.exe');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE_EXTENSION');
    });

    it('Should detect spoofed MIME and invalid binary signatures', async () => {
      // Plain text content disguised with .jpg extension and image/jpeg Content-Type
      const spoofedBuffer = Buffer.from('<?php echo "fake jpeg header injection attack"; ?>');

      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', spoofedBuffer, {
          filename: 'hacked_watch.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE_SIGNATURE');
    });

    it('Should reject oversized image uploads (> 5 MB)', async () => {
      // 5.5 MB fake buffer with JPEG signature at start
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
      oversizedBuffer[0] = 0xFF;
      oversizedBuffer[1] = 0xD8;
      oversizedBuffer[2] = 0xFF;

      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', oversizedBuffer, 'huge_watch.jpg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('IMAGE_SIZE_LIMIT_EXCEEDED');
    });
  });

  describe('3. Upload Pipeline, Responsive Presets & Aspect Ratios', () => {
    it('Should upload valid image, derive aspect ratio, and persist media record', async () => {
      // Mock processUpload to avoid network dependency in unit test run
      const mockProcessed = {
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1234/kairo/products/test-watch.webp',
        publicId: 'kairo/products/test-watch',
        assetType: 'image',
        format: 'webp',
        altText: 'Test Media Chronograph',
        caption: 'Geneva Seal Caliber',
        displayOrder: 1,
        dimensions: { width: 1200, height: 1200 },
        durationSeconds: 0,
        posterThumbnailUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/w_300,h_300,c_fill/kairo/products/test-watch.webp',
        deviceTarget: 'all',
        aspectRatio: '1:1',
        videoOrientation: 'none'
      };

      vi.spyOn(mediaService, 'processUpload').mockResolvedValue(mockProcessed);

      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('folder', 'kairo/products')
        .field('altText', 'Test Media Chronograph')
        .field('caption', 'Geneva Seal Caliber')
        .attach('files', VALID_JPEG_BUFFER, 'watch.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);

      const asset = res.body.data.assets[0];
      expect(asset.publicId).toBe('kairo/products/test-watch');
      expect(asset.aspectRatio).toBe('1:1');
      expect(asset.secureUrl).toContain('cloudinary.com');

      // Verify record in MongoDB
      const saved = await ProductMedia.findById(asset._id);
      expect(saved).not.toBeNull();
      expect(saved.altText).toBe('Test Media Chronograph');
    });

    it('Should accept hierarchical subfolders under kairo (e.g. kairo/categories/thumbnails)', async () => {
      const mockCategoryThumbnail = {
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1234/kairo/categories/thumbnails/diver-cat.webp',
        publicId: 'kairo/categories/thumbnails/diver-cat',
        assetType: 'image',
        format: 'webp',
        altText: 'Category Thumbnail',
        caption: '',
        displayOrder: 0,
        dimensions: { width: 800, height: 800 },
        durationSeconds: 0,
        posterThumbnailUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/w_300,h_300,c_fill/kairo/categories/thumbnails/diver-cat.webp',
        deviceTarget: 'all',
        aspectRatio: '1:1',
        videoOrientation: 'none'
      };

      vi.spyOn(mediaService, 'processUpload').mockResolvedValue(mockCategoryThumbnail);

      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('folder', 'kairo/categories/thumbnails')
        .field('altText', 'Category Thumbnail')
        .attach('files', VALID_JPEG_BUFFER, 'diver-thumb.jpg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assets[0].publicId).toBe('kairo/categories/thumbnails/diver-cat');
    });
  });

  describe('4. Orphan Asset Prevention & Persistence Rollback', () => {
    it('Should purge uploaded Cloudinary assets if MongoDB insertion fails', async () => {
      const cleanupSpy = vi.spyOn(mediaService, 'cleanupUploadedAssets').mockResolvedValue();

      vi.spyOn(mediaService, 'processUpload').mockResolvedValue({
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1234/orphan-watch.webp',
        publicId: 'kairo/products/orphan-watch',
        assetType: 'image',
        format: 'webp',
        altText: 'Test Media Orphan',
        caption: '',
        displayOrder: 0,
        dimensions: { width: 800, height: 800 },
        durationSeconds: 0,
        posterThumbnailUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/thumb.webp',
        deviceTarget: 'all',
        aspectRatio: '1:1',
        videoOrientation: 'none'
      });

      // Simulate MongoDB failure
      vi.spyOn(ProductMedia, 'insertMany').mockRejectedValue(new Error('Simulated Database Write Failure'));

      const res = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', VALID_JPEG_BUFFER, 'watch.jpg');

      expect(res.status).toBe(500);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      expect(cleanupSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ publicId: 'kairo/products/orphan-watch' })
        ])
      );
    });
  });

  describe('5. Replacement Cleanup Invariant', () => {
    it('Should preserve old asset until replacement DB update succeeds, then delete old asset', async () => {
      // Create initial media doc
      const initialDoc = new ProductMedia({
        assetType: 'image',
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1/old-watch.webp',
        publicId: 'kairo/products/old-watch',
        altText: 'Test Media Initial',
        displayOrder: 0,
        dimensions: { width: 1000, height: 1000 },
        aspectRatio: '1:1'
      });
      await initialDoc.save();

      const deleteSpy = vi.spyOn(mediaService, 'deleteFromCloudinary').mockResolvedValue({ result: 'ok' });
      vi.spyOn(mediaService, 'processUpload').mockResolvedValue({
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v2/new-watch.webp',
        publicId: 'kairo/products/new-watch',
        assetType: 'image',
        format: 'webp',
        altText: 'Test Media Initial',
        caption: '',
        displayOrder: 0,
        dimensions: { width: 1000, height: 1000 },
        durationSeconds: 0,
        posterThumbnailUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/thumb.webp',
        deviceTarget: 'all',
        aspectRatio: '1:1',
        videoOrientation: 'none'
      });

      const res = await request(app)
        .post(`/api/v1/admin/media/replace/${initialDoc._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', VALID_PNG_BUFFER, 'new_watch.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asset.publicId).toBe('kairo/products/new-watch');

      // Verify old asset was purged from Cloudinary
      expect(deleteSpy).toHaveBeenCalledWith('kairo/products/old-watch', 'image');

      // Verify DB record updated
      const updated = await ProductMedia.findById(initialDoc._id);
      expect(updated.publicId).toBe('kairo/products/new-watch');
    });

    it('Should roll back new asset if DB update fails during replacement, preserving old asset', async () => {
      const initialDoc = new ProductMedia({
        assetType: 'image',
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v1/safe-old-watch.webp',
        publicId: 'kairo/products/safe-old-watch',
        altText: 'Test Media Safe',
        displayOrder: 0,
        dimensions: { width: 1000, height: 1000 },
        aspectRatio: '1:1'
      });
      await initialDoc.save();

      const deleteSpy = vi.spyOn(mediaService, 'deleteFromCloudinary');
      const cleanupSpy = vi.spyOn(mediaService, 'cleanupUploadedAssets').mockResolvedValue();

      vi.spyOn(mediaService, 'processUpload').mockResolvedValue({
        secureUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/v2/failed-new-watch.webp',
        publicId: 'kairo/products/failed-new-watch',
        assetType: 'image',
        format: 'webp',
        altText: 'Test Media Safe',
        caption: '',
        displayOrder: 0,
        dimensions: { width: 1000, height: 1000 },
        durationSeconds: 0,
        posterThumbnailUrl: 'https://res.cloudinary.com/dbtq4qk6s/image/upload/thumb.webp',
        deviceTarget: 'all',
        aspectRatio: '1:1',
        videoOrientation: 'none'
      });

      // Simulate failure on save
      vi.spyOn(ProductMedia.prototype, 'save').mockRejectedValue(new Error('Simulated Database Error on Replace'));

      const res = await request(app)
        .post(`/api/v1/admin/media/replace/${initialDoc._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', VALID_PNG_BUFFER, 'new_watch.png');

      expect(res.status).toBe(500);

      // Old asset must NOT be deleted!
      expect(deleteSpy).not.toHaveBeenCalledWith('kairo/products/safe-old-watch', 'image');

      // Newly uploaded asset must be rolled back
      expect(cleanupSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ publicId: 'kairo/products/failed-new-watch' })
        ])
      );
    });
  });

  describe('6. Reordering, Deletion & Batch Cleanup', () => {
    it('Should reorder media items atomically', async () => {
      const doc1 = await ProductMedia.create({
        assetType: 'image',
        secureUrl: 'https://res.cloudinary.com/1.webp',
        publicId: 'kairo/products/order-1',
        altText: 'Test Media 1',
        displayOrder: 0
      });
      const doc2 = await ProductMedia.create({
        assetType: 'image',
        secureUrl: 'https://res.cloudinary.com/2.webp',
        publicId: 'kairo/products/order-2',
        altText: 'Test Media 2',
        displayOrder: 1
      });

      // Swap orders
      const res = await request(app)
        .patch('/api/v1/admin/media/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderedIds: [doc2._id.toString(), doc1._id.toString()] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const reloaded1 = await ProductMedia.findById(doc1._id);
      const reloaded2 = await ProductMedia.findById(doc2._id);
      expect(reloaded2.displayOrder).toBe(0);
      expect(reloaded1.displayOrder).toBe(1);
    });

    it('Should delete a media asset from Cloudinary and database', async () => {
      const doc = await ProductMedia.create({
        assetType: 'image',
        secureUrl: 'https://res.cloudinary.com/del.webp',
        publicId: 'kairo/products/to-delete',
        altText: 'Test Media Del',
        displayOrder: 0
      });

      const deleteSpy = vi.spyOn(mediaService, 'deleteFromCloudinary').mockResolvedValue({ result: 'ok' });

      const res = await request(app)
        .delete(`/api/v1/admin/media/${doc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(deleteSpy).toHaveBeenCalledWith('kairo/products/to-delete', 'image');

      const found = await ProductMedia.findById(doc._id);
      expect(found).toBeNull();
    });
  });
});
