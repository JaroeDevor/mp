const query = `[out:json];
(
  node["shop"](around:2000,-34.5875,-58.4240);
  node["amenity"~"cafe|restaurant|bar"](around:2000,-34.5875,-58.4240);
);
out body 20;`;

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: "data=" + encodeURIComponent(query),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'MotoProspect/1.0'
  }
}).then(res => res.json()).then(data => console.log(JSON.stringify(data).substring(0, 500))).catch(console.error);
