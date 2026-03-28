import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safe client for runtime use, avoiding crashes during build metadata collection
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

/**
 * Utility to get a Supabase client that is guaranteed to be initialized.
 * Use this inside request handlers to ensure availability at runtime.
 */
export const getSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase environment variables are missing.');
    }
    return supabase;
};
