# Netflix Clone

A full-stack Netflix clone built from scratch with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and a **local MongoDB** instance. It implements the core Netflix experience end to end: accounts, multiple profiles, a personalized browse page, search, My List, ratings, episodic playback, and resume watching.

Artwork and metadata are sourced from TMDB and TVmaze. Streaming uses public sample clips so the player can be demonstrated safely.

## Features

- **Accounts & auth** — email/password sign up and sign in, bcrypt password hashing, JWT sessions in `httpOnly` cookies, protected routes via middleware.
- **Profiles** — up to 5 profiles per account, editable names/avatars, Kids profiles that only see family-friendly titles.
- **Browse experience** — rotating billboard hero, continue watching, trending, Top 10 (ranked), new releases, top rated, movies, TV shows, and per-genre carousels.
- **Title pages** — backdrop hero, match score, maturity rating, cast, genres, My List, like/dislike, and season/episode browser with progress.
- **Video player** — custom controls, play/pause, seek, volume, fullscreen, keyboard shortcuts, 10s skip, and next-episode navigation.
- **Resume watching** — playback position saved to MongoDB every few seconds and on exit; continue watching row reflects real progress.
- **Search** — full search page plus debounced navbar suggestions across titles, genres, cast, and years.
- **My List** — add/remove titles per profile with optimistic UI.
- **Ratings** — per-profile thumbs up / thumbs down persisted to MongoDB.
- **Genre browsing** — dedicated genre pages with chip navigation.
- **Seeding** — one command loads 65 real titles (40 films, 25 series) with posters, backdrops, cast, ratings, and real episode data.
- **Responsive UI** — desktop and mobile layouts.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB (official Node.js driver) |
| Auth | `jose` JWT + `bcryptjs`, httpOnly cookies |
| UI icons | `lucide-react` |
| Images | `next/image` (TMDB + TVmaze CDNs) |

## Prerequisites

- Node.js 18.18+ (built and tested on Node 22)
- A running local MongoDB server (default `mongodb://127.0.0.1:27017`)

Check MongoDB is running:

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (already provided as .env.local)
cp .env.example .env.local

# 3. Seed the catalog + demo account
npm run seed

# 4. Start the app
npm run dev
```

Open <http://localhost:3000>.

The app also auto-seeds on first request if the `titles` collection is empty, so `npm run dev` alone works against a fresh database.

### Demo account

```
Email:    demo@netflix.dev
Password: demo1234
```

The demo account includes three profiles (Alex, Jordan, Kids), a populated My List, and resume-watching history.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/netflix?directConnection=true` | MongoDB connection string |
| `MONGODB_DB` | `netflix` | Database name |
| `AUTH_SECRET` | dev fallback | Secret used to sign session/profile JWTs — set a strong value in production |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run seed` | Upsert the catalog and ensure the demo account exists |
| `npm run seed:reset` | Wipe app collections and reseed from scratch |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

## How it works

### Data model

MongoDB collections:

- `users` — account name, email, bcrypt password hash
- `profiles` — profile name, avatar index, kids flag, owner `userId`
- `titles` — movies and series with genres, cast, artwork, popularity, maturity, featured/trending flags, and embedded seasons/episodes for series
- `myList` — `(profileId, titleId)` unique pairs
- `progress` — `(profileId, titleId, episodeId)` playback positions
- `ratings` — `(profileId, titleId)` thumbs up/down

### Auth flow

1. Sign up or log in → a signed JWT session cookie (`nf_session`) is set.
2. Choose a profile → a second signed cookie (`nf_profile`) is set, bound to the session user.
3. Middleware redirects unauthenticated users to `/login` and users without an active profile to `/profiles`.
4. Server components re-verify both tokens and ownership on every protected request.

### Seeding

`npm run seed` reads `src/data/catalog.json` (generated from TMDB metadata + TVmaze episodes), normalizes genres, derives maturity/kids flags, and upserts titles. It then creates the demo account if missing.

To regenerate the catalog from the network:

```bash
node scripts/fetch-titles.mjs
node scripts/enrich-episodes.mjs
```

## Project structure

```
src/
  app/
    (app)/                 # Authenticated shell with navbar + My List context
      browse/              # Home, Movies, TV, New & Popular, genre pages
      title/[slug]/        # Title detail + episodes
      search/              # Search results
      my-list/             # Saved titles
      account/             # Account overview
    watch/[slug]/          # Fullscreen player (no navbar)
    login/ signup/         # Auth pages
    profiles/              # Profile picker / management
    api/                   # Auth, profiles, my-list, progress, ratings, search
  components/              # Billboard, Row, TitleCard, Player, Navbar, etc.
  lib/                     # db, auth, password, data access, seed, types, utils
  data/catalog.json        # Seed catalog
scripts/                   # Catalog fetcher, episode enricher, seed CLI
```

## Notes & limitations

- This is a demo, not production-hardened. Before deploying, add rate limiting, CSRF protection, email verification, password reset, and rotate `AUTH_SECRET`.
- Videos are public sample clips. Real Netflix content is not included or streamed.
- Artwork/metadata belong to their respective owners and are fetched from TMDB/TVmaze CDNs at runtime.
- Not affiliated with Netflix, Inc.
