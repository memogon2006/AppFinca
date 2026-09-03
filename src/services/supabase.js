import { createClient } from '@supabase/supabase-js';

const SUPABASE_DEFAULT_URL = 'https://dttfnmccnhlucnfvwgzh.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGZubWNjbmhsdWNuZnZ3Z3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0Njg0ODIsImV4cCI6MjEwNDA0NDQ4Mn0.hWGfubHLnfNSz54WWgFxERUYyzVwcHUsHDkMCebNFzU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
