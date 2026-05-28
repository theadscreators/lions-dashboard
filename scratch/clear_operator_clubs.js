import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  // Buscar el perfil del operador por email
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, name, role, user_club_assignments(club_id)")
    .eq("email", "operator@lions.com")
    .single();

  if (profileError || !profile) {
    return console.error("No se encontró el perfil del operador:", profileError?.message);
  }

  console.log(`Perfil encontrado: ${profile.name} (${profile.role})`);
  console.log(`Clubs asignados actualmente: ${profile.user_club_assignments?.length || 0}`);

  if (profile.user_club_assignments?.length === 0) {
    return console.log("✅ El operador ya no tiene clubs asignados. Nada que hacer.");
  }

  // Eliminar todas las asignaciones
  const { error: deleteError } = await supabase
    .from("user_club_assignments")
    .delete()
    .eq("user_id", profile.id);

  if (deleteError) {
    console.error("❌ Error eliminando asignaciones:", deleteError.message);
  } else {
    console.log("✅ Todas las asignaciones de club eliminadas para operator@lions.com");
  }
}

run();
