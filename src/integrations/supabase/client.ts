
import { createClient } from '@supabase/supabase-js'

// Use environment variables if available, fallback to hardcoded values for development
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://fjybmlugiqmiggsdrkiq.supabase.co'
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWJtbHVnaXFtaWdnc2Rya2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDYxNjAsImV4cCI6MjA2MDgyMjE2MH0.zdCS-vPtsg15ucfw0HAoNzNLbevhJA3njyLzf_XrzvQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
