
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = !supabaseUrl || !supabaseKey;

if (isPlaceholder) {
    const errorMsg = 'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local (development) or Firebase Console (App Hosting).';
    if (process.env.NODE_ENV === 'production') {
        // Log error to server/browser logs instead of crashing the build
        console.error(errorMsg);
    } else {
        console.warn(errorMsg);
    }
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder-url-missing.supabase.co',
    supabaseKey || 'placeholder-key-missing'
);
