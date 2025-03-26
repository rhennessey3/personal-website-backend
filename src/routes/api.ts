import { Router } from 'express';
import caseStudiesRouter from './case-studies';
import blogPostsRouter from './blog-posts';
import profileRouter from './profile';
import contactRouter from './contact';
import adminRouter from './admin';

const router = Router();

// Mount routes
router.use('/case-studies', caseStudiesRouter);
router.use('/blog-posts', blogPostsRouter);
router.use('/profile', profileRouter);
router.use('/contact', contactRouter);
router.use('/admin', adminRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;