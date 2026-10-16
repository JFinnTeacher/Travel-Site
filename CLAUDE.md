# CLAUDE.md

This file guides Claude Code when working in this repository. The site is vibe coded with Claude, so this file focuses on **what** to build and **how to work with me**, not on coding detail.

> **Project memory:** Shared notes that carry across computers are in [.claude/memory.md](.claude/memory.md) and load automatically through the import below. Keep that file committed to git.

@.claude/memory.md

---

## Project Overview

A website for Jim and Suzanne to plan and record visits and activities around Ireland.

- **Users:** Jim and Suzanne
- **Main goal:** An interactive map of Ireland to plan and record visits
- **Out of scope (for now):** European capital cities (possible future expansion)

## Features

### MVP
- [x] Interactive map of Ireland showing counties, with visited counties highlighted (first version: tap a county to mark it visited)
- [ ] Wishlist of places we want to go
- [ ] Plan activities in a county — one each for Jim and Suzanne
- [ ] Log a visit (place, date, notes)

### Later
- [ ] Record activities at a place (hike, meal, attraction, etc.)
- [ ] Dropdown for each person to choose what they want to do
- [ ] Ratings / favourites
- [ ] Photos
- [ ] Four levels of map highlight per county:
  - [ ] One person chosen
  - [ ] Both chosen
  - [ ] One completed
  - [ ] Both completed

### Ideas / Someday
- European capital cities

## Data Model

- **Place:** name, county, address
- **Visit:** place, date(s), who, notes, rating
- **Activity:** visit, type, description
- **Person:** Jim, Suzanne
- **Photo:** (later)

**Reference data:** County boundaries are the 32 traditional counties from OpenStreetMap (ODbL), simplified to ~100 m detail and saved as `assets/counties.geojson`. Each county has an `id` (e.g. `cork`, `londonderry`), `name`, `province` and `osm_id`. Place info: not settled yet.

## Tech Stack

Decided:
- **Data storage:** JSON files
- **Login:** None
- **Image storage:** None (for now)
- **Hosting:** Self-hosted on YunoHost using the My Webapp app (installed)

- **Backend:** Plain PHP (My Webapp already runs PHP 8.4, so nothing extra to install). Small JSON APIs live in `api/`.
- **Front end:** Plain JavaScript and CSS, no build step. Code in `assets/app.js` and `assets/app.css`.
- **Map library:** Leaflet 1.9.4, copied into `assets/vendor/leaflet/` (no CDN). Background map tiles are CARTO "Positron" (light style built from OpenStreetMap data).

## Design & UI

- **Look and feel:** Cleam modern lines similar to Android Material design
- **Colours / fonts:** Whites and cool blues
- **Mobile friendly:** Yes — visits may be logged on the go

## Privacy & Hosting

- **Who can see it:** Jim and Suzanne only (private site)
- **Backups:** Yunohost Backup
- **How to deploy:** Push to GitHub, then press "Update from GitHub" on the admin page
- **Domain:** https://bawnaree.tail574fd7.ts.net/travelsite/

## Running the Site

- Home page (`index.php`) is the county map. The ⚙ icon opens `admin/` (server checks + update button).
- Saved county status is in `DATA_DIR/counties.json`, created automatically on first use.

| Task | Command |
|------|---------|
| Run locally | No PHP on Jim's PC yet, so test on the live site. (Opening the map without PHP shows the map but can't save.) |
| Deploy (first time) | Clone the repo into YunoHost My Webapp using SSH from the public repo |
| Update | Push to GitHub, then press "Update from GitHub" at `/travelsite/admin/update.php` |

## Instructions for Claude

- I'm vibe coding this — explain changes in plain language and tell me how to try them.
- Ask before adding new dependencies.
- Keep changes small and explain them.
- Update [.claude/memory.md](.claude/memory.md) when important decisions are made.
- Fill in the "To decide" and "Running the Site" sections in this file as those get settled.

## Known Issues / Gotchas

- **Keep data outside the code.** Data files (visits, wishlist, activities) must never live in the repo or the web folder. On the server they go in `/var/www/my_webapp/data/`, while the code lives in `/var/www/my_webapp/www/`. This means:
  - `git pull` updates can never overwrite logged data
  - the raw JSON can't be downloaded from a browser
  - the data stays inside the app folder for YunoHost backups

  The app folder `/var/www/my_webapp` is owned by root, so PHP can't create `data/` itself. It was created once by hand: `sudo mkdir -p /var/www/my_webapp/data && sudo chown my_webapp:my_webapp /var/www/my_webapp/data && sudo chmod 750 /var/www/my_webapp/data`. Repeat this on any fresh install.

  Build with this in mind: the data path must be a setting (not hard-coded inside `www/`), data files must be listed in `.gitignore`, and the app should create empty data files on first run if none exist.
