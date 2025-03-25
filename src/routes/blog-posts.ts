import { Router } from 'express';
import {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blog-posts';
import { validateAuth, validateAdmin } from '../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import { blogPostSchema } from '../schemas';
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
router.get('/', validateQuery(querySchema), getBlogPosts);
router.get('/:slug', validateParams(slugParamSchema), getBlogPostBySlug);

// Protected admin routes
router.post(
  '/',
  validateAuth,
  validateAdmin,
  validateBody(blogPostSchema),
  createBlogPost
);

router.put(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  validateBody(blogPostSchema),
  updateBlogPost
);

router.delete(
  '/:id',
  validateAuth,
  validateAdmin,
  validateParams(idParamSchema),
  deleteBlogPost
);

export default router;