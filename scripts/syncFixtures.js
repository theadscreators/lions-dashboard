/**
 * syncFixtures.js — Sincroniza los próximos partidos desde API-Football a Supabase
 * 
 * Uso: node --env-file=.env scripts/syncFixtures.js
 * O:   npx vite-node scripts/syncFixtures.js
 * 
 * Requiere en .env:
 *   VITE_API_FOOTBALL_KEY=<tu API key>
 *   VITE_SUPABASE_URL=<url>
 *   SUPABASE_SERVICE_ROLE_KEY=<service role key>
 * 
 * Flujo:
 *   1. Lee todos los clubs con api_team_id de Supabase
 *   2. Para cada liga activa, consulta las próximas fixtures de API-Football
 *   3. Filtra solo partidos donde alguno de nuestros clubes juega de LOCAL
 *   4. Upsert en tabla 'matches' (evita duplicados por api_match_id)
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_FOOTBALL_KEY = process.env.VITE_API_FOOTBALL_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

if (!API_FOOTBALL_KEY) {
  console.error("❌ Falta VITE_API_FOOTBALL_KEY en .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  
  // Check remaining API credits
  const remaining = res.headers.get('x-ratelimit-requests-remaining');
  if (remaining) {
    console.log(`   📊 API créditos restantes: ${remaining}`);
  }

  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error("   ⚠️  API errors:", data.errors);
  }

  return data;
}

async function syncFixtures() {
  console.log("🦁 Lions Sports Media — Sync Fixtures\n");

  // 1. Get all active leagues with their api_id
  const { data: leagues, error: leaguesErr } = await supabase
    .from("leagues")
    .select("id, name, api_id, country_id, countries!inner(name)")
    .eq("active", true)
    .not("api_id", "is", null);

  if (leaguesErr) {
    console.error("Error obteniendo ligas:", leaguesErr);
    return;
  }

  console.log(`📋 Ligas activas con API ID: ${leagues.length}`);
  leagues.forEach(l => console.log(`   • ${l.name} (API ID: ${l.api_id})`));

  // 2. Get all clubs with api_team_id (our clients)
  const { data: clubs, error: clubsErr } = await supabase
    .from("clubs")
    .select("id, name, api_team_id, league_id")
    .eq("status", "activo")
    .not("api_team_id", "is", null);

  if (clubsErr) {
    console.error("Error obteniendo clubes:", clubsErr);
    return;
  }

  console.log(`\n⚽ Clubes activos con API Team ID: ${clubs.length}`);
  clubs.forEach(c => console.log(`   • ${c.name} (API Team ID: ${c.api_team_id})`));

  // Build a lookup map: api_team_id → club
  const clubByApiId = {};
  clubs.forEach(c => { clubByApiId[c.api_team_id] = c; });

  let totalInserted = 0;
  let totalSkipped = 0;

  // 3. For each league, fetch upcoming fixtures
  for (const league of leagues) {
    console.log(`\n────────────────────────────────────────`);
    console.log(`🏆 ${league.name} (API League ${league.api_id})`);

    try {
      // Get current season year
      const season = new Date().getFullYear();

      // Fetch next fixtures for this league (next 15 matches)
      const data = await apiFootball("fixtures", {
        league: league.api_id.toString(),
        season: season.toString(),
        next: "15"  // próximos 15 partidos de la liga
      });

      const fixtures = data.response || [];
      console.log(`   Encontrados: ${fixtures.length} próximos partidos`);

      for (const fixture of fixtures) {
        const homeApiId = fixture.teams.home.id;
        const awayApiId = fixture.teams.away.id;

        // Only care about matches where one of OUR clubs plays at HOME
        const homeClub = clubByApiId[homeApiId];
        if (!homeClub) continue; // Not our club as home team

        const awayClub = clubByApiId[awayApiId] || null; // Might be our club too

        const matchDate = fixture.fixture.date; // ISO 8601
        const venue = fixture.fixture.venue?.name || null;
        const city = fixture.fixture.venue?.city || null;
        const round = fixture.league.round || null;
        const apiMatchId = fixture.fixture.id;

        // Check if this match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("api_match_id", apiMatchId)
          .single();

        if (existing) {
          totalSkipped++;
          continue;
        }

        // Insert the match
        const matchData = {
          league_id: league.id,
          home_club_id: homeClub.id,
          away_club_id: awayClub?.id || null,
          away_team_name: awayClub ? null : fixture.teams.away.name,
          away_team_logo: fixture.teams.away.logo || null,
          match_date: matchDate,
          venue,
          city,
          round,
          api_match_id: apiMatchId,
          status: fixture.fixture.status?.short === "FT" ? "finished" : "scheduled",
        };

        const { error: insertErr } = await supabase.from("matches").insert(matchData);
        if (insertErr) {
          console.error(`   ❌ Error insertando: ${fixture.teams.home.name} vs ${fixture.teams.away.name}:`, insertErr.message);
        } else {
          totalInserted++;
          console.log(`   ✅ ${fixture.teams.home.name} vs ${fixture.teams.away.name} — ${new Date(matchDate).toLocaleDateString('es')} ${new Date(matchDate).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'})}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error en liga ${league.name}:`, err.message);
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`📊 Resumen:`);
  console.log(`   ✅ Insertados: ${totalInserted} partidos nuevos`);
  console.log(`   ⏭️  Omitidos (ya existían): ${totalSkipped}`);
  console.log(`════════════════════════════════════════\n`);
}

syncFixtures().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
