// County map: draws the 32 counties on a Leaflet map, coloured by how far each person's
// plan has got, and lets you tap a county to edit the plans (saved through api/counties.php).

// The colour categories, in order. statusOf() picks one for each county; the legend is built from this list.
const STATUSES = [
  { key: 'none', label: 'Nothing planned', fill: '#dce8f7', opacity: 0.45 },
  { key: 'one-chosen', label: 'One chosen', fill: '#9cc2f0', opacity: 0.7 },
  { key: 'both-chosen', label: 'Both chosen', fill: '#3b82e0', opacity: 0.7 },
  { key: 'one-done', label: 'One done', fill: '#6fcfc0', opacity: 0.75 },
  { key: 'both-done', label: 'Both done', fill: '#00796b', opacity: 0.75 },
];

const STYLE = {
  base: { color: '#8fb3e0', weight: 1 },
  hover: { weight: 2.5, color: '#1859b0' },
  selected: { weight: 3.5, color: '#0d3d80' },
};

const map = L.map('map', { zoomSnap: 0.25, minZoom: 6 });
// Standard OpenStreetMap tiles (free, no key). app.css fades them to a light grey.
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let counties = {};   // { cork: { user1: { suggestion: '…', done: true, done_on: '2026-10-16' } }, ... }
let pins = [];       // [{ id, county, name, note, lat, lng, added }, ...]
let selected = null; // the Leaflet layer of the county being shown in the sheet
let countiesLayer;
const pinsLayer = L.layerGroup().addTo(map);

const $ = (id) => document.getElementById(id);

// The people boxes in the sheet (names come from the admin page)
const PEOPLE = [...document.querySelectorAll('.person')].map((el) => el.dataset.person);
const personEl = (person) => document.querySelector(`.person[data-person="${person}"]`);
const textOf = (person) => personEl(person).querySelector('textarea');
const checkOf = (person) => personEl(person).querySelector('input[type=checkbox]');

// One person's plan for a county: { suggestion: '…', done: true, done_on: '2026-10-16' }
function planOf(id, person) {
  return (counties[id] && counties[id][person]) || {};
}

// Which colour category a county is in. Done counts over chosen; ticking Done also counts as chosen.
function statusOf(id) {
  const plans = PEOPLE.map((person) => planOf(id, person));
  const done = plans.filter((p) => p.done).length;
  const chosen = plans.filter((p) => p.suggestion || p.done).length;
  let key = 'none';
  if (done === PEOPLE.length) key = 'both-done';
  else if (done > 0) key = 'one-done';
  else if (chosen === PEOPLE.length) key = 'both-chosen';
  else if (chosen > 0) key = 'one-chosen';
  return STATUSES.find((s) => s.key === key);
}

function styleFor(layer) {
  const status = statusOf(layer.feature.properties.id);
  return {
    ...STYLE.base,
    fillColor: status.fill,
    fillOpacity: status.opacity,
    ...(layer === selected ? STYLE.selected : {}),
  };
}

function restyleAll() {
  countiesLayer.eachLayer((layer) => layer.setStyle(styleFor(layer)));
  const n = countiesLayer.getLayers().filter((l) => statusOf(l.feature.properties.id).key === 'both-done').length;
  $('count').textContent = `${n} of 32 done`;
  $('count').hidden = false;
}

function swatch(status) {
  const el = document.createElement('i');
  el.className = 'swatch';
  el.style.background = status.fill;
  return el;
}

function buildLegend() {
  const counties = STATUSES.map((status) => {
    const item = document.createElement('span');
    item.append(swatch(status), status.label);
    return item;
  });
  // Pin colours: one per person, plus one for places for both
  const pinKeys = ['', ...PEOPLE].map((who) => {
    const item = document.createElement('span');
    const mark = swatch({ fill: PIN_COLOURS[who] });
    mark.classList.add('pin-swatch');
    item.append(mark, who ? `${whoName(who)}'s places` : 'Shared places');
    return item;
  });
  const br = document.createElement('span');
  br.className = 'legend-break';
  $('legend').replaceChildren(...counties, br, ...pinKeys);
}

function showMessage(text) {
  $('message').textContent = text;
  $('message').hidden = !text;
}

