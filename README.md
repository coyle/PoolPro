# Pool Pro LLM (MVP)

Mobile-first web app for pool diagnostics, dosing calculations, and customer/pool history.

## Stack
- Next.js App Router + TypeScript + Tailwind
- Go API service
- Postgres + Prisma
- OpenAI integration hooks with structured PoolPro prompt

## Setup
1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres:
   ```bash
   docker compose up -d
   ```
3. Install deps and Prisma setup:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```
4. Run app + API:
   ```bash
   npm run dev
   go run ./go-api/cmd/server
   ```

## Environment Variables
See `.env.example` for full list.

## Test
```bash
npm run test
go test ./... -C go-api
```

## Deploy notes
- Deploy Next.js on Vercel.
- Deploy Go API on Fly/Render.
- Use managed Postgres and set `DATABASE_URL`.
- Set `NEXT_PUBLIC_API_BASE_URL` to deployed Go API URL.
