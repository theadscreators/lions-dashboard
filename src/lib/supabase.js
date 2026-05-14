import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
// En producción, las variables se inyectan vía GitHub Actions secrets.
// En desarrollo local, se usan los valores hardcodeados como fallback.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://snjtpmtzfeqpkuxnxxjg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuanRwbXR6ZmVxcGt1eG54eGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjAwNDAsImV4cCI6MjA5MzY5NjA0MH0.wjbORdlN37rsAb0KVTdi4qTEieqc_x2zy03X-91pSSE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
