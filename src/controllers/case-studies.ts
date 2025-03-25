import { Request, Response } from 'express';
import supabase, { formatSupabaseResponse } from '../services/supabase';
import { CaseStudySchemaType } from '../schemas';

export const getCaseStudies = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', tag } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    let query = supabase
      .from('case_studies')
      .select('*, case_study_sections(*), case_study_metrics(*), case_study_tags(tags(*))', { count: 'exact' });

    if (tag) {
      query = query.eq('case_study_tags.tags.name', tag);
    }

    const { data, error, count } = await query
      .order('published_date', { ascending: false })
      .range(offset, offset + limitNumber - 1);

    const response = formatSupabaseResponse(
      {
        data,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: count || 0,
          totalPages: count ? Math.ceil(count / limitNumber) : 0,
        },
      },
      error
    );

    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error getting case studies:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving case studies',
      },
    });
  }
};

export const getCaseStudyBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('case_studies')
      .select('*, case_study_sections(*), case_study_metrics(*), case_study_tags(tags(*))')
      .eq('slug', slug)
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error getting case study:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving case study',
      },
    });
  }
};

export const createCaseStudy = async (req: Request, res: Response) => {
  try {
    const caseStudyData: CaseStudySchemaType = req.body;

    const { data, error } = await supabase
      .from('case_studies')
      .insert([caseStudyData])
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error creating case study:', error);
    return res.status(500).json({
      error: {
        message: 'Error creating case study',
      },
    });
  }
};

export const updateCaseStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseStudyData: Partial<CaseStudySchemaType> = req.body;

    const { data, error } = await supabase
      .from('case_studies')
      .update(caseStudyData)
      .eq('id', id)
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error updating case study:', error);
    return res.status(500).json({
      error: {
        message: 'Error updating case study',
      },
    });
  }
};

export const deleteCaseStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('id', id);

    const response = formatSupabaseResponse({ success: true }, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error deleting case study:', error);
    return res.status(500).json({
      error: {
        message: 'Error deleting case study',
      },
    });
  }
};