import { z } from 'zod';

export const tagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2).max(50),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const blogPostSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(10).max(500),
  content: z.string().min(10),
  featured_image_url: z.string().url().optional(),
  published: z.boolean().default(false),
  published_date: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const blogPostTagSchema = z.object({
  id: z.number().optional(),
  blog_post_id: z.number(),
  tag_id: z.number(),
});

export type BlogPostSchemaType = z.infer<typeof blogPostSchema>;
export type TagSchemaType = z.infer<typeof tagSchema>;
export type BlogPostTagSchemaType = z.infer<typeof blogPostTagSchema>;