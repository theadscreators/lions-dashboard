import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MAPPINGS = [
  // CHILE (API League 265)
  { name: "Palestino", id: 2361 },
  { name: "Audax Italiano", id: 2364 },
  { name: "Colo-Colo", id: 2355 },
  { name: "Everton", id: 2354 },
  { name: "O'Higgins", id: 2360 },
  { name: "Huachipato", id: 2356 },
  { name: "Cobresal", id: 2362 },
  { name: "Unión La Calera", id: 2365 },
  { name: "Ñublense", id: 2359 },
  { name: "Deportes Iquique", id: 2357 },
  { name: "Coquimbo Unido", id: 2358 },
  { name: "Universidad de Chile", id: 2368 },
  { name: "Universidad Católica", id: 2367 },
  { name: "Unión Española", id: 2366 },
  { name: "Deportes Copiapó", id: 4991 },
  
  // ECUADOR (API League 240)
  { name: "Emelec", id: 2244 },
  { name: "Barcelona SC", id: 2240 },
  { name: "LDU Quito", id: 2243 },
  { name: "Independiente del Valle", id: 2252 },
  { name: "Aucas", id: 2248 },
  { name: "El Nacional", id: 2242 },
  { name: "Universidad Católica", id: 2250 },
  { name: "Mushuc Runa", id: 2249 },
  { name: "Delfín", id: 2247 },
  { name: "Orense", id: 2251 },
  { name: "Macará", id: 2241 },
  { name: "T. Universitario", id: 2253 },
  { name: "Deportivo Cuenca", id: 2245 },
  
  // PERU (API League 345)
  { name: "Universitario", id: 2471 },
  { name: "Alianza Lima", id: 2461 },
  { name: "Sporting Cristal", id: 2470 },
  { name: "Melgar", id: 2468 },
  { name: "Cienciano", id: 2463 },
  { name: "Sport Huancayo", id: 2474 },
  { name: "Cusco FC", id: 2473 },
  { name: "Alianza Atlético Sullana", id: 2462 },
  { name: "Sport Boys", id: 2469 },
  { name: "Atlético Grau", id: 2465 },
  { name: "Comerciantes Unidos", id: 2464 },
  { name: "Deportivo Garcilaso", id: 6480 },
  { name: "Los Chankas", id: 5064 },
  { name: "ADT", id: 6479 },
  { name: "UTC", id: 2472 }
];

async function updateIds() {
  console.log("Linking clubs to API IDs...");
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  for (const map of MAPPINGS) {
    const { data: club } = await supabase.from('clubs').select('id').eq('name', map.name).single();
    if (club) {
      const { error } = await supabase.from('clubs').update({ api_team_id: map.id }).eq('id', club.id);
      if (!error) console.log(`✅ Linked ${map.name} → ${map.id}`);
      else console.error(`❌ Error linking ${map.name}:`, error.message);
    }
  }
  console.log("Done.");
}

updateIds();
