import { Router } from 'express';
import {
  getCaseStudies,
  getCaseStudyBySlug,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} from '../controllers/case-studies';
import { validateAuth, validateAdmin } from '../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import { caseStudySchema } from '../schemas';
import { z } from 'zod';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  tag: z.string().optional(),
});

const slugParamSchema = z.object({
  slug: z.string().min(1),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

// Public routes
router.get('/', validateQuery(querySchema), getCaseStudies);
router.get('/:slug', validateParams(slugParamSchema), getCaseStudyBySlug);

// Protected admin routes
router.post(
  '/',
  validateAuth,
  validateAdmin,
  validateBody(caseStudySchema),
  createCaseStudy
);

router.put(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  validateBody(caseStudySchema),
  updateCaseStudy
);

router.delete(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  deleteCaseStudy
);

export default router;