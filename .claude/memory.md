# Project Memory

Shared memory for this project, committed to git so it's available on every computer.
CLAUDE.md imports it, so Claude reads it at the start of each session.

**How to use:** add short, dated entries. Put stable facts (stack, commands, conventions) in CLAUDE.md. Keep this file for decisions, progress, and context that changes over time.

---

## Decisions Log
<!-- Format: YYYY-MM-DD — Decision — Why -->
- 2026-10-16 — Project started; CLAUDE.md template and this memory file created.
- 2026-10-16 — Hosting: YunoHost My Webapp app installed for this project. Code is cloned from GitHub into `/var/www/my_webapp/www/`.
- 2026-10-16 — Updates: no 5-minute cron sync (updates will be sporadic). Instead an "Update from GitHub" button at `admin/update.php` runs `git pull --ff-only` on demand. SFTP is only for viewing/downloading data, never for uploading code.
- 2026-10-16 — Stack: plain PHP + plain JS, no build step. Map uses Leaflet 1.9.4 (vendored in `assets/vendor/leaflet/`) with standard OpenStreetMap tiles faded to grey via CSS. Jim approved adding Leaflet.
- 2026-10-16 — Map covers all 32 counties (whole island), Jim's choice. Boundaries from OpenStreetMap: 26 Republic counties are admin_level=6 relations; the 6 NI counties are `boundary=historic` relations. Simplified via polygons.openstreetmap.fr (tolerance 0.001°). Rejected a GADM-based gist because it used NI council areas, not counties.
- 2026-10-16 — The county is called **Derry** (id `derry`), not Londonderry — Jim's preference. OpenStreetMap names it "County Londonderry", so rename it again if `counties.geojson` is ever rebuilt. The OSM background tiles label the city "Derry/Londonderry"; that text is baked into the tile images, and Jim chose to keep the OSM background anyway (rather than no background or Esri grey).
- 2026-10-16 — First "visited" store is per county (`data/counties.json`). When the visit log is built, visited status should probably come from logged visits instead.
- 2026-10-16 — Data lives outside the code, in `/var/www/my_webapp/data/`, never in the repo or web folder, so pulls can't overwrite it and it can't be downloaded. See "Known Issues / Gotchas" in CLAUDE.md.

## Current Status
<!-- What's in progress right now, and where you left off. Update at the end of each session. -->
- **Last worked on:** 2026-10-16 — First county map built: Leaflet map of the 32 counties, tap a county to mark it visited (saved via `api/counties.php`). Server checks moved to `admin/`.
- **Next step:** Try the map on the live site (phone too), then the wishlist or the visit log.
- **Blockers:**

## Preferences & Feedback
<!-- How you like Claude to work, e.g. "explain changes before making them". -->
-

## Things We Tried That Didn't Work
- 2026-10-16 — CARTO "Positron" basemap tiles: they now show an "API KEY REQUIRED" image. Switched to OpenStreetMap tiles.

## Open Questions
-

## Session Notes
<!-- Optional, short. Newest first. Include which computer if relevant. -->
-
