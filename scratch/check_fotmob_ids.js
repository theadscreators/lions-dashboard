// Check FotMob team IDs for Universidad Católica (Chile vs Ecuador)
const FOTMOB_BASE = "https://www.fotmob.com/api";
const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://www.fotmob.com/"
};

async function check() {
  // Check team 6458
  try {
    const res = await fetch(`${FOTMOB_BASE}/teams?id=6458`, { headers: HEADERS });
    const data = await res.json();
    console.log("=== FotMob Team 6458 ===");
    console.log("Name:", data.details?.name);
    console.log("Country:", data.details?.country);
    console.log("League:", data.overview?.table?.[0]?.data?.leagueName || "N/A");
  } catch (e) { console.error("6458 error:", e.message); }

  // Search for Universidad Católica Ecuador - common FotMob IDs
  // Let's check the Ecuador league fixtures to find the correct ID
  try {
    const res = await fetch(`${FOTMOB_BASE}/data/leagues?id=246`, { headers: HEADERS });
    const data = await res.json();
    
    let fixtures = [];
    if (data.fixtures?.allMatches) fixtures = data.fixtures.allMatches;
    else if (data.fixtures?.fixtures) fixtures = data.fixtures.fixtures;
    else if (Array.isArray(data.fixtures)) fixtures = data.fixtures;
    
    console.log("\n=== EQUIPOS EN LIGA ECUADOR (246) ===");
    const teams = new Map();
    for (const item of fixtures) {
      const matches = item.matches || [item];
      for (const m of matches) {
        if (m?.home) teams.set(m.home.id, m.home.name);
        if (m?.away) teams.set(m.away.id, m.away.name);
      }
    }
    
    // Sort and display all teams
    const sorted = [...teams.entries()].sort((a,b) => a[1].localeCompare(b[1]));
    for (const [id, name] of sorted) {
      const mark = name.toLowerCase().includes("catol") || name.toLowerCase().includes("católi") ? " ⬅️ " : "";
      const markC = name.toLowerCase().includes("cuenca") ? " ⬅️ CUENCA" : "";
      console.log(`  ${id}: ${name}${mark}${markC}`);
    }
  } catch (e) { console.error("Ecuador league error:", e.message); }

  // Also check Chile league
  try {
    const res = await fetch(`${FOTMOB_BASE}/data/leagues?id=273`, { headers: HEADERS });
    const data = await res.json();
    
    let fixtures = [];
    if (data.fixtures?.allMatches) fixtures = data.fixtures.allMatches;
    else if (data.fixtures?.fixtures) fixtures = data.fixtures.fixtures;
    else if (Array.isArray(data.fixtures)) fixtures = data.fixtures;
    
    console.log("\n=== EQUIPOS EN LIGA CHILE (273) ===");
    const teams = new Map();
    for (const item of fixtures) {
      const matches = item.matches || [item];
      for (const m of matches) {
        if (m?.home) teams.set(m.home.id, m.home.name);
        if (m?.away) teams.set(m.away.id, m.away.name);
      }
    }
    
    const sorted = [...teams.entries()].sort((a,b) => a[1].localeCompare(b[1]));
    for (const [id, name] of sorted) {
      const mark = name.toLowerCase().includes("catol") || name.toLowerCase().includes("católi") ? " ⬅️ " : "";
      console.log(`  ${id}: ${name}${mark}`);
    }
  } catch (e) { console.error("Chile league error:", e.message); }
}

check();