// Send changes for one county, e.g. { county: 'cork', people: { user1: { suggestion: '…', done: true } } }
async function saveCounty(changes) {
  try {
    const res = await fetch('api/counties.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    counties = body.counties;
    showMessage('');
  } catch (err) {
    showMessage(`Couldn't save: ${err.message}`);
  }
  restyleAll();
  if (selected) renderSheet();
}

// ---- County details sheet ----

// Suggestion boxes whose text differs from what's saved for the selected county: { user1: { suggestion: '…' } }
function editedSuggestions() {
  const id = selected.feature.properties.id;
  const people = {};
  PEOPLE.forEach((person) => {
    const text = textOf(person).value;
    if (text.trim() !== (planOf(id, person).suggestion || '')) people[person] = { suggestion: text };
  });
  return people;
}

// Save any edited suggestion boxes for the selected county
function saveSuggestions() {
  const people = editedSuggestions();
  if (!Object.keys(people).length) return;
  saveCounty({ county: selected.feature.properties.id, people });
}

function openSheet(layer) {
  const previous = selected;
  if (previous === layer) return;
  if (previous) saveSuggestions(); // don't lose unsaved typing
  closePlaceForm();
  selected = layer;
  if (previous) previous.setStyle(styleFor(previous));
  layer.setStyle(styleFor(layer));
  layer.bringToFront();

  PEOPLE.forEach((person) => { textOf(person).value = planOf(layer.feature.properties.id, person).suggestion || ''; });
  renderSheet();
  $('sheet').hidden = false;
}

// Refresh the sheet's text and buttons for the selected county (leaves the suggestion boxes alone)
function renderSheet() {
  const { id, name, province } = selected.feature.properties;
  $('sheet-name').textContent = `County ${name}`;
  $('sheet-province').textContent = province;
  const status = statusOf(id);
  $('sheet-status').replaceChildren(swatch(status), status.label);
  PEOPLE.forEach((person) => {
    const plan = planOf(id, person);
    checkOf(person).checked = Boolean(plan.done);
    checkOf(person).disabled = false;
    checkOf(person).parentElement.title = plan.done ? `Done ${plan.done_on}` : '';
  });
  updateSaveButton();
  renderPlaceList();
}

function updateSaveButton() {
  const changed = Object.keys(editedSuggestions()).length > 0;
  $('sheet-save').disabled = !changed;
  $('sheet-save').textContent = changed ? 'Save suggestions' : 'Saved';
}

function closeSheet() {
  const previous = selected;
  if (!previous) return;
  saveSuggestions();
  closePlaceForm();
  selected = null;
  previous.setStyle(styleFor(previous));
  $('sheet').hidden = true;
}

$('sheet-close').addEventListener('click', closeSheet);
// Tapping the sea closes the sheet, unless we're picking a pin location
map.on('click', (e) => (picking ? pickLocation(e.latlng) : closeSheet()));

PEOPLE.forEach((person) => {
  textOf(person).addEventListener('input', updateSaveButton);
  // Ticking "Done" saves straight away, along with any edited suggestions
  checkOf(person).addEventListener('change', () => {
    const people = editedSuggestions();
    people[person] = { ...people[person], done: checkOf(person).checked };
    checkOf(person).disabled = true;
    saveCounty({ county: selected.feature.properties.id, people });
  });
});

$('sheet-save').addEventListener('click', () => {
  $('sheet-save').disabled = true;
  saveSuggestions();
});

// ---- Pins (places marked on the map) ----

let draft = null;          // the place being added or edited: { id?, name, note, who, lat, lng, county }
let draftMarker = null;    // its marker on the map while the form is open
let picking = false;       // true while waiting for a tap on the map to place the pin

// Pin colour by who the place is for: '' = both, otherwise a person id
const PIN_COLOURS = { '': '#0d3d80', user1: '#7e57c2', user2: '#d81b60' };
const whoName = (who) => (who ? personEl(who).dataset.name : 'Both');

function pinIcon(who = '', extraClass = '') {
  return L.divIcon({
    className: `pin ${extraClass}`, html: `<span style="background:${PIN_COLOURS[who] || PIN_COLOURS['']}"></span>`,
    iconSize: [24, 24], iconAnchor: [12, 26], popupAnchor: [0, -24],
  });
}

// A small coloured label showing who a place is for
function whoTag(who) {
  const tag = document.createElement('span');
  tag.className = 'who-tag';
  tag.style.background = PIN_COLOURS[who || ''];
  tag.textContent = whoName(who || '');
  return tag;
}

const layerFor = (countyId) => countiesLayer.getLayers().find((l) => l.feature.properties.id === countyId);
const countyName = (countyId) => layerFor(countyId).feature.properties.name;

// Which county layer a point is inside (null for the sea). GeoJSON points are [lng, lat].
function countyAt(latlng) {
  const pt = [latlng.lng, latlng.lat];
  const inRing = (ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const inPolygon = (rings) => inRing(rings[0]) && !rings.slice(1).some(inRing);
  return countiesLayer.getLayers().find((layer) => {
    const g = layer.feature.geometry;
    return (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some(inPolygon);
  }) || null;
}

function popupFor(pin) {
  const el = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = pin.name;
  const where = document.createElement('div');
  where.className = 'popup-county';
  where.textContent = `County ${countyName(pin.county)} `;
  where.append(whoTag(pin.who));
  el.append(title, where);
  if (pin.note) {
    const note = document.createElement('p');
    note.textContent = pin.note;
    el.append(note);
  }
  return el;
}

function renderPins() {
  pinsLayer.clearLayers();
  pins.forEach((pin) => {
    const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin.who), title: pin.name })
      .bindPopup(() => popupFor(pin))
      .addTo(pinsLayer);
    pin.marker = marker;
  });
}

