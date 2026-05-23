import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  // Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  // 1. Buscar todos los clubs que tengan "católica" o "catolica" en el nombre
  const { data: clubs, error: cErr } = await supabase
    .from("clubs")
    .select("id, name, league_id, api_team_id, sofascore_id, fotmob_id, status")
    .or("name.ilike.%catolica%,name.ilike.%católica%");

  console.log("\n=== CLUBS CON 'CATÓLICA' EN EL NOMBRE ===");
  if (cErr) console.error(cErr);
  else clubs.forEach(c => console.log(JSON.stringify(c, null, 2)));

  // 2. Buscar clubs con "Cuenca" en el nombre
  const { data: cuenca, error: cuErr } = await supabase
    .from("clubs")
    .select("id, name, league_id, api_team_id, sofascore_id, fotmob_id, status")
    .or("name.ilike.%cuenca%");

  console.log("\n=== CLUBS CON 'CUENCA' EN EL NOMBRE ===");
  if (cuErr) console.error(cuErr);
  else cuenca.forEach(c => console.log(JSON.stringify(c, null, 2)));

  // 3. Listar las ligas
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, country_id, fotmob_id, sofascore_id");

  console.log("\n=== LIGAS ===");
  leagues.forEach(l => console.log(JSON.stringify(l, null, 2)));

  // 4. Listar los países
  const { data: countries } = await supabase
    .from("countries")
    .select("id, name, code");

  console.log("\n=== PAÍSES ===");
  countries.forEach(c => console.log(JSON.stringify(c, null, 2)));

  // 5. Buscar todos los clubs de Ecuador
  const ecCountry = countries.find(c => c.code === 'ec');
  if (ecCountry) {
    const ecLeague = leagues.find(l => l.country_id === ecCountry.id);
    if (ecLeague) {
      const { data: ecClubs } = await supabase
        .from("clubs")
        .select("id, name, api_team_id, sofascore_id, fotmob_id, status")
        .eq("league_id", ecLeague.id)
        .order("name");
      
      console.log(`\n=== CLUBS DE ECUADOR (Liga: ${ecLeague.name}) ===`);
      ecClubs.forEach(c => console.log(JSON.stringify(c, null, 2)));
    }
  }

  // 6. Buscar partidos que referencien a clubs con "católica" 
  if (clubs.length > 0) {
    for (const club of clubs) {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, home_club_id, away_club_id, home_team_name, away_team_name, match_date, league_id")
        .or(`home_club_id.eq.${club.id},away_club_id.eq.${club.id}`)
        .order("match_date", { ascending: true })
        .limit(5);
      
      console.log(`\n=== PARTIDOS DE "${club.name}" (${club.id}) ===`);
      matches.forEach(m => console.log(JSON.stringify(m, null, 2)));
    }
  }
}

check();
