import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const API_FOOTBALL_KEY = process.env.VITE_API_FOOTBALL_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !API_FOOTBALL_KEY) {
  console.error("❌ Faltan variables en .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = "https://v3.football.api-sports.io";

async function apiFootball(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": API_FOOTBALL_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io"
    }
  });

  if (!res.ok) throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function runSync() {
  console.log("🦁 Lions Sync (via Admin Auth) 🦁\n");

  // 1. Authenticate
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  if (authError) {
    console.error("❌ Auth error:", authError.message);
    return;
  }
  console.log("✅ Authenticated as admin.");

  // 2. Clear old test matches
  console.log("🧹 Cleaning up old matches...");
  await supabase.from('match_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Get leagues
  const { data: leagues, error: leaguesErr } = await supabase
    .from("leagues")
    .select("id, name, api_id, country_id")
    .eq("active", true)
    .not("api_id", "is", null);

  if (leaguesErr) {
    console.error("Error obteniendo ligas:", leaguesErr);
    return;
  }
  console.log(`📋 Ligas activas: ${leagues.length}`);

  // 4. Get clubs
  const { data: clubs, error: clubsErr } = await supabase
    .from("clubs")
    .select("id, name, api_team_id, league_id")
    .eq("status", "activo")
    .not("api_team_id", "is", null);

  if (clubsErr) {
    console.error("Error obteniendo clubes:", clubsErr);
    return;
  }
  console.log(`⚽ Clubes activos: ${clubs.length}`);

  const clubByApiId = {};
  clubs.forEach(c => { clubByApiId[c.api_team_id] = c; });

  let totalInserted = 0;

  // 5. Fetch and Sync
  for (const league of leagues) {
    console.log(`\n🏆 Sincronizando ${league.name}...`);
    try {
      const season = new Date().getFullYear();
      const data = await apiFootball("fixtures", {
        league: league.api_id.toString(),
        season: season.toString(),
        next: "10" 
      });

      const fixtures = data.response || [];
      console.log(`   Encontrados: ${fixtures.length} partidos`);

      for (const fixture of fixtures) {
        const homeApiId = fixture.teams.home.id;
        const awayApiId = fixture.teams.away.id;
        const homeClub = clubByApiId[homeApiId];

        if (!homeClub) continue;

        const awayClub = clubByApiId[awayApiId] || null;

        const matchData = {
          league_id: league.id,
          home_club_id: homeClub.id,
          away_club_id: awayClub?.id || null,
          away_team_name: awayClub ? null : fixture.teams.away.name,
          away_team_logo: fixture.teams.away.logo || null,
          match_date: fixture.fixture.date,
          venue: fixture.fixture.venue?.name || null,
          city: fixture.fixture.venue?.city || null,
          round: fixture.league.round || null,
          api_match_id: fixture.fixture.id,
          status: "scheduled",
        };

        const { error: insErr } = await supabase.from("matches").insert(matchData);
        if (insErr) {
          console.error(`   ❌ Error: ${fixture.teams.home.name} vs ${fixture.teams.away.name}:`, insErr.message);
        } else {
          totalInserted++;
          console.log(`   ✅ ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error en liga ${league.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Sincronización completa. Partidos insertados: ${totalInserted}`);
}

runSync().catch(console.error);
