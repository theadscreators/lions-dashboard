import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  console.error("   Agregá SUPABASE_SERVICE_ROLE_KEY=<tu service role key> al archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ────────────────────────────────────────────
// Productores reales de Lions Sports Media
// El trigger handle_new_user les asigna role 'producer'
// automáticamente por tener @lionssportsmedia.com
// ────────────────────────────────────────────
const producers = [
  { email: "cristian@lionssportsmedia.com",        name: "Cristian Ciarrocca" },
  { email: "martinrey@lionssportsmedia.com",       name: "Martin Rey" },
  { email: "ezequiellauria@lionssportsmedia.com",  name: "Ezequiel Lauria" },
  { email: "ramiro@lionssportsmedia.com",          name: "Ramiro Schon" },
  { email: "danieltamborini@lionssportsmedia.com", name: "Daniel Tamborini" },
  { email: "javiera@lionssportsmedia.com",         name: "Javiera Villalobos" },
  { email: "fgamiz@lionssportsmedia.com",          name: "Federico Gamiz" },
];

const DEFAULT_PASSWORD = "lions2026";

async function createProducers() {
  console.log("🦁 Creando usuarios productores de Lions Sports Media...\n");

  for (const producer of producers) {
    try {
      // Check if user already exists
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find(u => u.email === producer.email);

      if (existing) {
        console.log(`⚠️  ${producer.email} ya existe (ID: ${existing.id})`);
        
        // Make sure profile has correct role and name
        const { error: updateErr } = await supabase
          .from("user_profiles")
          .update({ role: "producer", name: producer.name, active: true })
          .eq("id", existing.id);

        if (updateErr) {
          console.error(`   Error actualizando perfil: ${updateErr.message}`);
        } else {
          console.log(`   ✅ Perfil actualizado → role: producer`);
        }
        continue;
      }

      // Create new auth user (email_confirm: true to skip verification)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: producer.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: producer.name }
      });

      if (authError) {
        console.error(`❌ Error creando ${producer.email}: ${authError.message}`);
        continue;
      }

      console.log(`✅ ${producer.name} <${producer.email}>`);
      console.log(`   ID: ${authData.user.id}`);
      console.log(`   Role: producer (auto-asignado por trigger)`);

      // The handle_new_user trigger should have auto-created the profile with role='producer'
      // because the email ends in @lionssportsmedia.com.
      // But let's update the name just in case the trigger used the email as name.
      await supabase
        .from("user_profiles")
        .update({ name: producer.name })
        .eq("id", authData.user.id);

    } catch (err) {
      console.error(`❌ Error inesperado con ${producer.email}:`, err.message);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log("🦁 Resumen de acceso:");
  console.log("   Password para todos: " + DEFAULT_PASSWORD);
  console.log("   Los productores pueden iniciar sesión inmediatamente.");
  console.log("─────────────────────────────────────────\n");

  // Also make sure admin exists
  console.log("Verificando admin@lionssportsmedia.com...");
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
  const admin = allUsers.find(u => u.email === "admin@lionssportsmedia.com");
  if (admin) {
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", admin.id)
      .single();
    console.log(`✅ Admin encontrado: ${admin.email} (role: ${profileData?.role})`);
    if (profileData?.role !== 'admin') {
      await supabase.from("user_profiles").update({ role: "admin" }).eq("id", admin.id);
      console.log("   → Rol actualizado a 'admin'");
    }
  } else {
    console.log("⚠️  admin@lionssportsmedia.com no existe. Ejecutá 'node scripts/createAdmin.js' primero.");
  }
}

createProducers();
