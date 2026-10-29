import { Router } from 'express';
import { globalSearchHandler, autocompleteHandler } from '../controllers/searchController.js';

const router = Router();

// Unified faceted search across products, categories, and collections
router.get('/', globalSearchHandler);

// Fast typeahead autocomplete
router.get('/autocomplete', autocompleteHandler);

export default router;