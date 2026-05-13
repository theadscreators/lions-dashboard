import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snjtpmtzfeqpkuxnxxjg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuanRwbXR6ZmVxcGt1eG54eGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjAwNDAsImV4cCI6MjA5MzY5NjA0MH0.wjbORdlN37rsAb0KVTdi4qTEieqc_x2zy03X-91pSSE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing countries...");
  let start = Date.now();
  let res = await supabase.from('countries').select('*').limit(1);
  console.log(`Countries: ${Date.now() - start}ms`, res.error ? res.error : "OK");

  console.log("Testing leagues...");
  start = Date.now();
  res = await supabase.from('leagues').select('*').limit(1);
  console.log(`Leagues: ${Date.now() - start}ms`, res.error ? res.error : "OK");

  console.log("Testing clubs...");
  start = Date.now();
  res = await supabase.from('clubs').select('*').limit(1);
  console.log(`Clubs: ${Date.now() - start}ms`, res.error ? res.error : "OK");

  console.log("Testing clients...");
  start = Date.now();
  res = await supabase.from('clients').select('*').limit(1);
  console.log(`Clients: ${Date.now() - start}ms`, res.error ? res.error : "OK");

  console.log("Testing auth session...");
  start = Date.now();
  res = await supabase.auth.getSession();
  console.log(`Auth Session: ${Date.now() - start}ms`, res.error ? res.error : "OK");
}

test();
