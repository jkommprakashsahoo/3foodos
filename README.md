# FoodWise AI

FoodWise AI is an operational dashboard for institutional kitchens that helps teams predict demand, measure food waste, and redistribute safe surplus to verified receiver organizations.

## What it includes

- **Kitchen overview:** live waste, production, redistribution, and efficiency metrics.
- **AI tray analysis:** capture a tray with the camera or upload an image for Gemini Vision classification.
- **Human-verified waste registry:** AI identifies visible items and relative waste levels, while a staff member confirms the physical scale weight before anything is saved.
- **Demand forecasting:** production recommendations based on diner count, shift, weather, and historical records.
- **Surplus logistics:** create listings, match them with receivers, track dispatch, and complete chain-of-custody intake.
- **Analytics:** sustainability, avoided emissions, recovered meals, water, and financial impact.
- **Offline queue:** waste logs can be queued locally while the kitchen is temporarily offline and synchronized when connectivity returns.

## Quick start

Requirements:

- Node.js 20+ and npm
- Optional PostgreSQL database
- Optional Gemini API key for live image analysis

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a production build:

```bash
npm run build
npm start
```

## Environment variables

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgres://user:password@localhost:5432/foodwise
APP_URL=http://localhost:3000
```

The app has a verified local persistence fallback when PostgreSQL is unavailable, so the dashboard can still be evaluated locally. The **DEMO / VERIFIED** switch controls whether baseline seed records are included in views.

## AI workflow and guardrails

1. The browser sends an image to the server at `POST /api/scan-waste`.
2. The server removes the data URL prefix and sends the image to Gemini through `@google/genai`.
3. Gemini returns structured JSON containing visible food items, category, relative waste level, fill percentage when visually supportable, confidence, and observations.
4. The server enforces safe defaults and always returns `requiresHumanConfirmation: true`.
5. The user reviews detected items and enters physical scale weights.
6. Only the confirmed scale values are stored in `POST /api/waste-records`.

AI vision never estimates or writes kilogram weights directly. If `GEMINI_API_KEY` is absent, the API reports an explicit configuration error rather than returning a success-shaped fake analysis.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express and Vite together |
| `npm run lint` | Run the TypeScript type check |
| `npm run build` | Build the frontend and bundled server |
| `npm start` | Start the production server |
| `npx tsx tests/e2e-verify.ts` | Run the API verification audit against a running server |

## Demo accounts

The authentication modal includes sandbox quick-login presets for the seeded manager and receiver roles. These are intended for local evaluation only; use real credentials and a proper secret store for deployment.

## Project layout

```text
src/                  React application and shared types
src/components/       Dashboard, workflows, modals, and UI primitives
server/routes/         Express API and authentication routes
server/services/       Gemini, forecasting, analytics, and matching logic
server/db/             PostgreSQL/local persistence and seed data
tests/                 End-to-end API verification
```

See [`docs/README.md`](docs/README.md) for the API and operational integration notes.
