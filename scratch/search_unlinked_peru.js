import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchUnlinked() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, match_date, home_team_name, away_team_name, home_club_id, away_club_id')
    .or('home_team_name.ilike.%juan%,away_team_name.ilike.%juan%,home_team_name.ilike.%sullana%,away_team_name.ilike.%sullana%');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Unlinked matches:", JSON.stringify(matches, null, 2));
}

searchUnlinked();
