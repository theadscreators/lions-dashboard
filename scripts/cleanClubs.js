import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanClubs() {
  console.log("🦁 Limpiando duplicados de clubes...");
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@lionssportsmedia.com',
    password: 'lions2026'
  });

  if (authError) return console.error("Error Auth:", authError.message);

  // 1. Obtener todos los clubes y sus clientes
  const { data: clubs, error: cErr } = await supabase
    .from('clubs')
    .select('id, name, fotmob_id, clients(id)');

  if (cErr) return console.error("Error fetching clubs:", cErr);

  const duplicates = {};
  clubs.forEach(c => {
    const slug = c.name.toLowerCase().trim();
    console.log(`- Club: "${c.name}" (ID: ${c.id}, Clients: ${c.clients?.length || 0}) -> slug: "${slug}"`);
    if (!duplicates[slug]) duplicates[slug] = [];
    duplicates[slug].push(c);
  });

  for (const [name, list] of Object.entries(duplicates)) {
    if (list.length > 1) {
      console.log(`\n📍 Encontrado duplicado: ${name}`);
      
      // Encontrar el club que tiene clientes (el "bueno")
      const goodClub = list.find(c => c.clients && c.clients.length > 0);
      // Encontrar el club que tiene fotmob_id (el que creó el sync)
      const syncClub = list.find(c => c.fotmob_id);

      if (goodClub && syncClub && goodClub.id !== syncClub.id) {
        console.log(`   Viculando FotMob ID ${syncClub.fotmob_id} al club con clientes (${goodClub.id})`);
        
        // 1. Actualizar el club bueno con el fotmob_id
        await supabase.from('clubs').update({ fotmob_id: syncClub.fotmob_id }).eq('id', goodClub.id);
        
        // 2. Mover todos los partidos del club de sync al club bueno
        console.log(`   Moviendo partidos del local...`);
        await supabase.from('matches').update({ home_club_id: goodClub.id }).eq('home_club_id', syncClub.id);
        console.log(`   Moviendo partidos del visitante...`);
        await supabase.from('matches').update({ away_club_id: goodClub.id }).eq('away_club_id', syncClub.id);

        // 3. Eliminar el club de sync (el duplicado vacío)
        console.log(`   Eliminando club duplicado vacío...`);
        await supabase.from('clubs').delete().eq('id', syncClub.id);
        
        console.log(`   ✅ ¡Hecho!`);
      } else if (goodClub && !syncClub) {
        console.log(`   El club con clientes existe pero no tiene fotmob_id. Se arreglará en el próximo sync.`);
      }
    }
  }
  console.log("\n🚀 Limpieza finalizada.");
}

cleanClubs();
