# CoParent Pay - Quick Start Guide 🚀

Get CoParent Pay running in 5 minutes!

## Step 1: Clone & Install (1 min)

```bash
git clone <repo-url>
cd RECEIPT
npm install
```

## Step 2: Set Up Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) → Sign up/Log in
2. Create a new project (any name, any password)
3. Wait for project to initialize
4. Go to **Settings** → **API**
5. Copy `Project URL` and `anon public key`

## Step 3: Create Environment File (1 min)

Create `.env.local` in project root:

```
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Initialize Database (1 min)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open `supabase/schema.sql` from this project
4. Copy entire contents and paste into Supabase SQL editor
5. Click **Run** (⌘+Enter or Ctrl+Enter)
6. Wait for "Success" message

## Step 5: Start App (0.5 min)

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## First Use

1. Click **Sign Up**
2. Enter email and password
3. Enter your full name
4. Go through the setup wizard:
   - Add your child's name
   - Enter co-parent's email
   - Set expense split percentage
5. Start adding expenses!

## Optional: Set Up Google Sign-In

1. Create OAuth app at [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 Client (Web application)
3. Add authorized redirect: `https://[your-supabase-url]/auth/v1/callback`
4. Get Client ID and Client Secret
5. In Supabase → Authentication → Providers → Google → Enable and add credentials

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Database tables not created?**
- Make sure SQL script ran successfully in Supabase
- Check for error messages in SQL editor
- Try running the script again

**Co-parent can't be found?**
- They must sign up first with their email
- Double-check email spelling
- They need to complete initial setup too

## Next Steps

- Add more children
- Customize expense categories
- Share dashboard with co-parent
- Deploy to production!

---

Need help? Check README-COPARENT.md for full documentation.
