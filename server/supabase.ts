import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('CRITICAL: Supabase credentials missing. The application will not function correctly.');
}

export const isConfigured = !!supabaseUrl && !!supabaseServiceKey;

// Initialize with placeholders if missing to prevent immediate crash on import
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
