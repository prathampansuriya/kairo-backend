import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
} from '../validators/addressValidators.js';
import * as addressController from '../controllers/addressController.js';

const router = express.Router();

// Require customer authentication for all address operations
router.use(authenticate);

router.get('/', addressController.getAddresses);
router.post('/', validateRequest(createAddressSchema), addressController.createAddress);
router.get('/:id', validateRequest(addressIdParamSchema), addressController.getAddressById);
router.put('/:id', validateRequest(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', validateRequest(addressIdParamSchema), addressController.deleteAddress);
router.patch('/:id/default', validateRequest(addressIdParamSchema), addressController.setDefaultAddress);

export default router;
