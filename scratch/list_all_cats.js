async function listAllCats() {
  const res = await fetch(`https://api.sofascore.com/api/v1/sport/football/categories`, {
    headers: { "user-agent": "Mozilla/5.0" }
  });
  const data = await res.json();
  data.categories?.forEach(c => {
    console.log(`${c.name} (${c.id})`);
  });
}
listAllCats();
