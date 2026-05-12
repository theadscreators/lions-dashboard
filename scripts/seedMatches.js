import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan credenciales en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedMatches() {
  console.log("Creando partidos de prueba...");

  // 1. Obtener algunos clubes
  const { data: clubes, error: errClubs } = await supabase.from('clubs').select('id, name').in('name', ['Palestino', 'Colo-Colo', 'Emelec', 'Barcelona SC']);
  
  if (errClubs) {
    console.error("Error al obtener clubes", errClubs);
    return;
  }

  const palestino = clubes.find(c => c.name === 'Palestino');
  const coloColo = clubes.find(c => c.name === 'Colo-Colo');
  const emelec = clubes.find(c => c.name === 'Emelec');
  
  // Note: Barcelona SC might not be in the local data. Let's use whatever we have or set away_team_name.

  // 2. Insertar partidos
  const matchesToInsert = [
    {
      home_club_id: palestino?.id,
      away_club_id: coloColo?.id,
      away_team_name: coloColo ? null : 'Colo-Colo',
      match_date: new Date(Date.now() + 86400000).toISOString(), // Mañana
      venue: 'Estadio Municipal de La Cisterna',
      city: 'Santiago',
      round: 'Fecha 12',
      status: 'scheduled'
    },
    {
      home_club_id: emelec?.id,
      away_club_id: null,
      away_team_name: 'Barcelona SC',
      match_date: new Date(Date.now() + 86400000 * 3).toISOString(), // En 3 días
      venue: 'Estadio George Capwell',
      city: 'Guayaquil',
      round: 'Fecha 10',
      status: 'scheduled'
    }
  ];

  // Limpiar antes por si acaso
  await supabase.from('match_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error: errMatches } = await supabase.from('matches').insert(matchesToInsert.filter(m => m.home_club_id));

  if (errMatches) {
    console.error("Error insertando partidos:", errMatches);
  } else {
    console.log("✅ Partidos insertados con éxito.");
  }
}

seedMatches();
