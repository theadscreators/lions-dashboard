import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listMatches() {
  console.log("Authenticating as admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }

  console.log("Authenticated. Fetching matches...");
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_date,
      away_team_name,
      status,
      home_club:clubs!home_club_id(name),
      away_club:clubs!away_club_id(name)
    `)
    .order('match_date', { ascending: true });

  if (error) {
    console.error("Error fetching matches:", error);
    return;
  }

  if (matches.length === 0) {
    console.log("No matches found in the database for this user.");
    return;
  }

  console.log(`Total matches found: ${matches.length}`);
  const formatted = matches.map(m => ({
    Fecha: new Date(m.match_date).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    Local: m.home_club?.name || "Desconocido",
    Visitante: m.away_club?.name || m.away_team_name || "Desconocido",
    Estado: m.status
  }));
  
  console.table(formatted);
}

listMatches();
