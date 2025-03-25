import { Request, Response } from 'express';
import supabase, { formatSupabaseResponse } from '../services/supabase';
import { ContactFormSchemaType, ContactSubmissionSchemaType } from '../schemas';

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const contactData: ContactFormSchemaType = req.body;

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        ...contactData,
        read: false,
      }])
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return res.status(500).json({
      error: {
        message: 'Error submitting contact form',
      },
    });
  }
};

export const getContactSubmissions = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    const { data, error, count } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
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
    console.error('Error getting contact submissions:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving contact submissions',
      },
    });
  }
};

export const markContactSubmissionAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error marking contact submission as read:', error);
    return res.status(500).json({
      error: {
        message: 'Error updating contact submission',
      },
    });
  }
};

export const deleteContactSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    const response = formatSupabaseResponse({ success: true }, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return res.status(500).json({
      error: {
        message: 'Error deleting contact submission',
      },
    });
  }
};