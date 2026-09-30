# FoodWise AI

**Predict. Reduce. Redistribute.**

FoodWise AI is an operations platform for institutional kitchens. It helps teams record and verify food waste, plan production using historical service data, manage surplus, and coordinate redistribution.

> FoodWise is an operational prototype. Configure and validate its authentication, database, food-safety procedures, and integrations before using it with live institutional data.

## Product workflow

1. **Capture** leftover food with a camera or image upload.
2. **Review** Gemini's visual classification; an operator confirms quantities using a scale.
3. **Learn** from completed, verified service and waste records.
4. **Forecast** expected demand and recommended production where sufficient history exists.
5. **Manage surplus** with availability windows and pickup details.
6. **Redistribute** by matching eligible receivers and recording measured handovers.
7. **Measure** operational and estimated sustainability outcomes.

AI image analysis is advisory: it does not measure weight or certify food safety. Predictions and derived impact metrics are labeled separately from verified measurements.

## Features

- Kitchen overview with operational summaries and data-state handling.
- Camera capture and image-upload workflow for food waste analysis.
- Operator-confirmed waste records and history.
- Attendance, production planning, and demand forecasting with insufficient-history guardrails.
- Surplus listings, receiver matching, assignment, dispatch, and handover tracking.
- Analytics for waste, production, redistribution, and estimated impact.
- Explicit demo-data mode, integration telemetry, and a browser-side queue for waste records submitted while offline.

The application does not provide live GPS, map routing, Google sign-in, password reset, or food-safety certification. Receiver distance/matching depends on configured location data; do not treat it as live route guidance.

## Technology

- React 19, TypeScript, Vite, Tailwind CSS 4, and Recharts
- Node.js and Express API
- PostgreSQL when `DATABASE_URL` is configured; otherwise, a local JSON persistence store
- Gemini through the server-side `@google/genai` SDK

## Requirements

- Node.js 20 or newer
- npm
- Optional: PostgreSQL database
- Optional: Gemini API key for image analysis

## Run locally

```bash
npm install
cp .env.example .env
# Edit .env and set the integrations you want to use.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server runs Express and Vite together.

Without `DATABASE_URL`, the API uses `.foodwise_data.json` in the project working directory for local persistence. Keep this file private and backed up if it contains records you need; it is local development storage, not a managed production database. Without `GEMINI_API_KEY`, the app reports image analysis as unavailable rather than returning a simulated successful analysis.

## Environment variables

Set secrets in the server/deployment environment, not in frontend variables or committed files.

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Server-side key for Gemini food-image analysis. Without it, analysis is unavailable. |
| `DATABASE_URL` | Local development: no. Vercel production: yes. | PostgreSQL connection string. Local development can use JSON persistence; Vercel authentication requires PostgreSQL so accounts and sessions survive separate serverless invocations. |
| `JWT_SECRET` | Vercel production | Secret used to sign authentication tokens. Set a unique, high-entropy value in every deployed environment. Vercel authentication is disabled unless it is configured. |

`.env.example` contains placeholders, not working credentials. Do not put database credentials, Gemini keys, or other secrets in `VITE_*` variables: those can be exposed to browser code.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express API and Vite development server on port 3000. |
| `npm run lint` | Run the TypeScript check (`tsc --noEmit`). |
| `npm run build` | Build the frontend and bundled Express server. |
| `npm start` | Run the built server (`dist/server.cjs`). |
| `npm run vercel-build` | Build the frontend and Vercel API function. |
| `npm run preview` | Preview the Vite production assets locally. |
| `npx tsx tests/e2e-verify.ts` | Run the API verification script against a running app. |

Before submitting changes:

```bash
npm run lint
npm run build
git diff --check
```

## API overview

All API routes are mounted below `/api`. The main endpoints include:

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/status`, `/api/telemetry` | `GET` | API health and database/Gemini readiness. |
| `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` | `POST`, `GET` | Account registration and session operations. |
| `/api/dashboard-metrics` | `GET` | Kitchen overview metrics. |
| `/api/scan-waste` | `POST` | Gemini visual analysis; `/api/analyze-waste` is a compatibility alias. |
| `/api/waste-records` | `GET`, `POST` | Read and save operator-confirmed waste records. |
| `/api/food-items` | `GET` | Food catalog. |
| `/api/menus`, `/api/production`, `/api/attendance` | `GET`, `POST` | Menu, production, and attendance records. |
| `/api/forecast` | `GET` | Demand forecast for supplied item, meal, date, and attendance. |
| `/api/surplus` | `GET`, `POST`, `PATCH` | Create and manage surplus listings. |
| `/api/receivers`, `/api/match-surplus` | `GET`, `POST` | Receiver data and surplus matching. |
| `/api/redistribution` | `GET` | Transfer and receiver information. |
| `/api/redistribution/assign`, `/api/redistribution/:id/status` | `POST`, `PATCH` | Assign and advance redistribution transfers. |
| `/api/handovers` | `GET`, `POST` | Handover records. |
| `/api/analytics` | `GET` | Operational and estimated impact analytics. |

Authenticated endpoints use the bearer token stored by the sign-in flow. Request parameters and response details are implemented in `server/routes/`; frontend API calls are grouped in `src/services/`.

## Data and AI safeguards

- Gemini receives images through the backend; its key must remain server-side.
- The analysis identifies visible items and relative waste level. It must not be treated as a scale reading.
- An operator enters/confirms measured quantities before a waste record is saved.
- Forecasts require sufficient completed history. The API/UI should report insufficient data rather than invent recommendations.
- Demo data is off by default and can be included explicitly. Verify the data label and mode before using operational reports.
- Environmental and financial impact values are estimates based on the application's configured calculation methodology; they are not direct measurements.
- Receiver matching requires location information. Matching distances or scores are not live GPS or route-provider results.
- Image analysis does not inspect or certify food safety. Follow applicable food-safety procedures before redistribution.

## Deployment

The repository includes a Vercel serverless API entry point and a `vercel-build` script. Connect the repository to a Vercel project and configure the required server-side environment variables in that project's settings. Use a managed PostgreSQL database for persistent production data; the local JSON fallback depends on writable instance storage and should not be treated as durable serverless storage. Authentication endpoints return `503 AUTH_STORAGE_UNAVAILABLE` until PostgreSQL is connected, or `503 AUTH_CONFIGURATION_MISSING` if `JWT_SECRET` is absent; they do not claim success while writing accounts to ephemeral memory.

For any production deployment:

1. Set a unique `JWT_SECRET`, and configure `DATABASE_URL` and `GEMINI_API_KEY` as needed.
2. Confirm database connectivity and schema initialization through `/api/telemetry`.
3. Confirm image analysis with a permitted test image; keep a working upload fallback.
4. Configure and verify kitchen/receiver locations before enabling matching workflows.
5. Keep demo mode disabled for verified operational reporting.
6. Test authentication, write permissions, retention, backups, and food-safety processes in the target environment.

## Repository structure

```text
src/
  components/       Application screens and shared UI components
  services/         Typed frontend API clients
  types.ts          Shared frontend domain types
server/
  routes/           Express authentication and application API routes
  services/         Authentication, forecasting, Gemini, matching, analytics
  db/               PostgreSQL/local persistence and development seed data
tests/              API verification script
docs/               Integration notes and endpoint details
```

See [`docs/README.md`](docs/README.md) for additional API integration notes.
