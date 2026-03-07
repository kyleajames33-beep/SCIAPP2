/**
 * Supabase Questions Helper Functions
 * 
 * Provides functions to fetch questions from the Supabase database.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    console.log('[QUESTIONS-SUPABASE] Initializing Supabase client');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: number;
  subject: string;
  topic: string;
  difficulty: string;
  explanation: string | null;
}

/**
 * Get a random question from the database
 */
export async function getRandomQuestion(): Promise<{ question: Question | null; error: string | null }> {
  console.log('[QUESTIONS-SUPABASE] Fetching random question...');
  
  try {
    const supabase = getSupabaseClient();
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('Question')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[QUESTIONS-SUPABASE] Count error:', countError.message);
      return { question: null, error: countError.message };
    }
    
    console.log('[QUESTIONS-SUPABASE] Total questions:', count);
    
    if (!count || count === 0) {
      return { question: null, error: 'No questions found in database' };
    }
    
    // Get a random offset
    const randomOffset = Math.floor(Math.random() * count);
    console.log('[QUESTIONS-SUPABASE] Random offset:', randomOffset);
    
    // Fetch one question at random offset
    const { data, error } = await supabase
      .from('Question')
      .select('*')
      .range(randomOffset, randomOffset)
      .single();
    
    if (error) {
      console.error('[QUESTIONS-SUPABASE] Fetch error:', error.message);
      return { question: null, error: error.message };
    }
    
    console.log('[QUESTIONS-SUPABASE] Question fetched:', data?.id);
    
    return { question: data as Question, error: null };
  } catch (error) {
    console.error('[QUESTIONS-SUPABASE] Unexpected error:', error);
    return { 
      question: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all questions (for debugging)
 */
export async function getAllQuestions(): Promise<{ questions: Question[]; error: string | null }> {
  console.log('[QUESTIONS-SUPABASE] Fetching all questions...');
  
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Question')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('[QUESTIONS-SUPABASE] Fetch error:', error.message);
      return { questions: [], error: error.message };
    }
    
    console.log('[QUESTIONS-SUPABASE] Questions fetched:', data?.length);
    
    return { questions: data as Question[], error: null };
  } catch (error) {
    console.error('[QUESTIONS-SUPABASE] Unexpected error:', error);
    return { 
      questions: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
