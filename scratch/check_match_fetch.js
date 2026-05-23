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

  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select(`
      *,
      leagues(id, name, countries(id, name, flag_emoji, code)),
      home_club:clubs!home_club_id(
        id, name, logo_url, status,
        clientes:clients(*),
        leagues(id, name, countries(id, name, flag_emoji, code))
      ),
      away_club:clubs!away_club_id(id, name, logo_url)
    `)
    .eq("id", "abba5572-50a3-430d-bbe8-64cb7d643aa2");

  if (matchesError) {
    console.error("Error fetching matches:", matchesError);
    return;
  }

  const m = matchesData[0];
  console.log("=== Match object from Supabase ===");
  console.log(JSON.stringify(m, null, 2));

  // Simulating the merge logic
  let home_club = m.home_club;
  if (home_club && home_club.clientes) {
    home_club = {
      ...home_club,
      clientes: home_club.clientes.map(cl => ({
        id: cl.id,
        categoria: cl.category,
        nombre: cl.name,
        minutos: Number(cl.minutes) || 0,
        bonificados: Number(cl.bonified) || 0
      }))
    };
  }

  console.log("\n=== Merged home_club object ===");
  console.log(JSON.stringify(home_club, null, 2));
}

run();
