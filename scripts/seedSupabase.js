import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Cargamos variables de entorno (asume que están en .env local)
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Importar la data dura - al usar Node, tenemos que transpilar o leer el archivo JS manualmente
// Como data_2026.js usa ESM (export const), para este script Node usaremos una carga dinámica si estamos en ESM,
// pero Node puede dar problemas. Para no fallar, importaremos leyendo el objeto desde un JSON 
// o asumiendo que este script se corre con vite-node / ts-node.

// Para facilitar la vida del usuario, aquí dejamos el esqueleto listo.
// Ejecutar con: npx vite-node scripts/seedSupabase.js

import { PAISES } from "../src/data/data_2026.js";

async function seed() {
  console.log("Iniciando Seed de Supabase...");

  // Limpiar DB antes de insertar (por si se corrió a la mitad)
  await supabase.from('countries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const pais of PAISES) {
    // 1. Insert Country
    const { data: cData, error: cErr } = await supabase
      .from('countries')
      .insert({ name: pais.nombre, code: pais.codigo, flag_emoji: pais.bandera, active: pais.activo })
      .select()
      .single();

    if (cErr) { console.error("Error country:", cErr); continue; }
    
    // 2. Insert League (si hay leagueId)
    if (pais.leagueId) {
      const { data: lData, error: lErr } = await supabase
        .from('leagues')
        .insert({ country_id: cData.id, name: `Primera ${pais.nombre}`, api_id: parseInt(pais.leagueId) })
        .select()
        .single();
        
      if (lErr) { console.error("Error league:", lErr); continue; }

      // 3. Insert Clubs
      for (const eq of pais.equipos) {
        const { data: clubData, error: clubErr } = await supabase
          .from('clubs')
          .insert({ 
            league_id: lData.id, 
            name: eq.nombre, 
            logo_url: eq.logo, 
            status: eq.estado, 
            notes: eq.notas 
          })
          .select()
          .single();

        if (clubErr) { console.error("Error club:", clubErr); continue; }

        // 4. Upsert Clients
        if (eq.clientes && eq.clientes.length > 0) {
          const clientsToInsert = eq.clientes.map(cl => ({
            club_id: clubData.id,
            name: cl.nombre,
            category: cl.categoria,
            minutes: cl.minutos || 0,
            bonified: cl.bonificados || 0
          }));
          
          const { error: clErr } = await supabase
            .from('clients')
            .upsert(clientsToInsert);
            
          if (clErr) console.error("Error clients para", eq.nombre, clErr);
        }
      }
    }
  }
  
  console.log("¡Seed completado!");
}

seed();
