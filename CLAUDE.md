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
- [ ] Interactive map of Ireland showing counties, with visited counties highlighted
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

**Reference data** (county boundaries, place info): not settled. OpenStreetMap is the likely option — Claude to recommend.

## Tech Stack

Decided:
- **Data storage:** JSON files
- **Login:** None
- **Image storage:** None (for now)
- **Hosting:** Self-hosted on YunoHost using the My Webapp app (installed)

To decide (Claude to recommend, keeping it simple and easy to host on YunoHost):
- **Backend:** JavaScript, Flask, or other
- **Map library:** e.g. Leaflet + OpenStreetMap

## Design & UI

- **Look and feel:** Cleam modern lines similar to Android Material design
- **Colours / fonts:** Whites and cool blues
- **Mobile friendly:** Yes — visits may be logged on the go

## Privacy & Hosting

- **Who can see it:** Jim and Suzanne only (private site)
- **Backups:** Yunohost Backup
- **How to deploy:** (Claude to fill in once the stack is chosen)
- **Domain:** https://bawnaree.tail574fd7.ts.net/travelsite/

## Running the Site

(Claude to fill in once the project is set up — how to install, run locally, and deploy.)

| Task | Command |
|------|---------|
| Run locally | For Testing and updating|
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