// The list of places in the open county's sheet
function renderPlaceList() {
  const id = selected.feature.properties.id;
  const items = pins.filter((pin) => pin.county === id).map((pin) => {
    const li = document.createElement('li');
    const show = document.createElement('button');
    show.className = 'place-name';
    show.textContent = pin.name;
    show.title = 'Show on map';
    show.addEventListener('click', () => {
      map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 11));
      pin.marker.openPopup();
    });
    const edit = document.createElement('button');
    edit.className = 'text-button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => openPlaceForm(pin));
    const del = document.createElement('button');
    del.className = 'text-button danger';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (confirm(`Delete "${pin.name}"?`)) savePins({ action: 'delete', id: pin.id });
    });
    li.append(show, whoTag(pin.who), edit, del);
    if (pin.note) {
      const note = document.createElement('p');
      note.textContent = pin.note;
      li.append(note);
    }
    return li;
  });
  if (!items.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No places pinned yet';
    items.push(empty);
  }
  $('place-list').replaceChildren(...items);
}

async function savePins(request) {
  try {
    const res = await fetch('api/pins.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    pins = body.pins;
    showMessage('');
    renderPins();
    return true;
  } catch (err) {
    showMessage(`Couldn't save the place: ${err.message}`);
    return false;
  } finally {
    if (selected) renderPlaceList();
  }
}

// Open the add/edit form; pass a pin to edit it, or nothing to add a new one
function openPlaceForm(pin = null) {
  closePlaceForm();
  draft = pin ? { id: pin.id, lat: pin.lat, lng: pin.lng, county: pin.county } : {};
  $('place-name').value = pin ? pin.name : '';
  $('place-note').value = pin ? pin.note : '';
  setWho(pin ? pin.who || '' : '');
  $('place-save').textContent = pin ? 'Save changes' : 'Save place';
  if (pin) setDraftLocation(L.latLng(pin.lat, pin.lng), layerFor(pin.county));
  else updateWhere();
  $('place-form').hidden = false;
  $('place-add').hidden = true;
  $('place-name').focus();
}

// The "For" choice in the form: '' for both, or a person id
const whoRadios = () => [...document.querySelectorAll('input[name=place-who]')];
const getWho = () => whoRadios().find((r) => r.checked).value;
function setWho(who) {
  whoRadios().forEach((r) => { r.checked = r.value === who; });
  if (draftMarker) draftMarker.setIcon(pinIcon(who, 'draft'));
}
whoRadios().forEach((r) => r.addEventListener('change', () => setWho(getWho())));

function closePlaceForm() {
  stopPicking();
  draft = null;
  if (draftMarker) draftMarker.remove();
  draftMarker = null;
  $('place-form').hidden = true;
  $('place-results').hidden = true;
  $('place-add').hidden = false;
}

function updateWhere() {
  const where = $('place-where');
  if (draft.lat == null) {
    where.textContent = 'No location yet — search, or tap on the map';
  } else {
    const other = draft.county !== selected.feature.properties.id;
    where.textContent = `Location set${other ? ` (in County ${countyName(draft.county)})` : ''}`;
  }
}

function setDraftLocation(latlng, countyLayer) {
  Object.assign(draft, { lat: latlng.lat, lng: latlng.lng, county: countyLayer.feature.properties.id });
  if (draftMarker) draftMarker.setLatLng(latlng);
  else draftMarker = L.marker(latlng, { icon: pinIcon(getWho(), 'draft'), interactive: false }).addTo(map);
  updateWhere();
}

function startPicking() {
  picking = true;
  $('sheet').hidden = true;
  $('pick-banner').hidden = false;
  map.getContainer().classList.add('picking');
}

function stopPicking() {
  if (!picking) return;
  picking = false;
  $('pick-banner').hidden = true;
  map.getContainer().classList.remove('picking');
  if (selected) $('sheet').hidden = false;
}

function pickLocation(latlng) {
  const countyLayer = countyAt(latlng);
  if (!countyLayer) {
    showMessage('Tap inside a county to place the pin.');
    return;
  }
  showMessage('');
  stopPicking();
  setDraftLocation(latlng, countyLayer);
}

// Look the name up with OpenStreetMap's free place search (Nominatim). Its rules allow one
// search at a time on request (no search-as-you-type), and results are limited to Ireland.
async function searchPlaces() {
  const q = $('place-name').value.trim();
  if (!q) { $('place-name').focus(); return; }
  const results = $('place-results');
  results.hidden = false;
  results.replaceChildren(Object.assign(document.createElement('li'), { className: 'empty', textContent: 'Searching…' }));
  $('place-search').disabled = true;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q, format: 'jsonv2', limit: '8', viewbox: '-11,55.5,-5.3,51.3', bounded: '1',
    })}`);
    if (!res.ok) throw new Error(res.statusText);
    const here = selected.feature.properties.id;
    const found = (await res.json())
      .map((r) => ({ r, latlng: L.latLng(Number(r.lat), Number(r.lon)) }))
      .map((f) => ({ ...f, county: countyAt(f.latlng) }))
      .filter((f) => f.county)
      // Results in the open county first
      .sort((a, b) => (b.county.feature.properties.id === here) - (a.county.feature.properties.id === here));
    results.replaceChildren(...found.map(({ r, latlng, county }) => {
      const li = document.createElement('li');
      const pick = document.createElement('button');
      pick.type = 'button'; // inside the form, so stop it from submitting (saving) the place
      pick.textContent = r.display_name;
      pick.addEventListener('click', () => {
        setDraftLocation(latlng, county);
        map.setView(latlng, Math.max(map.getZoom(), 11));
        results.hidden = true;
      });
      li.append(pick);
      return li;
    }));
    if (!found.length) {
      results.replaceChildren(Object.assign(document.createElement('li'), {
        className: 'empty', textContent: 'Nothing found — try another name, or tap on the map',
      }));
    }
  } catch (err) {
    // A network error usually means an ad blocker or privacy setting stopped the request
    const blocked = err instanceof TypeError;
    results.replaceChildren(Object.assign(document.createElement('li'), {
      className: 'empty',
      textContent: blocked
        ? 'Search was blocked — an ad blocker may be stopping it. Allow nominatim.openstreetmap.org, or tap on the map instead.'
        : `Search didn't work (${err.message}) — tap on the map instead`,
    }));
  }
  $('place-search').disabled = false;
}

