import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  const { data: assignments, error: err } = await supabase
    .from("user_club_assignments")
    .select(`
      user_id,
      club_id,
      clubs (name),
      user_profiles (name, email, role)
    `);
  
  if (err) console.error("Error:", err);
  else console.log(JSON.stringify(assignments, null, 2));
}

run();
