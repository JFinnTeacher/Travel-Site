// County map: draws the 32 counties on a Leaflet map, shades the visited ones,
// and lets you tap a county to mark it visited (saved through api/counties.php).

const STYLE = {
  base: { color: '#8fb3e0', weight: 1, fillColor: '#dce8f7', fillOpacity: 0.45 },
  visited: { color: '#1859b0', weight: 1, fillColor: '#1e6fd9', fillOpacity: 0.55 },
  hover: { weight: 2.5, color: '#1859b0' },
  selected: { weight: 3.5, color: '#0d3d80' },
};

const map = L.map('map', { zoomSnap: 0.25, minZoom: 6 });
// Standard OpenStreetMap tiles (free, no key). app.css fades them to a light grey.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let visits = {};     // { cork: { visited: true, updated: '2026-10-16' }, ... }
let selected = null; // the Leaflet layer of the county being shown in the sheet
let countiesLayer;

const $ = (id) => document.getElementById(id);

function isVisited(id) {
  return Boolean(visits[id] && visits[id].visited);
}

function styleFor(layer) {
  const id = layer.feature.properties.id;
  return {
    ...(isVisited(id) ? STYLE.visited : STYLE.base),
    ...(layer === selected ? STYLE.selected : {}),
  };
}

function restyleAll() {
  countiesLayer.eachLayer((layer) => layer.setStyle(styleFor(layer)));
  const n = Object.values(visits).filter((v) => v.visited).length;
  $('count').textContent = `${n} of 32 visited`;
  $('count').hidden = false;
}

function showMessage(text) {
  $('message').textContent = text;
  $('message').hidden = !text;
}

// ---- County details sheet ----

function openSheet(layer) {
  const previous = selected;
  selected = layer;
  if (previous) previous.setStyle(styleFor(previous));
  layer.setStyle(styleFor(layer));
  layer.bringToFront();

  const { id, name, province } = layer.feature.properties;
  $('sheet-name').textContent = `County ${name}`;
  $('sheet-province').textContent = province;
  const v = visits[id];
  $('sheet-status').textContent = isVisited(id) ? `Visited · marked ${v.updated}` : 'Not visited yet';
  const toggle = $('sheet-toggle');
  toggle.textContent = isVisited(id) ? 'Mark as not visited' : 'Mark as visited';
  toggle.className = isVisited(id) ? 'button outlined' : 'button';
  toggle.disabled = false;
  $('sheet').hidden = false;
}

function closeSheet() {
  const previous = selected;
  selected = null;
  if (previous) previous.setStyle(styleFor(previous));
  $('sheet').hidden = true;
}

$('sheet-close').addEventListener('click', closeSheet);
map.on('click', closeSheet); // tapping the sea closes the sheet

$('sheet-toggle').addEventListener('click', async () => {
  const layer = selected;
  const id = layer.feature.properties.id;
  $('sheet-toggle').disabled = true;
  try {
    const res = await fetch('api/counties.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county: id, visited: !isVisited(id) }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    visits = body.counties;
    showMessage('');
  } catch (err) {
    showMessage(`Couldn't save: ${err.message}`);
  }
  restyleAll();
  if (selected === layer) openSheet(layer);
});

// ---- Load everything ----

async function loadVisits() {
  try {
    const res = await fetch('api/counties.php');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    visits = body.counties;
  } catch (err) {
    // The map still works without saved data (e.g. when testing without PHP)
    showMessage(`Couldn't load saved visits: ${err.message}`);
  }
}

async function init() {
  const [geo] = await Promise.all([
    fetch('assets/counties.geojson').then((r) => r.json()),
    loadVisits(),
  ]);

  countiesLayer = L.geoJSON(geo, {
    style: (feature) => (isVisited(feature.properties.id) ? STYLE.visited : STYLE.base),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.name, {
        permanent: true, direction: 'center', className: 'county-label',
      });
      layer.on({
        click: (e) => { L.DomEvent.stopPropagation(e); openSheet(layer); },
        mouseover: () => { if (layer !== selected) layer.setStyle(STYLE.hover); },
        mouseout: () => layer.setStyle(styleFor(layer)),
      });
    },
  }).addTo(map);

  const bounds = countiesLayer.getBounds();
  map.fitBounds(bounds, { padding: [8, 8] });
  map.setMaxBounds(bounds.pad(0.5));
  restyleAll();

  // Labels get cramped when zoomed out on a phone, so only show them from zoom 7 up
  const updateLabels = () => map.getContainer().classList.toggle('hide-labels', map.getZoom() < 7);
  map.on('zoomend', updateLabels);
  updateLabels();
}

init().catch((err) => showMessage(`Couldn't load the map: ${err.message}`));
