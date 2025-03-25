import { Request, Response } from 'express';
import supabase, { formatSupabaseResponse } from '../services/supabase';
import { ProfileSchemaType } from '../schemas';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        work_experiences(*),
        education(*),
        skills(*)
      `)
      .single();

    const response = formatSupabaseResponse(data, error);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      error: {
        message: 'Error retrieving profile',
      },
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const profileData: Partial<ProfileSchemaType> = req.body;
    const { id } = req.params;

    // Update main profile
    const { data: profileData_, error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      const response = formatSupabaseResponse(null, profileError);
      return res.status(response.status).json(response.body);
    }

    // Update work experiences if provided
    if (profileData.work_experiences) {
      const { error: workError } = await supabase
        .from('work_experiences')
        .upsert(
          profileData.work_experiences.map(exp => ({
            ...exp,
            profile_id: id
          }))
        );

      if (workError) {
        const response = formatSupabaseResponse(null, workError);
        return res.status(response.status).json(response.body);
      }
    }

    // Update education if provided
    if (profileData.education) {
      const { error: eduError } = await supabase
        .from('education')
        .upsert(
          profileData.education.map(edu => ({
            ...edu,
            profile_id: id
          }))
        );

      if (eduError) {
        const response = formatSupabaseResponse(null, eduError);
        return res.status(response.status).json(response.body);
      }
    }

    // Update skills if provided
    if (profileData.skills) {
      const { error: skillsError } = await supabase
        .from('skills')
        .upsert(
          profileData.skills.map(skill => ({
            ...skill,
            profile_id: id
          }))
        );

      if (skillsError) {
        const response = formatSupabaseResponse(null, skillsError);
        return res.status(response.status).json(response.body);
      }
    }

    // Get updated profile with all relations
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        work_experiences(*),
        education(*),
        skills(*)
      `)
      .eq('id', id)
      .single();

    const response = formatSupabaseResponse(updatedProfile, fetchError);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      error: {
        message: 'Error updating profile',
      },
    });
  }
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const profileData: ProfileSchemaType = req.body;

    // Create main profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      const response = formatSupabaseResponse(null, profileError);
      return res.status(response.status).json(response.body);
    }

    const profileId = profile.id;

    // Create work experiences if provided
    if (profileData.work_experiences) {
      const { error: workError } = await supabase
        .from('work_experiences')
        .insert(
          profileData.work_experiences.map(exp => ({
            ...exp,
            profile_id: profileId
          }))
        );

      if (workError) {
        const response = formatSupabaseResponse(null, workError);
        return res.status(response.status).json(response.body);
      }
    }

    // Create education if provided
    if (profileData.education) {
      const { error: eduError } = await supabase
        .from('education')
        .insert(
          profileData.education.map(edu => ({
            ...edu,
            profile_id: profileId
          }))
        );

      if (eduError) {
        const response = formatSupabaseResponse(null, eduError);
        return res.status(response.status).json(response.body);
      }
    }

    // Create skills if provided
    if (profileData.skills) {
      const { error: skillsError } = await supabase
        .from('skills')
        .insert(
          profileData.skills.map(skill => ({
            ...skill,
            profile_id: profileId
          }))
        );

      if (skillsError) {
        const response = formatSupabaseResponse(null, skillsError);
        return res.status(response.status).json(response.body);
      }
    }

    // Get created profile with all relations
    const { data: createdProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        work_experiences(*),
        education(*),
        skills(*)
      `)
      .eq('id', profileId)
      .single();

    const response = formatSupabaseResponse(createdProfile, fetchError);
    return res.status(response.status).json(response.body);
  } catch (error) {
    console.error('Error creating profile:', error);
    return res.status(500).json({
      error: {
        message: 'Error creating profile',
      },
    });
  }
};