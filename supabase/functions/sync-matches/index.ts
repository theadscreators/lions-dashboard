import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Esta función se ejecuta diariamente vía Supabase Cron
// Busca partidos futuros para nuestros equipos donde jueguen de LOCAL

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SPORTS_API_KEY = Deno.env.get("SPORTS_API_KEY") || "3"; // '3' suele ser la key por defecto/patreon de TheSportsDB

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    console.log("Iniciando sincronización de partidos...");

    // 1. Obtener clubes activos que tengan un ID de API configurado
    const { data: clubs, error: clubsError } = await supabase
      .from("clubs")
      .select("id, name, api_team_id, league_id")
      .eq("status", "activo")
      .not("api_team_id", "is", null);

    if (clubsError) throw clubsError;
    console.log(`Encontrados ${clubs?.length} clubes activos con API ID.`);

    let insertedCount = 0;

    // 2. Por cada club, buscar sus próximos partidos
    for (const club of clubs) {
      // Usamos TheSportsDB endpoint: eventsnext.php (Próximos 5 eventos del equipo)
      // Si la API es otra, solo hay que cambiar la URL y el parseo del JSON
      const apiUrl = `https://www.thesportsdb.com/api/v1/json/${SPORTS_API_KEY}/eventsnext.php?id=${club.api_team_id}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`Error fetch para club ${club.name}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const events = data.events || [];

      for (const event of events) {
        // Filtrar SOLO los partidos donde nuestro club juega de LOCAL (idHomeTeam)
        if (event.idHomeTeam !== club.api_team_id.toString()) {
          continue; 
        }

        const matchDate = `${event.dateEvent}T${event.strTimeLocal || event.strTime || '00:00:00'}`;
        
        // 3. Upsert en la base de datos (evitar duplicados usando un api_match_id si lo tuviéramos, 
        // o buscando por fecha y club local)
        const matchData = {
          home_club_id: club.id,
          away_team_name: event.strAwayTeam,
          away_team_logo: event.strAwayTeamBadge || null, // Algunos endpoints traen el logo rival
          match_date: matchDate,
          venue: event.strVenue || null,
          round: event.intRound ? `Fecha ${event.intRound}` : null,
          current_status: 'scheduled',
          league_id: club.league_id
        };

        // Verificamos si ya existe para no duplicar (basado en club local y rival aprox en +- 3 días)
        // Por simplicidad, usamos la fecha exacta y el club local
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("home_club_id", club.id)
          .eq("away_team_name", event.strAwayTeam)
          .gte("match_date", `${event.dateEvent}T00:00:00`)
          .lte("match_date", `${event.dateEvent}T23:59:59`)
          .single();

        if (!existingMatch) {
          const { error: insertError } = await supabase.from("matches").insert(matchData);
          if (insertError) {
            console.error(`Error insertando partido ${event.strEvent}:`, insertError);
          } else {
            insertedCount++;
            console.log(`Nuevo partido programado: ${event.strEvent}`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, inserted: insertedCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error en sync-matches:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
