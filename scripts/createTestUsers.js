import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [
  { email: "admin@lions.com", password: "password123", name: "Admin Test", role: "admin" },
  { email: "producer@lions.com", password: "password123", name: "Producer Test", role: "producer" },
  { email: "staff@lions.com", password: "password123", name: "Club Staff Test", role: "club_staff" },
  { email: "operator@lions.com", password: "password123", name: "Operator Test", role: "operator" }
];

async function setupTestUsers() {
  console.log("Setting up test users...");

  // Get a club to assign to staff and operator
  const { data: clubs, error: clubsError } = await supabaseAdmin.from("clubs").select("id").limit(1);
  const testClubId = clubs && clubs.length > 0 ? clubs[0].id : null;

  for (const tu of testUsers) {
    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find(u => u.email === tu.email);

    if (!user) {
      // Create user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tu.email,
        password: tu.password,
        email_confirm: true,
      });

      if (createError) {
        console.error(`Error creating ${tu.email}:`, createError);
        continue;
      }
      user = authData.user;
      console.log(`Created Auth user: ${tu.email}`);
    } else {
      console.log(`User already exists: ${tu.email}`);
    }

    // Assign role and clubs
    const profileUpdate = {
      role: tu.role,
      name: tu.name,
      active: true
    };

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (profileError) {
      console.error(`Error updating profile for ${tu.email}:`, profileError);
    } else {
      console.log(`Updated profile for ${tu.email} -> Role: ${tu.role}`);
    }

    // Update user_club_assignments if needed
    if (testClubId && (tu.role === "club_staff" || tu.role === "operator")) {
      await supabaseAdmin.from("user_club_assignments").delete().eq("user_id", user.id);
      await supabaseAdmin.from("user_club_assignments").insert({ user_id: user.id, club_id: testClubId });
    }
  }

  console.log("All test users set up successfully!");
}

setupTestUsers();
