import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMatches() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  console.log("Fixing Juan Pablo II matches...");
  // ID of Juan Pablo II is '26a7475b-b635-4011-898c-7af3618178af'
  const jpId = '26a7475b-b635-4011-898c-7af3618178af';

  // 1. Where home_team_name is 'ADC Juan Pablo II'
  const { data: res1, error: err1 } = await supabase
    .from('matches')
    .update({ home_club_id: jpId, home_team_name: null })
    .eq('home_team_name', 'ADC Juan Pablo II');
  console.log("Juan Pablo II (home) updated.");

  // 2. Where away_team_name is 'ADC Juan Pablo II'
  const { data: res2, error: err2 } = await supabase
    .from('matches')
    .update({ away_club_id: jpId, away_team_name: null })
    .eq('away_team_name', 'ADC Juan Pablo II');
  console.log("Juan Pablo II (away) updated.");


  console.log("Fixing Alianza Atlético Sullana matches...");
  // ID of Alianza Atlético Sullana is 'e391e466-299a-4d7e-8b53-91157b0c4022'
  const sullanaId = 'e391e466-299a-4d7e-8b53-91157b0c4022';

  // 3. Where home_team_name is 'Alianza Atletico' or 'Alianza Atletico Sullana' or 'Alianza Atlético'
  for (const name of ['Alianza Atletico', 'Alianza Atletico Sullana', 'Alianza Atlético']) {
    await supabase
      .from('matches')
      .update({ home_club_id: sullanaId, home_team_name: null })
      .eq('home_team_name', name);
  }
  // 4. Where away_team_name is 'Alianza Atletico' or 'Alianza Atletico Sullana' or 'Alianza Atlético'
  for (const name of ['Alianza Atletico', 'Alianza Atletico Sullana', 'Alianza Atlético']) {
    await supabase
      .from('matches')
      .update({ away_club_id: sullanaId, away_team_name: null })
      .eq('away_team_name', name);
  }
  console.log("Alianza Atlético Sullana updated.");


  console.log("Fixing FC Cajamarca matches...");
  // ID of FC Cajamarca is 'fd1b5c18-f8b4-41a3-bd92-6a10afaf2f63'
  const cajamarcaId = 'fd1b5c18-f8b4-41a3-bd92-6a10afaf2f63';

  // 5. Where home_team_name is 'CD UT Cajamarca' or 'UTC'
  for (const name of ['CD UT Cajamarca', 'UTC']) {
    await supabase
      .from('matches')
      .update({ home_club_id: cajamarcaId, home_team_name: null })
      .eq('home_team_name', name);
  }
  // 6. Where away_team_name is 'CD UT Cajamarca' or 'UTC'
  for (const name of ['CD UT Cajamarca', 'UTC']) {
    await supabase
      .from('matches')
      .update({ away_club_id: cajamarcaId, away_team_name: null })
      .eq('away_team_name', name);
  }
  console.log("FC Cajamarca updated.");

  console.log("All fixes run successfully!");
}

fixMatches();
