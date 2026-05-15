async function findCategories() {
  console.log("Fetching Sofascore Categories...");
  try {
    const res = await fetch(`https://api.sofascore.com/api/v1/sport/football/categories`, {
      headers: { "user-agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    const targets = ["Chile", "Ecuador", "Peru", "Paraguay"];
    data.categories?.forEach(c => {
      if (targets.includes(c.name)) {
        console.log(`${c.name} ID: ${c.id}`);
      }
    });
  } catch (e) {
    console.error(e.message);
  }
}

findCategories();
