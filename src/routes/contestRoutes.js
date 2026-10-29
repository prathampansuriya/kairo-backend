import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import * as contestController from '../controllers/contestController.js';

const router = Router();

// Public
router.get('/active', contestController.getPublicActiveContestHandler);
router.post('/entries', contestController.submitContestEntryHandler);

// Admin
router.use('/admin', authenticate, authorizeRoles('admin', 'superadmin', 'content_manager'));
router.get('/admin', contestController.getAllContestsAdminHandler);
router.post('/admin', contestController.createContestHandler);
router.get('/admin/:id', contestController.getContestByIdHandler);
router.put('/admin/:id', contestController.updateContestHandler);
router.delete('/admin/:id', contestController.deleteContestHandler);
router.get('/admin/:id/entries', contestController.getContestEntriesHandler);
router.post('/admin/:id/draw-winner', contestController.drawWinnerHandler);

export default router;