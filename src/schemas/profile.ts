import { z } from 'zod';

export const workExperienceSchema = z.object({
  id: z.number().optional(),
  profile_id: z.number().optional(),
  company: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  description: z.string().min(10),
  key_achievements: z.array(z.string()),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const educationSchema = z.object({
  id: z.number().optional(),
  profile_id: z.number().optional(),
  institution: z.string().min(2).max(100),
  degree: z.string().min(2).max(100),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().optional(),
  description: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const skillSchema = z.object({
  id: z.number().optional(),
  profile_id: z.number().optional(),
  category: z.string().min(2).max(50),
  name: z.string().min(2).max(50),
  proficiency: z.number().int().min(1).max(5),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const profileSchema = z.object({
  id: z.number().optional(),
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  title: z.string().min(2).max(100),
  bio: z.string().min(10),
  profile_image_url: z.string().url().optional(),
  contact_email: z.string().email(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  work_experiences: z.array(workExperienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(skillSchema).optional(),
});

export type ProfileSchemaType = z.infer<typeof profileSchema>;
export type WorkExperienceSchemaType = z.infer<typeof workExperienceSchema>;
export type EducationSchemaType = z.infer<typeof educationSchema>;
export type SkillSchemaType = z.infer<typeof skillSchema>;