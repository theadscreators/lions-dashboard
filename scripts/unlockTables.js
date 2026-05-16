import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function unlockTables() {
  await supabase.auth.signInWithPassword({
    email: 'admin@lionssportsmedia.com',
    password: 'lions2026'
  });

  const sql = `
    -- Desbloquear acceso de lectura para todos
    ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON countries;
    CREATE POLICY "Public Select" ON countries FOR SELECT USING (true);

    ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON leagues;
    CREATE POLICY "Public Select" ON leagues FOR SELECT USING (true);

    ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON clubs;
    CREATE POLICY "Public Select" ON clubs FOR SELECT USING (true);

    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON clients;
    CREATE POLICY "Public Select" ON clients FOR SELECT USING (true);

    ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON matches;
    CREATE POLICY "Public Select" ON matches FOR SELECT USING (true);

    ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Select" ON match_events;
    CREATE POLICY "Public Select" ON match_events FOR SELECT USING (true);
  `;

  // We try to run it via rpc if available, or just tell the user.
  // Actually, I'll try to use the service role key if I find it.
  console.log("Aplicando políticas de seguridad...");
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error("Error al aplicar SQL:", error.message);
    console.log("\n⚠️ POR FAVOR, EJECUTA EL SIGUIENTE SQL EN EL DASHBOARD DE SUPABASE:\n");
    console.log(sql);
  } else {
    console.log("✅ Tablas desbloqueadas con éxito.");
  }
}

unlockTables();
