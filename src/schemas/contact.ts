import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export const contactSubmissionSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
  created_at: z.string().datetime().optional(),
  read: z.boolean().default(false),
});

export type ContactFormSchemaType = z.infer<typeof contactFormSchema>;
export type ContactSubmissionSchemaType = z.infer<typeof contactSubmissionSchema>;