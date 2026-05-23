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

  const { data: profiles, error: profError } = await supabase
    .from("user_profiles")
    .select("id, name, email, role");
  
  if (profError) {
    console.error("Error fetching profiles:", profError);
  } else {
    console.log("Profiles:", profiles);
  }
}

run();
