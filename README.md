# Pool Pro LLM (MVP)

Pool Pro LLM is a mobile-first web app that helps pool owners diagnose pool problems and calculate conservative chemical dosing, while storing customer/pool history.

## Stack
- Frontend: Next.js App Router + TypeScript + Tailwind
- Backend: Go API service (diagnose + dosing endpoints) and Next.js API routes (auth + persistence CRUD)
- DB: Postgres + Prisma
- LLM: OpenAI-ready prompt/schema with conservative guardrails

## Features
- Wizard-like flow: Customer → Pool → Test → Plan
- Dosing calculator with conservative caps and confidence levels
- Diagnose chat screen with safety-first guardrails
- Timeline history with:
  - compare last 2 tests
  - repeat last plan
- Simple password auth (register/login/me/logout)

## Setup
1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres:
   ```bash
   docker compose up -d
   ```
3. Install dependencies + DB setup:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
4. Run the app and Go API in separate terminals:
   ```bash
   npm run dev
   ```
   ```bash
   go run ./go-api/cmd/server
   ```

## Environment Variables
See `.env.example`.

## API Notes
### Next.js API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET|POST /api/customers`
- `GET|POST /api/customers/:customerId/pools`
- `GET|POST /api/pools/:poolId/water-tests`
- `GET /api/pools/:poolId/timeline`
- `POST /api/treatment-plans/:planId/repeat`

### Go API routes
- `GET /api/v1/healthz`
- `POST /api/v1/calculator/dose`
- `POST /api/v1/diagnose`

## Testing
```bash
npm run test
cd go-api && go test ./...
```

## Deployment notes
- Deploy Next.js app (Vercel or similar)
- Deploy Go API (Fly/Render)
- Use managed Postgres and set `DATABASE_URL`
- Set `NEXT_PUBLIC_API_BASE_URL` to Go API URL
