import { Request, Response } from 'express';
import supabase, { formatSupabaseResponse } from '../services/supabase';
import { BlogPostSchemaType } from '../schemas';

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', tag } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;

    let query = supabase
      .from('blog_posts')
      .select('*, blog_post_tags(tags(*))', { count: 'exact' });

    if (tag) {
      query = query.eq('blog_post_tags.tags.name', tag);
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
    console.error('Error getting blog posts:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving blog posts',
      },
    });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_post_tags(tags(*))')
      .eq('slug', slug)
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error getting blog post:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving blog post',
      },
    });
  }
};

export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const blogPostData: BlogPostSchemaType = req.body;

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({
      error: {
        message: 'Error creating blog post',
      },
    });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const blogPostData: Partial<BlogPostSchemaType> = req.body;

    const { data, error } = await supabase
      .from('blog_posts')
      .update(blogPostData)
      .eq('id', id)
      .select()
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({
      error: {
        message: 'Error updating blog post',
      },
    });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    const response = formatSupabaseResponse({ success: true }, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({
      error: {
        message: 'Error deleting blog post',
      },
    });
  }
};