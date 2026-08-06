# ✈️ Voyage — International Trip Planner

A professional, comprehensive web application for planning international vacations.
Built with **Next.js 15 (App Router)**, **TailwindCSS**, **Prisma**, and the
**Claude API**, with **Google Maps** and **live flight tracking** integrations.

It bundles six core modules into one workspace:

1. **Documents Vault** — unlimited tagged file uploads with a filter/search UI.
2. **Daily Itinerary Planner** — a day-by-day chronological timeline.
3. **Trips Archive** — a visual grid of past trips.
4. **Dynamic Google Maps** — a custom per-trip map with markers color-coded by day.
5. **Logistics** — hotels broken down by day + live flight tracking.
6. **AI Travel Consultant** — two Claude-powered skills per trip.

---

## 🚀 Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy and fill in keys)
cp .env.example .env

# 3. Create the database and seed sample trips
npx prisma migrate dev      # creates prisma/dev.db + applies schema
npx prisma db seed          # adds a Tokyo (upcoming) and Rome (archived) trip

# 4. Run
npm run dev                 # http://localhost:3000
```

The app runs **without any API keys** — Google Maps, flight tracking, and Places
all degrade to clearly-labeled demo/mock modes so every screen is explorable.
Add keys to `.env` to enable the live integrations.

---

## 🧱 Architecture

```
src/
├── app/
│   ├── page.tsx                 # Dashboard: active/upcoming trips grid
│   ├── archive/page.tsx         # Trips Archive (past trips)
│   ├── trips/[id]/page.tsx      # Trip workspace (server loads + serializes)
│   └── api/                     # REST API routes (see "API surface" below)
├── components/
│   ├── trip/                    # The five module tabs
│   │   ├── TripWorkspace.tsx    # Tab shell
│   │   ├── ItineraryPlanner.tsx # Module 2 — chronological day timeline
│   │   ├── DocumentsVault.tsx   # Module 1 — tagging + filtering UI
│   │   ├── TripMap.tsx          # Module 4 — Google Map, day-colored markers
│   │   ├── Logistics.tsx        # Module 5 — hotels + live flights
│   │   └── Consultation.tsx     # Module 6 — Claude consultant
│   ├── TripCard.tsx / NewTripModal.tsx / Markdown.tsx / ui.tsx
└── lib/
    ├── prisma.ts                # DB client singleton
    ├── anthropic.ts             # Claude integration + the two AI skills
    ├── flights.ts               # Aviationstack live-tracking client
    ├── places.ts                # Google Places (server-side) client
    ├── constants.ts             # Tag taxonomy, categories, day-color palette
    ├── types.ts                 # Serialized client DTOs
    └── utils.ts                 # Date/formatting + chronological sort
