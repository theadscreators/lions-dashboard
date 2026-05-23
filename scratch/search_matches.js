import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchMatches() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  // Search by text or by club id
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      away_team_name,
      home_club_id,
      away_club_id,
      status
    `)
    .or('away_team_name.ilike.%melgar%,away_team_name.ilike.%sullana%,away_team_name.ilike.%cajamarca%');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${matches.length} matches matching search query:`);
  console.log(JSON.stringify(matches, null, 2));

  // Let's also search where home_club_id or away_club_id matches the IDs of Sullana or Juan Pablo II
  const ids = [
    "e391e466-299a-4d7e-8b53-91157b0c4022", // Alianza Atlético Sullana
    "26a7475b-b635-4011-898c-7af3618178af", // Juan Pablo II
    "fd1b5c18-f8b4-41a3-bd92-6a10afaf2f63"  // FC Cajamarca
  ];

  const { data: matchesById, error: error2 } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      away_team_name,
      home_club_id,
      away_club_id,
      status
    `)
    .or(`home_club_id.in.("${ids.join('","')}"),away_club_id.in.("${ids.join('","')}")`);

  console.log(`Found ${matchesById?.length || 0} matches by ID filter:`);
  console.log(JSON.stringify(matchesById, null, 2));
}

searchMatches();
