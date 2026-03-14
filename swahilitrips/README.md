# SwahiliTrips — Full-Stack Tourism Booking Platform

A coastal tourism platform for **Lamu & Manda Islands** enabling tourists to discover and book boat rides, island tours, fishing trips, dhow sunset cruises, snorkeling trips, and inter-island transport. Boat owners list services; the platform takes a **15% commission** per booking.

## Project structure

```
swahilitrips/
├── frontend/     Next.js 14 App Router + TailwindCSS
├── backend/      Node.js + Express
└── database/     PostgreSQL schema (Neon-compatible)
```

## Quick start

### 1. Database (Neon or any PostgreSQL)

1. Create a database at [Neon](https://neon.tech) (or use local PostgreSQL).
2. Run the schema:
   ```bash
   psql "YOUR_DATABASE_URL" -f database/schema.sql
   ```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, and optionally M-Pesa & OpenWeather keys
npm install
npm run dev
```

- API: **http://localhost:5000**
- Health: **http://localhost:5000/api/health** → `{ "status": "ok" }`

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000 (and optional Google Maps key)
npm install
npm run dev
```

- App: **http://localhost:3000**

## Frontend–backend communication

For the frontend (port 3000) to talk to the backend (port 5000):

1. **Backend CORS** — In `backend/.env`, set:
   ```bash
   CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
   ```
   (Comma-separated if you use multiple origins.)

2. **Frontend API URL** — In `frontend/.env.local`, set:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
   No trailing slash. Must match the URL where the backend is running.

3. **Auth** — The frontend sends the JWT in the `Authorization: Bearer <token>` header. No cookies are used.

4. **Check connectivity** — With both servers running, open `http://localhost:3000` and use the app (e.g. Explore or Register). Backend health: `curl http://localhost:5000/api/health`.

## Environment variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Neon) |
| `JWT_SECRET` | Secret for signing JWTs |
| `MPESA_CONSUMER_KEY` | Safaricom M-Pesa consumer key (sandbox or prod) |
| `MPESA_CONSUMER_SECRET` | Safaricom M-Pesa consumer secret |
| `MPESA_SHORTCODE` | Paybill/Till number |
| `MPESA_PASSKEY` | M-Pesa passkey |
| `MPESA_CALLBACK_URL` | Webhook URL for M-Pesa callbacks (must be HTTPS in prod) |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key for weather widget |
| `CORS_ORIGIN` | Allowed frontend origin (e.g. http://localhost:3000) |
| `PORT` | Server port (default 5000) |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. http://localhost:5000) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional; for advanced Google Maps (currently using OSM embed) |

## Verification

### Backend API

```bash
curl http://localhost:5000/api/health
# → {"status":"ok"}

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"pass123","role":"tourist","phone":"+254700000000"}'
# → returns user + token
```

### Browser

- **Home** — Hero, search bar, featured trips
- **/explore** — Trip listings with filters (category, location, price)
- **/auth/register** — Register as tourist or boat owner
- **/auth/login** — Log in
- **/dashboard/tourist** — My bookings (after login as tourist)
- **/dashboard/owner** — Boats & incoming bookings (boat owner)
- **/dashboard/admin** — Analytics, users, bookings (admin)

### Manual flows

1. **Tourist:** Register → Log in → Explore → Book a trip → Pay with M-Pesa (if configured).
2. **Boat owner:** Register as boat owner → Log in → Add boat (pending approval) → Admin approves → Add trips via API or UI.
3. **Admin:** Create admin user in DB (`role = 'admin'`) → Log in → Approve boat owners, view analytics.

## Deployment

- **Frontend:** Vercel — connect repo, set `NEXT_PUBLIC_API_URL` to your backend URL.
- **Backend:** Render / Railway / Fly.io — set env vars, run `npm start`. Expose `PORT` and set `MPESA_CALLBACK_URL` to the public backend URL.
- **Database:** Neon — use the connection string in `DATABASE_URL`.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, React Query, React Hook Form, Zod, Lucide icons
- **Backend:** Node.js, Express, pg, bcryptjs, jsonwebtoken, express-validator, helmet, cors, rate-limit, axios, ws
- **DB:** PostgreSQL (schema in `database/schema.sql`)
- **Payments:** M-Pesa STK Push (sandbox/prod) with 15% platform commission

## License

MIT.