```

**Data flow:** server components read from Prisma and pass serialized DTOs to
client components. Mutations go through `/api/*` routes; the UI calls
`router.refresh()` to re-fetch server state.

---

## 🗄️ Database schema (relational entities)

SQLite via Prisma by default (swap the `provider`/`DATABASE_URL` for Postgres in
production). Full schema in [`prisma/schema.prisma`](prisma/schema.prisma).

```
Trip ─┬─< Day ──< Event            (itinerary, chronological)
      │     └──< SavedPlace        (saved places assigned to a day)
      ├─< Document                 (tagged file vault)
      ├─< Hotel                    (accommodations by date)
      ├─< Flight                   (tracked flight numbers)
      └─< SavedPlace               (trip-level saved places)
```

| Entity | Purpose | Key fields |
|--------|---------|-----------|
| **Trip** | Central record | title, destination, dates, status, map center |
| **Day** | One itinerary day | `dayNumber`, `colorHex` (map marker color) |
| **Event** | Scheduled activity | `startTime`, `category`, `lat`/`lng`, `placeId` |
| **Document** | Uploaded file | `tag`, `fileUrl`, `fileType`, `sizeBytes` |
| **Hotel** | Accommodation | `phone`, `website`, `address`, check-in/out |
| **Flight** | Tracked flight | `flightNumber`, airports, `flightDate` |
| **SavedPlace** | Google saved place | `placeId`, `assignedDayId` |

Trip days are **auto-generated** on creation, each pre-assigned a distinct color
from a 12-color palette (Day 1 = red, Day 2 = blue, …) used for map markers.

---

## 🔌 External API integrations (exact requirements)

| Integration | Provider | Env var(s) | Used by | Without a key |
|-------------|----------|-----------|---------|---------------|
| **AI Consultant** | Anthropic Claude (`claude-opus-4-8`, adaptive thinking) | `ANTHROPIC_API_KEY` | `lib/anthropic.ts`, `/api/trips/[id]/consult` | Returns a clear "set your key" message |
| **Maps render** | Google Maps **JavaScript API** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `TripMap.tsx` | Falls back to a pinned-location list |
| **Place search / Saved Places** | Google **Places API (v1)** | `GOOGLE_MAPS_SERVER_API_KEY` | `lib/places.ts`, `/api/places/search` | Deterministic mock results |
| **Geocoding** | Google **Geocoding API** | `GOOGLE_MAPS_SERVER_API_KEY` | (same key; for address↔coords) | — |
| **Flight tracking** | **Aviationstack** | `AVIATIONSTACK_API_KEY` | `lib/flights.ts`, `/api/flights/[id]/status` | Labeled demo flight data |

### Google Cloud setup
Enable **Maps JavaScript API**, **Places API**, and **Geocoding API** on one
project. Use a browser key (HTTP-referrer restricted) for
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and a separate server key (IP restricted) for
`GOOGLE_MAPS_SERVER_API_KEY`.

### A note on Google "Saved Places"
Google does **not** expose a user's private Saved Places lists via a public API.
The supported, implemented pattern is: search/discover via the Places API →
persist chosen places to the trip's `SavedPlace` collection → assign each to a
day in the planner. A Google Takeout export of saved places can be bulk-imported
through the same `POST /api/trips/[id]/places` endpoint.

### Flight tracking alternatives
`lib/flights.ts` targets Aviationstack but the `LiveFlightStatus` shape is
provider-agnostic. To switch to **FlightAware AeroAPI** or **AviationEdge**, swap
the `fetch` call and field mapping in `fetchLiveFlight()` — nothing else changes.

---

## 🤖 The two AI skills (Claude)

Both skills load the **specific trip's live database state** (itinerary,
activities, hotels, dates) into structured context before calling Claude.

- **Skill 1 — Itinerary & Preference Analyzer**
  Infers the traveler's *implicit* preferences from scheduled activities,
  flags pacing/geography issues, and gives destination-specific recommendations
  tied to evidence in the plan.

- **Skill 2 — Smart Packing Assistant**
  Determines the season and typical historical weather for the destination
  **during the exact trip dates**, then produces a categorized, activity-aware
  packing checklist.

Both use `claude-opus-4-8` with adaptive thinking and streaming
(`stream.finalMessage()`), implemented in `src/lib/anthropic.ts`.

---

## 🛠️ API surface

```
POST   /api/trips                       create trip (auto-generates colored days)
GET    /api/trips?status=ARCHIVED       list trips
GET    /api/trips/[id]                  full trip with relations
PATCH  /api/trips/[id]                  update / archive
DELETE /api/trips/[id]
POST   /api/trips/[id]/events           add itinerary event
PATCH  /api/events/[eventId]            edit event   |  DELETE remove
POST   /api/trips/[id]/documents        multipart upload (tagged)
PATCH  /api/documents/[docId]           retag       |  DELETE remove
POST   /api/trips/[id]/hotels           add hotel   |  PATCH/DELETE /api/hotels/[id]
POST   /api/trips/[id]/flights          track flight|  DELETE /api/flights/[id]
GET    /api/flights/[flightId]/status   live flight status
GET    /api/places/search?q=            Google Places text search
POST   /api/trips/[id]/places           save a place |  PATCH/DELETE /api/places/[id]
POST   /api/trips/[id]/consult          run an AI skill { skill, question }
```

---

## 📦 Tech stack

Next.js 15 · React 19 · TypeScript · TailwindCSS · Prisma · SQLite ·
`@anthropic-ai/sdk` · `@react-google-maps/api` · Aviationstack · lucide-react.

---

## 🔭 Production notes

- Documents are stored on local disk under `public/uploads` for this reference
  build. For production, swap `app/api/trips/[id]/documents/route.ts` to S3/R2.
- Move SQLite → Postgres by changing the Prisma datasource and `DATABASE_URL`.
- Live flight status is fetched on demand; add a short server cache or a cron
  refresh for high-traffic use.
