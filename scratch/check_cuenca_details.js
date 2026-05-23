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

  const { data: cuenca } = await supabase.from("clubs").select("*").eq("name", "Deportivo Cuenca").single();
  console.log("=== CLUB CUENCA ===");
  console.log(cuenca);

  const { data: clients } = await supabase.from("clients").select("*").eq("club_id", cuenca.id);
  console.log("\n=== CUENCA CLIENTS ===");
  console.log(clients);

  const { data: matches, error: matchesErr } = await supabase
    .from("matches")
    .select(`
      id,
      match_date,
      home_club_id,
      away_club_id,
      home_team_name,
      away_team_name,
      status,
      operational_notes
    `)
    .or(`home_club_id.eq.${cuenca.id},away_club_id.eq.${cuenca.id}`)
    .order("match_date");
  if (matchesErr) console.error("Error fetching matches:", matchesErr);
  console.log("\n=== CUENCA MATCHES ===");
  console.log(matches);
}

run();