$('place-add').addEventListener('click', () => openPlaceForm());
$('place-cancel').addEventListener('click', closePlaceForm);
$('place-tap').addEventListener('click', startPicking);
$('pick-cancel').addEventListener('click', stopPicking);
$('place-search').addEventListener('click', searchPlaces);

$('place-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (draft.lat == null) {
    $('place-where').textContent = 'Choose a location first — search, or tap on the map';
    return;
  }
  $('place-save').disabled = true;
  const pin = { ...draft, name: $('place-name').value, note: $('place-note').value, who: getWho() };
  const saved = await savePins({ action: 'save', ...pin });
  $('place-save').disabled = false;
  if (!saved) return;
  closePlaceForm();
  // A pin found in another county belongs there, so show that county's places
  if (pin.county !== selected.feature.properties.id) openSheet(layerFor(pin.county));
});

// ---- Load everything ----

async function loadCounties() {
  try {
    const res = await fetch('api/counties.php');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    counties = body.counties;
  } catch (err) {
    // The map still works without saved data (e.g. when testing without PHP)
    showMessage(`Couldn't load saved plans: ${err.message}`);
  }
}

async function loadPins() {
  try {
    const res = await fetch('api/pins.php');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    pins = body.pins;
  } catch (err) {
    showMessage(`Couldn't load saved places: ${err.message}`);
  }
}

async function init() {
  buildLegend();
  const [geo] = await Promise.all([
    fetch('assets/counties.geojson').then((r) => r.json()),
    loadCounties(),
    loadPins(),
  ]);

  countiesLayer = L.geoJSON(geo, {
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(feature.properties.name, {
        permanent: true, direction: 'center', className: 'county-label',
      });
      layer.on({
        click: (e) => { L.DomEvent.stopPropagation(e); if (picking) pickLocation(e.latlng); else openSheet(layer); },
        mouseover: () => { if (layer !== selected) layer.setStyle(STYLE.hover); },
        mouseout: () => layer.setStyle(styleFor(layer)),
      });
    },
  }).addTo(map);

  const bounds = countiesLayer.getBounds();
  map.fitBounds(bounds, { padding: [8, 8] });
  map.setMaxBounds(bounds.pad(0.5));
  restyleAll();
  renderPins();

  // Labels get cramped when zoomed out on a phone, so only show them from zoom 7 up
  const updateLabels = () => map.getContainer().classList.toggle('hide-labels', map.getZoom() < 7);
  map.on('zoomend', updateLabels);
  updateLabels();
}

init().catch((err) => showMessage(`Couldn't load the map: ${err.message}`));
