<?php
// Home page: the county map of Ireland. The map itself is drawn by assets/app.js.
require __DIR__ . '/config.php';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1e6fd9">
<title>Ireland Travels</title>
<link rel="stylesheet" href="assets/vendor/leaflet/leaflet.css">
<link rel="stylesheet" href="assets/app.css">
</head>
<body>
<header class="appbar">
  <h1>Ireland Travels</h1>
  <span class="count" id="count" hidden></span>
  <a class="icon-link" href="admin/" title="Settings" aria-label="Settings">⚙</a>
</header>

<main class="page">
  <div class="message card" id="message" hidden></div>

  <!-- Map on the left, status dashboard on the right (stacked on phones).
       New sections (wishlist, visit log, …) go below this inside <main>. -->
  <div class="layout">
  <section class="card map-card">
    <div class="map-box">
      <div id="map" aria-label="Map of Ireland's counties"></div>

      <div class="pick-banner card" id="pick-banner" hidden>
        Tap the map where the place is
        <button class="text-button" id="pick-cancel">Cancel</button>
      </div>

      <section class="sheet card" id="sheet" hidden aria-live="polite">
        <button class="close" id="sheet-close" aria-label="Close">×</button>
        <div class="eyebrow" id="sheet-province"></div>
        <h2 id="sheet-name"></h2>
        <p class="status" id="sheet-status"></p>
        <?php foreach (people_names() as $person => $personName): ?>
          <div class="person" data-person="<?= htmlspecialchars($person) ?>" data-name="<?= htmlspecialchars($personName) ?>">
            <div class="person-head">
              <label class="eyebrow" for="suggestion-<?= htmlspecialchars($person) ?>"><?= htmlspecialchars($personName) ?></label>
              <label class="check"><input type="checkbox"> Done</label>
            </div>
            <textarea id="suggestion-<?= htmlspecialchars($person) ?>" rows="2" maxlength="2000" placeholder="Something to do here…"></textarea>
          </div>
        <?php endforeach; ?>
        <div class="actions">
          <button class="button" id="sheet-save" disabled>Save suggestions</button>
        </div>

        <div class="places">
          <div class="places-head">
            <span class="eyebrow">Places</span>
            <button class="text-button" id="place-add">+ Add place</button>
          </div>
          <ul class="place-list" id="place-list"></ul>
        </div>
      </section>

      <!-- Place box: search for and place a pin. Separate from the county box; only one shows at a time. -->
      <section class="sheet card" id="pin-sheet" hidden aria-live="polite">
        <button class="close" id="place-close" aria-label="Close">×</button>
        <div class="eyebrow">Places</div>
        <h2 id="pin-sheet-title">Add a place</h2>
        <form class="place-form" id="place-form">
            <div class="row">
              <input id="place-name" maxlength="100" placeholder="Place name, e.g. Blarney Castle" required>
              <button type="button" class="button outlined" id="place-search">Search</button>
            </div>
            <ul class="search-results" id="place-results" hidden></ul>
            <textarea id="place-note" rows="2" maxlength="2000" placeholder="Note (optional)"></textarea>
            <div class="who" role="radiogroup" aria-label="Who is this place for">
              <span>For</span>
              <label><input type="radio" name="place-who" value="" checked> Both</label>
              <?php foreach (people_names() as $person => $personName): ?>
                <label><input type="radio" name="place-who" value="<?= htmlspecialchars($person) ?>"> <?= htmlspecialchars($personName) ?></label>
              <?php endforeach; ?>
            </div>
            <div class="place-where">
              <span id="place-where">No location yet</span>
              <button type="button" class="text-button" id="place-tap">Tap on map</button>
            </div>
            <div class="actions">
              <button class="button" id="place-save">Save place</button>
              <button type="button" class="button outlined" id="place-cancel">Cancel</button>
            </div>
        </form>
      </section>

      <button class="fab" id="fab-add">+ Add place</button>
    </div>

  </section>

  <!-- Status dashboard, filled in by renderDashboard() in assets/app.js. Its rows double as the colour key. -->
  <aside class="card dashboard" aria-label="Status">
    <h2>Status</h2>
    <div class="progress"><div class="progress-bar" id="dash-bar"></div></div>
    <p class="progress-text" id="dash-progress"></p>

    <h3>Counties</h3>
    <ul class="dash-list" id="dash-counties"></ul>

    <h3>People</h3>
    <table class="dash-people">
      <thead><tr><th></th><th>Chosen</th><th>Done</th><th>Places</th></tr></thead>
      <tbody id="dash-people"></tbody>
    </table>

    <h3>Places</h3>
    <ul class="dash-list" id="dash-places"></ul>
  </aside>
  </div>
</main>

<script src="assets/vendor/leaflet/leaflet.js"></script>
<script src="assets/colours.js"></script>
<script>const SITE_COLOURS = <?= json_encode(site_colours(), JSON_HEX_TAG) ?>;</script>
<script src="assets/app.js"></script>
</body>
</html>
