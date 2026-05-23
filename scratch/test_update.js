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

  const matchId = "abba5572-50a3-430d-bbe8-64cb7d643aa2"; // Cuenca vs LDU de Quito
  const clubId = "9a16eb73-d078-4234-9083-90b5ff6d324b"; // Deportivo Cuenca

  // Try updating the clients
  console.log("--- Simulating updateClubClients ---");
  const newClients = [
    {
      nombre: "Test Client Lions",
      categoria: "LIONS",
      minutos: 5,
      bonificados: 1
    },
    {
      nombre: "Test Client Club",
      categoria: "CLUB",
      minutos: 3,
      bonificados: 0
    }
  ];

  const toInsert = newClients.map(c => ({
    club_id: clubId,
    name: c.nombre,
    category: c.categoria.toUpperCase(),
    minutes: Number(c.minutos) || 0,
    bonified: Number(c.bonificados) || 0
  }));

  const { data: insData, error: insErr } = await supabase
    .from("clients")
    .insert(toInsert)
    .select();

  if (insErr) {
    console.error("❌ Error inserting clients:", insErr);
  } else {
    console.log("✅ Successfully inserted clients:", insData);
  }

  // Try updating the match
  console.log("\n--- Simulating updateMatch ---");
  const { data: updateData, error: updateErr } = await supabase
    .from("matches")
    .update({
      gol_brand: "Test Gol Brand",
      gol_notes: "Test Gol Notes",
      operational_notes: "Test Operational Notes"
    })
    .eq("id", matchId)
    .select();

  if (updateErr) {
    console.error("❌ Error updating match:", updateErr);
  } else {
    console.log("✅ Successfully updated match:", updateData);
  }

  // Try inserting match event
  console.log("\n--- Simulating addMatchEvent ---");
  const { data: eventData, error: eventErr } = await supabase
    .from("match_events")
    .insert({
      match_id: matchId,
      event_type: 'producer_confirmed',
      actor_id: '70bd1cce-1794-4154-b160-8bdcbc881a09', // Valid user ID of admin@lionssportsmedia.com
      actor_name: "Admin Test",
      payload: {},
      notes: ""
    })
    .select();

  if (eventErr) {
    console.error("❌ Error inserting match event:", eventErr);
  } else {
    console.log("✅ Successfully inserted match event:", eventData);
  }

  // Clean up inserted clients to avoid dirtying database
  if (insData && insData.length > 0) {
    const ids = insData.map(c => c.id);
    const { error: delErr } = await supabase.from("clients").delete().in("id", ids);
    if (delErr) console.error("Error cleaning up clients:", delErr);
    else console.log("🧹 Cleaned up test clients");
  }

  // Clean up inserted event
  if (eventData && eventData.length > 0) {
    const ids = eventData.map(e => e.id);
    const { error: delErr } = await supabase.from("match_events").delete().in("id", ids);
    if (delErr) console.error("Error cleaning up events:", delErr);
    else console.log("🧹 Cleaned up test events");
  }
}

run();
