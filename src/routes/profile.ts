import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  createProfile,
} from '../controllers/profile';
import { validateAuth, validateAdmin } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { profileSchema } from '../schemas';
import { z } from 'zod';

const router = Router();

const idParamSchema = z.object({
  id: z.string().min(1),
});

// Public routes
router.get('/', getProfile);

// Protected admin routes
router.post(
  '/',
  validateAuth,
  validateAdmin,
  validateBody(profileSchema),
  createProfile
);

router.put(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  validateBody(profileSchema),
  updateProfile
);

export default router;