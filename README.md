# CoParenting Pay
> Child cost split calculator — enter expenses, split fairly, share instantly.

**Stack:** React (Vite) · Node/Express · Supabase · Stripe · Vercel

---

## What it does
1. Enter child expenses with descriptions and amounts
2. Set split ratio (50/50, 70/30, or any custom %)
3. Instantly see who owes what
4. Sign in (email) to save and access history for 7 years
5. Share a read-only link with co-parent
6. One-time $4.99 unlocks PDF export for any calculation

---

## Project structure
```
coparentingpay/
├── frontend/          React + Vite
│   ├── src/
│   │   ├── App.jsx        All screens (calculator, history, share, auth)
│   │   ├── main.jsx       Entry point
│   │   └── lib/
│   │       └── supabase.js  Supabase client + API helpers
│   ├── index.html
│   └── vite.config.js
│
├── backend/           Node.js + Express
│   └── src/
│       └── index.js   All routes (calculations, PDF, Stripe checkout)
│
├── supabase/
│   └── migrations/
│       └── 001_schema.sql   DB schema + RLS policies
│
└── vercel.json        Deployment config
```

---

## Setup

### 1. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_schema.sql` in SQL Editor
3. Enable **Email** auth under Authentication → Providers
4. Create a Storage bucket named **`receipts`** (private)
5. Copy your **Project URL** and **anon key**

### 2. Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Copy **Secret key** (`sk_live_...` or `sk_test_...`)
3. Add webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
   - Event: `checkout.session.completed`
4. Copy **Webhook signing secret** (`whsec_...`)

### 3. Local development
```bash
# Backend
cd backend
cp .env.example .env   # fill in values
npm install
npm run dev            # runs on :4000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local   # fill in values
npm install
npm run dev            # runs on :5173, proxies /api to :4000
```

### 4. Deploy to Vercel
```bash
npm i -g vercel
vercel deploy

# Set environment variables in Vercel dashboard:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
# ALLOWED_ORIGIN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/health`                  | —    | Health check |
| POST | `/api/calculations`            | ✓    | Save a calculation |
| GET  | `/api/calculations`            | ✓    | List user's calculations |
| DELETE | `/api/calculations/:id`      | ✓    | Delete a calculation |
| GET  | `/api/share/:token`            | —    | Public share view |
| GET  | `/api/calculations/:id/pdf`    | ✓ + paid | Download PDF |
| POST | `/api/checkout`                | ✓    | Create Stripe session ($4.99) |
| POST | `/api/webhooks/stripe`         | Stripe sig | Payment webhook |
| GET  | `/api/me/unlocked`             | ✓    | Check purchase status |

---

## Data retention
- All calculations stored in Supabase PostgreSQL
- `expires_at` set to 7 years from creation
- Users can delete their own calculations at any time
- Supabase handles backups automatically

---

## Monetisation
- App is fully free to use (calculate + share links)
- One-time **$4.99** unlocks PDF export + history access
- Processed via Stripe Checkout
- Single purchase unlocks all calculations for that account
