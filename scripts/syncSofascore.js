import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ Faltan variables de entorno en .env (VITE_SUPABASE_URL)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const SOFASCORE_BASE = "https://www.sofascore.com/api/v1";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://www.sofascore.com/"
};

async function syncSofascore() {
  console.log("🦁 Lions Dashboard — Sincronización con Sofascore 🦁\n");

  // 1. Authenticate as admin
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  if (authError) {
    console.error("❌ Auth error:", authError.message);
    return;
  }
  console.log("✅ Autenticado como Admin.");

  // 1. Obtener ligas con sofascore_id
  const { data: leagues, error: lErr } = await supabase
    .from("leagues")
    .select("id, name, sofascore_id")
    .not("sofascore_id", "is", null);

  if (lErr) return console.error("Error ligas:", lErr);

  // 2. Obtener clubes
  const { data: clubs, error: cErr } = await supabase
    .from("clubs")
    .select("id, name, sofascore_id");

  if (cErr) return console.error("Error clubes:", cErr);

  const clubBySofascoreId = {};
  const clubByName = {};
  clubs.forEach(c => {
    if (c.sofascore_id) clubBySofascoreId[c.sofascore_id] = c;
    clubByName[c.name.toLowerCase()] = c;
  });

  for (const league of leagues) {
    console.log(`\n🏆 ${league.name} (ID: ${league.sofascore_id})`);
    try {
      const url = `${SOFASCORE_BASE}/unique-tournament/${league.sofascore_id}/events/next`;
      const res = await fetch(url, { headers: HEADERS });
      
      if (!res.ok) {
        console.error(`   ❌ Error API Sofascore: ${res.status}`);
        continue;
      }

      const { events } = await res.json();
      console.log(`   Encontrados ${events?.length || 0} partidos próximos.`);

      for (const event of events) {
        const homeId = event.homeTeam.id;
        const awayId = event.awayTeam.id;
        const homeName = event.homeTeam.name;
        const awayName = event.awayTeam.name;
        
        // Intentar matchear club local por ID o por Nombre
        let homeClub = clubBySofascoreId[homeId] || clubByName[homeName.toLowerCase()];
        
        // Si no lo tenemos mapeado pero es uno de nuestros clubes (mismo nombre), lo guardamos
        if (!homeClub) {
           // Intento de match difuso o parcial si es necesario, por ahora exacto
           continue; 
        }

        // Si encontramos el club pero no tenía el sofascore_id, lo actualizamos ahora
        if (!homeClub.sofascore_id) {
          await supabase.from("clubs").update({ sofascore_id: homeId }).eq("id", homeClub.id);
          homeClub.sofascore_id = homeId;
          clubBySofascoreId[homeId] = homeClub;
          console.log(`   🔗 Vinculado ${homeClub.name} a ID ${homeId}`);
        }

        const awayClub = clubBySofascoreId[awayId] || clubByName[awayName.toLowerCase()] || null;
        
        const matchDate = new Date(event.startTimestamp * 1000).toISOString();
        const stadium = event.venue?.stadium?.name || null;
        const round = event.roundInfo?.round || null;

        const matchData = {
          league_id: league.id,
          home_club_id: homeClub.id,
          away_club_id: awayClub?.id || null,
          away_team_name: awayClub ? null : awayName,
          away_team_logo: `https://api.sofascore.app/api/v1/team/${awayId}/image`,
          match_date: matchDate,
          stadium_name: stadium,
          round: round?.toString(),
          api_match_id: event.id, // Usamos el ID de Sofascore como api_match_id
          status: "scheduled"
        };

        // Verificar si ya existe para ver si cambió el estadio
        const { data: existing } = await supabase
          .from("matches")
          .select("id, stadium_name, operational_notes")
          .eq("api_match_id", event.id)
          .single();

        if (existing) {
          let updates = { match_date: matchData.match_date };
          if (stadium && existing.stadium_name !== stadium) {
             updates.stadium_name = stadium;
             updates.operational_notes = (existing.operational_notes || "") + `\nOjo: El estadio cambió a ${stadium}`;
             console.log(`   ⚠️  Cambio de estadio detectado para ${homeName} vs ${awayName}`);
          }
          await supabase.from("matches").update(updates).eq("id", existing.id);
        } else {
          const { error: insErr } = await supabase.from("matches").insert(matchData);
          if (insErr) console.error(`   ❌ Error insertando:`, insErr.message);
          else console.log(`   ✅ Sincronizado: ${homeName} vs ${awayName} (${stadium || 'Sin estadio'})`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Error en liga:`, err.message);
    }
  }
  console.log("\n✅ Sincronización finalizada.");
}

syncSofascore();
