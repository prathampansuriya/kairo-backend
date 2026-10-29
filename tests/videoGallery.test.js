import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { VideoGalleryItem } from '../src/models/VideoGalleryItem.js';
import { User } from '../src/models/User.js';

describe('PROMPT-10 Video Gallery Integration Tests', { timeout: 30000 }, () => {
  let app;
  let adminUser;
  let adminToken;
  let testPublishedLandscapeVideo;
  let testPublishedReelVideo;
  let testDraftVideo;

  beforeAll(async () => {
    app = createApp();
    await connectDB();

    // 1. Create admin user
    adminUser = await User.create({
      firstName: 'Video',
      lastName: 'Curator',
      email: `video-admin-${Date.now()}@kairo-horology.com`,
      password: 'AdminPassword123!',
      role: 'admin',
      isEmailVerified: true
    });
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), _id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Seed published landscape 16:9 video
    testPublishedLandscapeVideo = await VideoGalleryItem.create({
      title: 'Grand Chronograph 1888 Showcase',
      slug: `grand-chrono-1888-${Date.now()}`,
      videoType: 'product_showcase',
      videoUrl: 'https://res.cloudinary.com/kairo/video/upload/v1/chrono-showcase.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/kairo/image/upload/v1/chrono-poster.jpg',
      aspectRatio: '16:9',
      durationSeconds: 45,
      placement: 'product_showcase',
      publicationStatus: 'published',
      displayOrder: 1,
      isActive: true
    });

    // 3. Seed published vertical 9:16 reel
    testPublishedReelVideo = await VideoGalleryItem.create({
      title: 'Atelier Master Finishing Reel',
      slug: `finishing-reel-${Date.now()}`,
      videoType: 'luxury_editorial',
      videoUrl: 'https://res.cloudinary.com/kairo/video/upload/v1/finishing-reel.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/kairo/image/upload/v1/reel-poster.jpg',
      aspectRatio: '9:16',
      durationSeconds: 15,
      placement: 'home_reels',
      publicationStatus: 'published',
      displayOrder: 2,
      isActive: true
    });

    // 4. Seed draft video (MUST NEVER be exposed publicly)
    testDraftVideo = await VideoGalleryItem.create({
      title: 'Confidential Baselworld Prototype',
      slug: `confidential-prototype-${Date.now()}`,
      videoType: 'luxury_editorial',
      videoUrl: 'https://res.cloudinary.com/kairo/video/upload/v1/draft.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/kairo/image/upload/v1/draft-poster.jpg',
      aspectRatio: '16:9',
      publicationStatus: 'draft',
      isActive: true
    });
  }, 45000);

  afterAll(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (testPublishedLandscapeVideo) await VideoGalleryItem.findByIdAndDelete(testPublishedLandscapeVideo._id);
    if (testPublishedReelVideo) await VideoGalleryItem.findByIdAndDelete(testPublishedReelVideo._id);
    if (testDraftVideo) await VideoGalleryItem.findByIdAndDelete(testDraftVideo._id);
  });

  describe('1. Public Video Gallery & Publication Invariants', () => {
    it('Should strictly return ONLY published and active videos', async () => {
      const res = await request(app).get('/api/v1/videos');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.data.items;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(2);

      // Verify draft video is completely excluded
      const draftFound = items.find((v) => v.slug === testDraftVideo.slug);
      expect(draftFound).toBeUndefined();

      // All returned items must be published
      items.forEach((item) => {
        expect(item.publicationStatus).toBe('published');
        expect(item.isActive).toBe(true);
      });
    });

    it('Should filter published videos by aspectRatio (16:9 landscape vs 9:16 vertical reel)', async () => {
      // 16:9 filter
      const res169 = await request(app).get('/api/v1/videos?aspectRatio=16:9');
      expect(res169.status).toBe(200);
      const items169 = res169.body.data.items;
      items169.forEach((v) => {
        expect(v.aspectRatio).toBe('16:9');
        expect(v.orientation).toBe('landscape');
      });

      // 9:16 filter
      const res916 = await request(app).get('/api/v1/videos?aspectRatio=9:16');
      expect(res916.status).toBe(200);
      const items916 = res916.body.data.items;
      items916.forEach((v) => {
        expect(v.aspectRatio).toBe('9:16');
        expect(v.orientation).toBe('portrait');
      });
    });

    it('Should filter published videos by videoType', async () => {
      const res = await request(app).get('/api/v1/videos?videoType=luxury_editorial');
      expect(res.status).toBe(200);
      const items = res.body.data.items;
      items.forEach((v) => {
        expect(v.videoType).toBe('luxury_editorial');
      });
    });

    it('Should retrieve published video by slug and atomically increment viewCount', async () => {
      const initialViewCount = testPublishedLandscapeVideo.viewCount || 0;

      const res = await request(app).get(`/api/v1/videos/slug/${testPublishedLandscapeVideo.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(testPublishedLandscapeVideo.slug);
      expect(res.body.data.viewCount).toBe(initialViewCount + 1);
    });

    it('Should return 404 when querying an unpublished/draft video by slug', async () => {
      const res = await request(app).get(`/api/v1/videos/slug/${testDraftVideo.slug}`);
      expect(res.status).toBe(404);
    });
  });

  describe('2. Administrative Video Gallery CRUD', () => {
    let createdVideoId;

    it('Should reject unauthenticated or non-admin attempts to create video assets', async () => {
      const res = await request(app).post('/api/v1/videos/admin').send({
        title: 'Unauthorized Video',
        videoUrl: 'https://res.cloudinary.com/kairo/video/upload/v1/unauth.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/kairo/image/upload/v1/unauth.jpg'
      });
      expect(res.status).toBe(401);
    });

    it('Should allow admin to create a new video asset with automated slug & orientation', async () => {
      const payload = {
        title: 'Atelier Tourbillon Assembly',
        videoType: 'luxury_editorial',
        videoUrl: 'https://res.cloudinary.com/kairo/video/upload/v1/tourbillon.mp4',
        thumbnailUrl: 'https://res.cloudinary.com/kairo/image/upload/v1/tourbillon.jpg',
        aspectRatio: '9:16',
        durationSeconds: 28,
        placement: 'home_reels',
        publicationStatus: 'published',
        displayOrder: 10
      };

      const res = await request(app)
        .post('/api/v1/videos/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.slug).toContain('atelier-tourbillon-assembly');
      expect(res.body.data.orientation).toBe('portrait');
      createdVideoId = res.body.data._id;
    });

    it('Should allow admin to update video metadata and publication status', async () => {
      const res = await request(app)
        .put(`/api/v1/videos/admin/${createdVideoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Atelier Tourbillon Assembly (Director Cut)',
          publicationStatus: 'archived'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('Director Cut');
      expect(res.body.data.publicationStatus).toBe('archived');
    });

    it('Should allow admin to list all videos including drafts and archived', async () => {
      const res = await request(app)
        .get('/api/v1/videos/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      const foundDraft = items.find((v) => v.slug === testDraftVideo.slug);
      expect(foundDraft).toBeDefined();
    });

    it('Should allow admin to delete a video asset', async () => {
      const res = await request(app)
        .delete(`/api/v1/videos/admin/${createdVideoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const checkDb = await VideoGalleryItem.findById(createdVideoId);
      expect(checkDb).toBeNull();
    });
  });
});
