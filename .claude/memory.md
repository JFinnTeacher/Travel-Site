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
- 2026-10-16 — Data lives outside the code, in `/var/www/my_webapp/data/`, never in the repo or web folder, so pulls can't overwrite it and it can't be downloaded. See "Known Issues / Gotchas" in CLAUDE.md.

## Current Status
<!-- What's in progress right now, and where you left off. Update at the end of each session. -->
- **Last worked on:** 2026-10-16 — Placeholder site live at https://bawnaree.tail574fd7.ts.net/travelsite/ (PHP 8.4.26). Server checks all green; data folder created by hand.
- **Next step:** Choose the map library (likely Leaflet + OpenStreetMap) and start the county map (MVP).
- **Blockers:**

## Preferences & Feedback
<!-- How you like Claude to work, e.g. "explain changes before making them". -->
-

## Things We Tried That Didn't Work
-

## Open Questions
-

## Session Notes
<!-- Optional, short. Newest first. Include which computer if relevant. -->
-
