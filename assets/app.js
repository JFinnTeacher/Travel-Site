// County map: draws the 32 counties on a Leaflet map, coloured by how far each person's
// plan has got, and lets you tap a county to edit the plans (saved through api/counties.php).

// Colours come from the admin page (SITE_COLOURS, set in index.php). The county shades are
// all worked out from one base colour by mapShades() in assets/colours.js.
const SHADES = mapShades(SITE_COLOURS.map);

// The colour categories, in order. statusOf() picks one for each county; the dashboard key is built from this list.
const STATUSES = [
  { key: 'none', label: 'Nothing planned', opacity: 0.45 },
  { key: 'one-chosen', label: 'One chosen', opacity: 0.7 },
  { key: 'both-chosen', label: 'Both chosen', opacity: 0.7 },
  { key: 'one-done', label: 'One done', opacity: 0.8 },
  { key: 'both-done', label: 'Both done', opacity: 0.8 },
].map((status) => ({ ...status, fill: SHADES[status.key] }));

const STYLE = {
  base: { color: SHADES.border, weight: 1 },
  hover: { weight: 2.5, color: SHADES.hover },
  selected: { weight: 3.5, color: SHADES.selected },
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
  renderDashboard();
}

function swatch(status) {
  const el = document.createElement('i');
  el.className = 'swatch';
  el.style.background = status.fill;
  return el;
}

function pinSwatch(who) {
  const mark = swatch({ fill: PIN_COLOURS[who || ''] });
  mark.classList.add('pin-swatch');
  return mark;
}

// One "colour mark · label · number" row for the dashboard lists
function dashRow(mark, label, value) {
  const li = document.createElement('li');
  const text = document.createElement('span');
  text.textContent = label;
  const count = document.createElement('strong');
  count.textContent = value;
  li.append(mark, text, count);
  return li;
}

// The status dashboard beside the map: overall progress, counties per colour category,
// each person's totals, and places per pin colour. Its rows double as the colour key.
function renderDashboard() {
  if (!countiesLayer) return;
  const ids = countiesLayer.getLayers().map((l) => l.feature.properties.id);
  const counts = Object.fromEntries(STATUSES.map((s) => [s.key, 0]));
  ids.forEach((id) => { counts[statusOf(id).key] += 1; });

  const done = counts['both-done'];
  $('dash-bar').style.width = `${(done / ids.length) * 100}%`;
  $('dash-bar').style.background = SHADES['both-done'];
  $('dash-progress').textContent = `${done} of ${ids.length} counties done by both`;

  $('dash-counties').replaceChildren(...STATUSES.map((s) => dashRow(swatch(s), s.label, counts[s.key])));

  $('dash-people').replaceChildren(...PEOPLE.map((person) => {
    const plans = ids.map((id) => planOf(id, person));
    const cells = [
      plans.filter((p) => p.suggestion || p.done).length,
      plans.filter((p) => p.done).length,
      pins.filter((pin) => pin.who === person).length,
    ];
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = whoName(person);
    tr.append(th, ...cells.map((n) => Object.assign(document.createElement('td'), { textContent: n })));
    return tr;
  }));

  $('dash-places').replaceChildren(...['', ...PEOPLE].map((who) => dashRow(
    pinSwatch(who),
    who ? `${whoName(who)}'s places` : 'Shared places',
    pins.filter((pin) => (pin.who || '') === who).length,
  )));
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
  updateFab();
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
  selected = null;
  previous.setStyle(styleFor(previous));
  $('sheet').hidden = true;
  updateFab();
}

$('sheet-close').addEventListener('click', closeSheet);
// Tapping the sea closes the county box, unless the place box is open (then a tap places the pin)
map.on('click', (e) => (placeBoxOpen() ? pickLocation(e.latlng) : closeSheet()));

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

// Pin colour by who the place is for: '' = both, otherwise a person id (set on the admin page)
const PIN_COLOURS = { ...SITE_COLOURS.pins, '': SITE_COLOURS.pins.shared };
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
  renderDashboard();
}

// Is a place already a line in this person's saved trip planner note?
function inPlan(pin, person) {
  const lines = (planOf(pin.county, person).suggestion || '').split('\n');
  return lines.some((line) => line.trim().toLowerCase() === pin.name.toLowerCase());
}

// "+ Plan" button: copies the place name into the trip planner note of whoever it's for
// (both people for a shared place) and saves it. Shows "In plan ✓" once it's there.
function planButton(pin) {
  const people = pin.who ? [pin.who] : PEOPLE;
  const button = document.createElement('button');
  button.className = 'text-button';
  if (people.every((person) => inPlan(pin, person))) {
    button.textContent = 'In plan ✓';
    button.disabled = true;
    return button;
  }
  button.textContent = '+ Plan';
  button.title = `Add to ${people.map(whoName).join(' and ')}'s trip plan`;
  button.addEventListener('click', () => {
    people.filter((person) => !inPlan(pin, person)).forEach((person) => {
      const box = textOf(person);
      box.value = box.value.trim() ? `${box.value.trimEnd()}\n${pin.name}` : pin.name;
    });
    button.disabled = true;
    saveSuggestions(); // also saves anything else typed in the boxes
  });
  return button;
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
    li.append(show, whoTag(pin.who), planButton(pin), edit, del);
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
  $('pin-sheet-title').textContent = pin ? 'Edit place' : 'Add a place';
  if (pin) setDraftLocation(L.latLng(pin.lat, pin.lng), layerFor(pin.county));
  else updateWhere();
  $('sheet').hidden = true; // the county box steps aside while the place box is open
  $('pin-sheet').hidden = false;
  updateFab();
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

// Close the place box and bring back the county box if one was open
function closePlaceForm() {
  if (!draft) return;
  stopPicking();
  draft = null;
  if (draftMarker) draftMarker.remove();
  draftMarker = null;
  $('pin-sheet').hidden = true;
  $('place-results').hidden = true;
  if (selected) $('sheet').hidden = false;
  updateFab();
}

const placeBoxOpen = () => draft !== null;

// The map's "+ Add place" button shows only when no box is covering the map
function updateFab() {
  $('fab-add').hidden = !$('sheet').hidden || placeBoxOpen();
}

function updateWhere() {
  const where = $('place-where');
  if (draft.lat == null) {
    where.textContent = 'No location yet — search, or tap on the map';
  } else {
    where.textContent = `Location set — County ${countyName(draft.county)}`;
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
  $('pin-sheet').hidden = true;
  $('pick-banner').hidden = false;
  map.getContainer().classList.add('picking');
}

function stopPicking() {
  if (!picking) return;
  picking = false;
  $('pick-banner').hidden = true;
  map.getContainer().classList.remove('picking');
  $('pin-sheet').hidden = false;
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
    const here = selected && selected.feature.properties.id;
    const found = (await res.json())
      .map((r) => ({ r, latlng: L.latLng(Number(r.lat), Number(r.lon)) }))
      .map((f) => ({ ...f, county: countyAt(f.latlng) }))
      .filter((f) => f.county)
      // Results in the open county (if any) first
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
$('fab-add').addEventListener('click', () => openPlaceForm());
$('place-cancel').addEventListener('click', closePlaceForm);
$('place-close').addEventListener('click', closePlaceForm);
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
  // Show the county the pin is in, with the new place in its list
  openSheet(layerFor(pin.county));
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
        click: (e) => { L.DomEvent.stopPropagation(e); if (placeBoxOpen()) pickLocation(e.latlng); else openSheet(layer); },
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
