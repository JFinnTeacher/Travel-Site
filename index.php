<?php
// Home page: the county map of Ireland. The map itself is drawn by assets/app.js.
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

<div id="map" aria-label="Map of Ireland's counties"></div>

<div class="legend card">
  <span><i class="swatch visited"></i>Visited</span>
  <span><i class="swatch"></i>Not yet</span>
</div>

<div class="message card" id="message" hidden></div>

<section class="sheet card" id="sheet" hidden aria-live="polite">
  <button class="close" id="sheet-close" aria-label="Close">×</button>
  <div class="eyebrow" id="sheet-province"></div>
  <h2 id="sheet-name"></h2>
  <p class="status" id="sheet-status"></p>
  <button class="button" id="sheet-toggle"></button>
</section>

<script src="assets/vendor/leaflet/leaflet.js"></script>
<script src="assets/app.js"></script>
</body>
</html>
