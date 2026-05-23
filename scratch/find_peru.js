import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMatches() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      away_team_name,
      status,
      home_club:clubs!home_club_id(*),
      away_club:clubs!away_club_id(*)
    `)
    .gte('match_date', '2026-05-20T00:00:00Z')
    .lte('match_date', '2026-05-26T23:59:59Z')
    .order('match_date', { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${matches.length} matches:`);
  console.log(JSON.stringify(matches, null, 2));
}

findMatches();
