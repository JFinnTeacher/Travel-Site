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
- 2026-10-16 — Each county has a suggestion box (what to do there) plus a "Done" tick for each of two people, shown as **User 1 / User 2** rather than Jim / Suzanne (Jim's choice). The display names are typed in on the admin page ("User names" card) and saved in `data/settings.json`, so code updates never reset them; ids `user1`, `user2` are fixed in `PEOPLE` in `config.php`. Stored in `data/counties.json` as e.g. `"cork": { "user1": { "suggestion": "…", "done": true, "done_on": "2026-10-16" } }`.
- 2026-10-16 — "Mark as visited" removed. Counties are coloured by 5 categories instead: nothing planned, one chosen, both chosen (blues), one done, both done (teals). A suggestion or a Done tick counts as "chosen"; done beats chosen. Colours and labels live in `STATUSES` at the top of `assets/app.js`, and the colour key is built from that list. App-bar counter = counties both people have done. Old `visited` keys in existing data files are just ignored.
- 2026-10-16 — Map pins ("Places" in the county card): name + optional note + "For" (Both, or one person: `who` = person id, left out for both), always shown on the map. Pin colour shows who: navy = shared, purple = user1, pink = user2 (`PIN_COLOURS` in `assets/app.js`); the colour key lists them too. Added by searching the name (OpenStreetMap Nominatim, called from the browser, only on button press per its usage policy, limited to Ireland) or by tapping the map. A pin's county is wherever it actually lies (point-in-polygon in `assets/app.js`), not the county that was open. Stored in `data/pins.json`.
- 2026-10-16 — Data lives outside the code, in `/var/www/my_webapp/data/`, never in the repo or web folder, so pulls can't overwrite it and it can't be downloaded. See "Known Issues / Gotchas" in CLAUDE.md.

## Current Status
<!-- What's in progress right now, and where you left off. Update at the end of each session. -->
- **Last worked on:** 2026-10-16 — County card has a suggestion + Done tick per person, the map is coloured by the 5 categories with a key, and user names are set on the admin page. Map pins (Places) added.
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
