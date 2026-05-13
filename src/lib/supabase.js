import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
// La URL y la Anon Key son públicas por diseño y seguras de incluir aquí 
// ya que la base de datos está protegida por RLS (Row Level Security).

const supabaseUrl = 'https://snjtpmtzfeqpkuxnxxjg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuanRwbXR6ZmVxcGt1eG54eGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjAwNDAsImV4cCI6MjA5MzY5NjA0MH0.wjbORdlN37rsAb0KVTdi4qTEieqc_x2zy03X-91pSSE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
