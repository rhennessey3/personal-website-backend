import { Router } from 'express';
import {
  submitContactForm,
  getContactSubmissions,
  markContactSubmissionAsRead,
  deleteContactSubmission,
} from '../controllers/contact';
import { validateAuth, validateAdmin } from '../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import { contactFormSchema } from '../schemas';
import { z } from 'zod';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

// Public routes
router.post(
  '/',
  validateBody(contactFormSchema),
  submitContactForm
);

// Protected admin routes
router.get(
  '/',
  validateAuth,
  validateAdmin,
  validateQuery(querySchema),
  getContactSubmissions
);

router.put(
  '/:id/read',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  markContactSubmissionAsRead
);

router.delete(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  deleteContactSubmission
);

export default router;