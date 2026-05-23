import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findClubs() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select(`
      id,
      name,
      status,
      leagues(id, name, countries(code))
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total clubs: ${clubs.length}`);
  const peruClubs = clubs.filter(c => {
    const leagues = Array.isArray(c.leagues) ? c.leagues : [c.leagues];
    return leagues.some(l => l?.countries?.code?.toLowerCase() === 'pe');
  });

  console.log(`Peru clubs:`, JSON.stringify(peruClubs, null, 2));
}

findClubs();
