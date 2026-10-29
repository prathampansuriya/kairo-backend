import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);
router.get('/readiness', getReadiness);
router.get('/ready', getReadiness);

export default router;
