async function findTournaments() {
  const categories = [
    { name: "Chile", id: 581 },
    { name: "Ecuador", id: 240 },
    { name: "Peru", id: 345 },
    { name: "Paraguay", id: 1018 }
  ];

  console.log("Searching Sofascore Tournaments...");
  
  for (const cat of categories) {
    try {
      const res = await fetch(`https://api.sofascore.com/api/v1/category/${cat.id}/unique-tournaments`, {
        headers: { "user-agent": "Mozilla/5.0" }
      });
      const data = await res.json();
      console.log(`\n📍 ${cat.name} (Cat ${cat.id}):`);
      data.uniqueTournaments?.forEach(t => {
        console.log(`  - ${t.name} (ID: ${t.id})`);
      });
    } catch (e) {
      console.error(`Error for ${cat.name}:`, e.message);
    }
  }
}

findTournaments();
