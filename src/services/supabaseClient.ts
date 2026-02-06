
import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Só exporta o cliente se as chaves existirem para evitar erros em dev sem config
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
