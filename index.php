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
  <a class="icon-link" href="admin/" title="Site admin" aria-label="Site admin">⚙</a>
</header>

<main class="page">
  <div class="message card" id="message" hidden></div>

  <!-- The map card. New sections (wishlist, visit log, …) go below it inside <main>. -->
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

          <form class="place-form" id="place-form" hidden>
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
        </div>
      </section>
    </div>

    <div class="legend" id="legend" aria-label="Colour key"></div>
  </section>
</main>

<script src="assets/vendor/leaflet/leaflet.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
