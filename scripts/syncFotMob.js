import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error("❌ Faltan variables de entorno en .env (VITE_SUPABASE_URL)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FOTMOB_BASE = "https://www.fotmob.com/api";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://www.fotmob.com/"
};

async function syncFotMob() {
  console.log("🦁 Lions Dashboard — Sincronización con FotMob 🦁\n");

  // 1. Authenticate if using anon key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "admin@lionssportsmedia.com",
      password: "lions2026"
    });
    if (authError) return console.error("❌ Auth error:", authError.message);
    console.log("✅ Autenticado como Admin.");
  }

  // 2. Obtener ligas con fotmob_id
  const { data: leagues, error: lErr } = await supabase
    .from("leagues")
    .select("id, name, fotmob_id")
    .not("fotmob_id", "is", null);

  if (lErr) return console.error("Error ligas:", lErr);

  // 3. Obtener clubes para vinculación
  const { data: clubs, error: cErr } = await supabase
    .from("clubs")
    .select("id, name, fotmob_id");

  if (cErr) return console.error("Error clubes:", cErr);

  const clubByFotMobId = {};
  const clubByName = {};
  const clubBySlug = {};

  const slugify = (text) => {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/^(u\.|dep\.|c\.d\.|club|universidad de|deportivo|sporting|atletico|real)\s+/i, "") // Remove common prefixes
      .replace(/[^a-z0-9]/g, "");
  };

  clubs.forEach(c => {
    if (c.fotmob_id) clubByFotMobId[c.fotmob_id] = c;
    clubByName[c.name.toLowerCase()] = c;
    clubBySlug[slugify(c.name)] = c;
  });

  for (const league of leagues) {
    console.log(`\n🏆 ${league.name} (FotMob ID: ${league.fotmob_id})`);
    try {
      const url = `${FOTMOB_BASE}/data/leagues?id=${league.fotmob_id}`;
      const res = await fetch(url, { headers: HEADERS });
      
      if (!res.ok) {
        console.error(`   ❌ Error API FotMob: ${res.status}`);
        continue;
      }

      const data = await res.json();
      
      // DEBUG: Ver qué nos devuelve FotMob exactamente
      console.log(`🔍 [DEBUG] Estructura de la liga ${league.name}:`, Object.keys(data).join(", "));
      
      // Intentar encontrar los partidos en las distintas estructuras de FotMob
      let fixtures = [];
      
      if (data.fixtures) {
        console.log(`🔍 [DEBUG] Contenido de fixtures (${league.name}):`, typeof data.fixtures === 'object' ? Object.keys(data.fixtures).join(", ") : "es un string/otro");
        
        if (Array.isArray(data.fixtures)) {
          fixtures = data.fixtures;
        } else if (data.fixtures.allMatches && Array.isArray(data.fixtures.allMatches)) {
          fixtures = data.fixtures.allMatches;
        } else if (data.fixtures.fixtures && Array.isArray(data.fixtures.fixtures)) {
          fixtures = data.fixtures.fixtures;
        }
      }

      if (fixtures.length === 0 && data.overview && data.overview.fixtures) {
        fixtures = data.overview.fixtures;
      }
      
      console.log(`   Encontrados ${fixtures.length} elementos de agenda.`);

      let synced = 0;
      for (const item of fixtures) {
        // FotMob a veces agrupa por fechas (item.matches) y a veces es una lista plana
        const matchesInGroup = item.matches || [item]; 
        
        for (const match of matchesInGroup) {
          if (!match || !match.home || !match.away) continue;

          const homeId = match.home.id;
          const awayId = match.away.id;
          const homeName = match.home.name;
          const awayName = match.away.name;
        
        // Vincular club local con mapeo manual para casos ambiguos
        const manualMap = {
          "limache": "Dep. Limache",
          "u. catolica": "Universidad Catolica",
          "universidad de concepcion": "Universidad de Concepcion",
          "u. de concepcion": "Universidad de Concepcion",
          "univ. concepcion": "Universidad de Concepcion"
        };

        const searchName = homeName.toLowerCase().trim();
        let homeClub = clubByFotMobId[homeId];

        if (!homeClub) {
          const mappedName = manualMap[searchName];
          if (mappedName) {
            homeClub = clubByName[mappedName.toLowerCase()];
          }
        }

        if (!homeClub) {
          // Búsqueda por slug pero evitando el error de Concepción
          const slug = slugify(homeName);
          if (slug === 'concepcion') {
             // Si el nombre original contiene "Universidad", forzar U de Conce
             if (homeName.toLowerCase().includes('universidad') || homeName.toLowerCase().includes('u.')) {
               homeClub = clubByName['universidad de concepcion'];
             } else {
               homeClub = clubByName['deportes concepcion'];
             }
          } else {
            homeClub = clubBySlug[slug];
          }
        }
        
        if (homeClub && !homeClub.fotmob_id) {
          await supabase.from("clubs").update({ fotmob_id: homeId }).eq("id", homeClub.id);
          homeClub.fotmob_id = homeId;
          clubByFotMobId[homeId] = homeClub;
        }

        // Vincular club visitante (si existe en nuestra DB)
        let awayClub = clubByFotMobId[awayId] || clubByName[awayName.toLowerCase()] || clubBySlug[slugify(awayName)];
        if (awayClub && !awayClub.fotmob_id) {
            await supabase.from("clubs").update({ fotmob_id: awayId }).eq("id", awayClub.id);
            awayClub.fotmob_id = awayId;
            clubByFotMobId[awayId] = awayClub;
        }

        const matchDate = (match.status?.utcTime || match.utcTime) ? new Date(match.status?.utcTime || match.utcTime).toISOString() : new Date().toISOString();
        const stadium = match.venue?.name || match.stadium?.name || null;
        
        const matchData = {
          league_id: league.id,
          home_club_id: homeClub?.id || null, 
          away_club_id: awayClub?.id || null,
          home_team_name: homeClub ? null : homeName,
          home_team_logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${homeId}.png`,
          away_team_name: awayClub ? null : awayName,
          away_team_logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${awayId}.png`,
          match_date: matchDate,
          stadium_name: stadium,
          round: match.roundText || match.round || null,
          api_match_id: match.id.toString(),
          status: "scheduled"
        };

        // Upsert
        const { error: upsertErr } = await supabase
          .from("matches")
          .upsert(matchData, { onConflict: 'api_match_id' });

          if (upsertErr) {
            console.error(`   ❌ Error en ${homeName} vs ${awayName}:`, upsertErr.message);
          } else {
            synced++;
          }
        }
      }
      console.log(`   ✅ Sincronizados ${synced} partidos.`);
    } catch (err) {
      console.error(`   ❌ Error en liga:`, err.message);
    }
  }
  console.log("\n🚀 Sincronización FotMob finalizada.");
}

syncFotMob();
