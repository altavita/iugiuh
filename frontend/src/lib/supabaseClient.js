// frontend/src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Usa la tua configurazione esistente
const supabaseUrl = "https://ncqaobodkdzgbmncomdu.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcWFvYm9ka2R6Z2JtbmNvbWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MzU5MTIsImV4cCI6MjA1ODUxMTkxMn0.QKu1zKeIlUQDEkHsyX98EJKFeyJOprLdJECsL1Wqpg4"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions per l'autenticazione
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

export const getUserActivity = async (userId) => {
  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
  
  return data;
};

export const getUserCourseProgress = async (userId) => {
  const { data, error } = await supabase
    .from('course_progress')
    .select(`
      *,
      courses (
        id,
        title,
        duration,
        total_lessons
      )
    `)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching course progress:', error);
    return [];
  }
  
  return data;
};

export const updateCourseProgress = async (userId, courseId, progress, lessonCompleted) => {
  const { data, error } = await supabase
    .from('course_progress')
    .upsert({
      user_id: userId,
      course_id: courseId,
      progress: progress,
      last_lesson_completed: lessonCompleted,
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error updating course progress:', error);
    return null;
  }
  
  return data;
};