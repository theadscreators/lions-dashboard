import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ────────────────────────────────────────────
// Configurá tu admin acá:
const ADMIN_EMAIL = "admin@lionssportsmedia.com";
const ADMIN_PASSWORD = "lions2026";
// ────────────────────────────────────────────

async function createAdmin() {
  console.log(`Creando usuario admin: ${ADMIN_EMAIL}...`);

  // 1. Create auth user via admin API (bypasses email confirmation)
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // skip email verification
    user_metadata: { full_name: "Admin Lions" }
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("⚠️  El usuario ya existe. Actualizando rol a admin...");
      // Find existing user
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users.find(u => u.email === ADMIN_EMAIL);
      if (existing) {
        const { error: updateErr } = await supabase
          .from("user_profiles")
          .update({ role: "admin", active: true })
          .eq("id", existing.id);
        if (updateErr) console.error("Error actualizando perfil:", updateErr);
        else console.log("✅ Rol actualizado a admin correctamente.");
      }
      return;
    }
    console.error("Error al crear usuario:", authError);
    return;
  }

  console.log("✅ Usuario creado en auth.users:", userData.user.id);

  // 2. Update role to admin in user_profiles
  // The trigger handle_new_user should have created the profile with 'producer' role
  // (because of @lionssportsmedia.com), now we upgrade it to 'admin'
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ role: "admin" })
    .eq("id", userData.user.id);

  if (profileError) {
    console.error("Error actualizando perfil:", profileError);
  } else {
    console.log("✅ Perfil actualizado a rol 'admin'.");
  }

  console.log("\n─────────────────────────────────────────");
  console.log("🦁 Login listo:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log("─────────────────────────────────────────\n");
}

createAdmin();
