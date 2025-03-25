import { z } from 'zod';

export const caseStudySectionSchema = z.object({
  id: z.number().optional(),
  case_study_id: z.number().optional(),
  section_type: z.enum([
    'challenge',
    'approach',
    'solution',
    'results',
    'learnings',
    'future_directions'
  ]),
  section_order: z.number().int().min(0),
  title: z.string().min(3).max(100),
  content: z.string().min(10),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const caseStudyMetricSchema = z.object({
  id: z.number().optional(),
  case_study_id: z.number().optional(),
  section_type: z.enum(['business_impact', 'user_impact', 'technical_achievements']),
  label: z.string().min(3).max(100),
  value: z.string().min(1).max(50),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const caseStudySchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(10).max(500),
  featured_image_url: z.string().url().optional(),
  published: z.boolean().default(false),
  published_date: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  sections: z.array(caseStudySectionSchema).optional(),
  metrics: z.array(caseStudyMetricSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const caseStudyTagSchema = z.object({
  id: z.number().optional(),
  case_study_id: z.number(),
  tag_id: z.number(),
});

export type CaseStudySchemaType = z.infer<typeof caseStudySchema>;
export type CaseStudySectionSchemaType = z.infer<typeof caseStudySectionSchema>;
export type CaseStudyMetricSchemaType = z.infer<typeof caseStudyMetricSchema>;
export type CaseStudyTagSchemaType = z.infer<typeof caseStudyTagSchema>;