# FoodWise AI integration notes

## Core API paths

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/telemetry` | GET | Database and Gemini readiness |
| `/api/scan-waste` | POST | Gemini Vision analysis of a tray image |
| `/api/waste-records` | GET/POST | Read and store human-confirmed waste logs |
| `/api/dashboard-metrics` | GET | Dashboard aggregates |
| `/api/forecast` | GET | Demand forecast for a shift and food item |
| `/api/surplus` | GET/POST | Manage surplus listings |
| `/api/match-surplus` | POST | Rank compatible receiver organizations |
| `/api/surplus/:id` | PATCH | Move a surplus listing through its lifecycle |
| `/api/analytics` | GET | Sustainability and financial impact |

`POST /api/analyze-waste` remains available as a compatibility alias for clients using the earlier route name.

## Image request

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg"
}
```

The response is shaped as:

```json
{
  "success": true,
  "data": {
    "foodItems": [],
    "overallAssessment": "...",
    "requiresHumanConfirmation": true,
    "modelName": "Gemini 3.8 Flash (Vision)",
    "analyzedAt": "2026-09-22T00:00:00.000Z",
    "disclaimer": "..."
  },
  "classification": "AI_ESTIMATION",
  "requiresHumanConfirmation": true
}
```

## Operational data boundary

Vision analysis is advisory. The scale-confirmed `user_confirmed_quantity` field is the source of truth for waste metrics, forecasting history, and sustainability calculations. Keep this boundary intact when adding new clients or integrations.

## Deployment checklist

- Set `GEMINI_API_KEY` using a secret manager.
- Set a real `DATABASE_URL` and run the database initialization path.
- Put the Express server behind HTTPS before enabling camera capture.
- Restrict production CORS and authentication policies to the organization’s domain.
- Keep demo data disabled for verified reporting.
- Run `npm run lint` and `npm run build` before release.
