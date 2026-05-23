import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verify() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  // Get club IDs
  const { data: ucatolica } = await supabase.from("clubs").select("id, name, fotmob_id").eq("name", "U. Católica").single();
  const { data: cuenca } = await supabase.from("clubs").select("id, name, fotmob_id").eq("name", "Deportivo Cuenca").single();

  console.log("=== U. CATÓLICA ECUADOR ===");
  console.log(`Club: ${ucatolica.name} | fotmob_id: ${ucatolica.fotmob_id}`);
  
  const { data: ucMatches } = await supabase
    .from("matches")
    .select("id, home_club_id, away_club_id, home_team_name, away_team_name, match_date, league_id")
    .or(`home_club_id.eq.${ucatolica.id},away_club_id.eq.${ucatolica.id}`)
    .order("match_date")
    .limit(5);
  
  // Get league names
  const { data: leagues } = await supabase.from("leagues").select("id, name");
  const leagueMap = {};
  leagues.forEach(l => leagueMap[l.id] = l.name);
  
  console.log(`Partidos vinculados: ${ucMatches.length}`);
  ucMatches.forEach(m => {
    const isHome = m.home_club_id === ucatolica.id;
    const opponent = isHome ? (m.away_team_name || "Club vinculado") : (m.home_team_name || "Club vinculado");
    const role = isHome ? "LOCAL" : "VISITA";
    console.log(`  ${new Date(m.match_date).toLocaleDateString()} | ${role} vs ${opponent} | Liga: ${leagueMap[m.league_id]}`);
  });

  console.log("\n=== DEPORTIVO CUENCA ===");
  console.log(`Club: ${cuenca.name} | fotmob_id: ${cuenca.fotmob_id}`);
  
  const { data: cuencaMatches } = await supabase
    .from("matches")
    .select("id, home_club_id, away_club_id, home_team_name, away_team_name, match_date, league_id")
    .or(`home_club_id.eq.${cuenca.id},away_club_id.eq.${cuenca.id}`)
    .order("match_date")
    .limit(5);
  
  console.log(`Partidos vinculados: ${cuencaMatches.length}`);
  cuencaMatches.forEach(m => {
    const isHome = m.home_club_id === cuenca.id;
    const opponent = isHome ? (m.away_team_name || "Club vinculado") : (m.home_team_name || "Club vinculado");
    const role = isHome ? "LOCAL" : "VISITA";
    console.log(`  ${new Date(m.match_date).toLocaleDateString()} | ${role} vs ${opponent} | Liga: ${leagueMap[m.league_id]}`);
  });

  // Verify NO Chile matches linked to U. Católica Ecuador
  const chileLeague = leagues.find(l => l.name.includes("Primera Chile"));
  if (chileLeague) {
    const { data: wrongMatches } = await supabase
      .from("matches")
      .select("id")
      .eq("league_id", chileLeague.id)
      .or(`home_club_id.eq.${ucatolica.id},away_club_id.eq.${ucatolica.id}`);
    
    console.log(`\n✅ Partidos de Chile vinculados a U. Católica Ecuador: ${wrongMatches.length} (debe ser 0)`);
  }
}

verify();
