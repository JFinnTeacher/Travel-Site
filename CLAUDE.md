# CLAUDE.md

This file guides Claude Code when working in this repository. Fill in each section and delete any that don't apply.

> **Project memory:** Shared notes that carry across computers are in [.claude/memory.md](.claude/memory.md) and load automatically through the import below. Keep that file committed to git.

@.claude/memory.md

---

## Project Overview

<!-- One or two paragraphs: what the site is, who it's for, and why it exists. -->
A website for tracking visits and activities around Ireland with my wife.

- **Primary users:**
- **Main goals:**
- **Out of scope (for now):**

## Core Features

<!-- What the site needs to do. Mark each as MVP or later. -->
- [ ] Log a visit (place, date, who went, notes)
- [ ] Record activities at a place (hike, meal, attraction, etc.)
- [ ] Map view of places visited
- [ ] Photos for visits
- [ ] Ratings / favourites
- [ ] "Wishlist" of places we want to go
- [ ] Stats (counties visited, number of trips, etc.)
- [ ]

## Data Model

<!-- Main entities and how they relate. -->
- **Place:** name, county, coordinates, type, ...
- **Visit:** place, date(s), who, notes, rating, ...
- **Activity:** visit, type, description, ...
- **Photo:**
- **User:**

### Reference Data
<!-- e.g. the list of 32 counties, provinces, place categories, where the data comes from. -->

## Tech Stack

- **Frontend:**
- **Backend / API:**
- **Database:**
- **Authentication:**
- **Maps:** <!-- e.g. Leaflet + OpenStreetMap, Mapbox, Google Maps -->
- **Image storage:**
- **Hosting / Deployment:**
- **Package manager:**

## Project Structure

<!-- Fill in once the skeleton exists. -->
```
/
├── 
└── 
```

## Getting Started

### Prerequisites
<!-- Node version, Python version, accounts needed, etc. -->

### Setup
```bash
# install dependencies

# set up environment variables

# run locally
```

### Environment Variables
<!-- Names and purpose only. Never put real secrets in this file. -->
| Variable | Purpose |
|----------|---------|
|          |         |

## Common Commands

| Task | Command |
|------|---------|
| Run dev server | |
| Build | |
| Run tests | |
| Lint / format | |
| Deploy | |

## Coding Conventions

- **Language / style:**
- **Naming:**
- **Component / file organisation:**
- **Formatting tools:**
- **Comments & docs:**

## Design & UI

- **Look and feel:**
- **Colour palette / fonts:**
- **Mobile-first?:** <!-- likely yes if logging visits on the go -->
- **Accessibility requirements:**

## Testing

- **Framework:**
- **What must be tested:**
- **How to run:**

## Git Workflow

- **Branching:** <!-- e.g. feature branches off main -->
- **Commit message style:**
- **Pull requests:**

## Privacy & Security

<!-- This is personal data. Who can see it? -->
- **Public or private site?:**
- **Who can log in / edit:**
- **Location data / photo EXIF handling:**
- **Backups:**

## Deployment

- **Where it's hosted:**
- **How to deploy:**
- **Domain:**

## Roadmap

### Phase 1 — MVP
-

### Phase 2
-

### Ideas / Someday
-

## Instructions for Claude

<!-- How you want Claude to work on this project. -->
- Ask before adding new dependencies.
- Keep changes small and explain them.
- Update [.claude/memory.md](.claude/memory.md) when important decisions are made.
-

## Known Issues / Gotchas

-

## Useful Links

- **Repo:**
- **Live site:**
- **Design / mockups:**
- **API docs:**
