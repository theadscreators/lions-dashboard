import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  // Auth as admin to run the policy
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@lionssportsmedia.com",
    password: "lions2026"
  });
  if (authError) return console.error("Auth error:", authError.message);

  // Test anonymous read of match_events (simulating guest)
  // First, sign out to test as anon
  await supabase.auth.signOut();

  const { data, error } = await supabase
    .from("match_events")
    .select("id, match_id, event_type")
    .limit(3);

  if (error) {
    console.log("❌ match_events NOT readable anonymously:", error.message);
    console.log("\n⚠️  You need to apply migration 018_public_read_events.sql in the Supabase SQL Editor:");
    console.log("   DROP POLICY IF EXISTS \"Public anonymous read match_events\" ON match_events;");
    console.log("   CREATE POLICY \"Public anonymous read match_events\" ON match_events FOR SELECT TO public USING (true);");
  } else {
    console.log("✅ match_events readable anonymously. Sample:", data?.length, "events");
  }
}

run();
