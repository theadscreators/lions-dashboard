import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fix() {
  // Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);
  console.log("✅ Autenticado\n");

  // Get Ecuador league id
  const { data: ecLeague } = await supabase
    .from("leagues")
    .select("id")
    .eq("fotmob_id", 246)
    .single();

  if (!ecLeague) return console.error("❌ No se encontró liga Ecuador");
  console.log("Liga Ecuador:", ecLeague.id);

  // 1. Fix U. Católica fotmob_id: 6458 (Chile) → 113053 (Ecuador)
  const UCATOLICA_EC_ID = "3d4dafec-2d49-404b-98ad-d994269055ed"; // from our check
  
  console.log("\n--- PASO 1: Corregir fotmob_id de U. Católica Ecuador ---");
  const { error: updateErr } = await supabase
    .from("clubs")
    .update({ fotmob_id: 113053 })
    .eq("id", UCATOLICA_EC_ID);
  
  if (updateErr) console.error("❌ Error actualizando fotmob_id:", updateErr.message);
  else console.log("✅ U. Católica Ecuador → fotmob_id: 113053 (era 6458 = Chile)");

  // 2. Limpiar partidos de Chile que se asignaron incorrectamente a U. Católica Ecuador
  console.log("\n--- PASO 2: Limpiar partidos incorrectos de U. Católica ---");
  
  // Buscar partidos de la liga de Chile que tienen a U. Católica Ecuador como home o away
  const { data: chileLeague } = await supabase
    .from("leagues")
    .select("id")
    .eq("fotmob_id", 273)
    .single();
  
  // Partidos de liga Chile donde home o away es nuestro U. Católica Ecuador
  const { data: wrongMatchesHome } = await supabase
    .from("matches")
    .select("id, home_club_id, away_club_id, match_date, home_team_name, away_team_name")
    .eq("league_id", chileLeague.id)
    .eq("home_club_id", UCATOLICA_EC_ID);
  
  const { data: wrongMatchesAway } = await supabase
    .from("matches")
    .select("id, home_club_id, away_club_id, match_date, home_team_name, away_team_name")
    .eq("league_id", chileLeague.id)
    .eq("away_club_id", UCATOLICA_EC_ID);
  
  const wrongMatches = [...(wrongMatchesHome || []), ...(wrongMatchesAway || [])];
  console.log(`Encontrados ${wrongMatches.length} partidos de Chile asignados a U. Católica Ecuador`);
  
  for (const m of wrongMatches) {
    // Desvincular U. Católica Ecuador de estos partidos de Chile
    const updates = {};
    if (m.home_club_id === UCATOLICA_EC_ID) {
      updates.home_club_id = null;
      updates.home_team_name = "Universidad Catolica";  // Dejar como texto sin vincular
    }
    if (m.away_club_id === UCATOLICA_EC_ID) {
      updates.away_club_id = null;
      updates.away_team_name = "Universidad Catolica";
    }
    
    const { error } = await supabase.from("matches").update(updates).eq("id", m.id);
    if (error) console.error(`❌ Error en partido ${m.id}:`, error.message);
    else console.log(`  ✅ Desvinculado partido ${m.id} (${m.match_date})`);
  }

  // 3. Agregar Deportivo Cuenca
  console.log("\n--- PASO 3: Agregar Deportivo Cuenca ---");
  
  // Verificar que no exista ya
  const { data: existingCuenca } = await supabase
    .from("clubs")
    .select("id")
    .eq("name", "Deportivo Cuenca")
    .single();
  
  if (existingCuenca) {
    console.log("⚠️ Deportivo Cuenca ya existe:", existingCuenca.id);
  } else {
    const { data: newCuenca, error: cuencaErr } = await supabase
      .from("clubs")
      .insert({
        league_id: ecLeague.id,
        name: "Deportivo Cuenca",
        logo_url: "/lions-dashboard/logos/ecuador/deportivo-cuenca.svg",
        api_team_id: 2245,
        fotmob_id: 4144,
        status: "activo",
        notes: ""
      })
      .select("id")
      .single();
    
    if (cuencaErr) console.error("❌ Error creando Deportivo Cuenca:", cuencaErr.message);
    else console.log("✅ Deportivo Cuenca creado con id:", newCuenca.id, "| fotmob_id: 4144 | api_team_id: 2245");
  }

  // 4. Verificar el resultado final
  console.log("\n--- VERIFICACIÓN FINAL ---");
  const { data: ecClubs } = await supabase
    .from("clubs")
    .select("id, name, fotmob_id, api_team_id, status")
    .eq("league_id", ecLeague.id)
    .order("name");
  
  console.log("Clubs de Ecuador:");
  ecClubs.forEach(c => console.log(`  ${c.name} | fotmob: ${c.fotmob_id} | api: ${c.api_team_id} | status: ${c.status}`));
}

fix();
