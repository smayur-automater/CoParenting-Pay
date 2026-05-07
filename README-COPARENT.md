# CoParent Pay 👨‍👩‍👧

A modern web application for co-parents to track and split child expenses fairly using customizable percentage-based splits.

## Features ✨

- **Email & Google Authentication** - Easy sign up and login options
- **Expense Tracking** - Add and categorize expenses for each child
- **Fair Splits** - Customize percentage splits per child (e.g., 50/50, 60/40, etc.)
- **Multiple Categories** - Groceries, Healthcare, Education, Clothing, Entertainment, Transport, Childcare, Activities, and more
- **Dashboard Summary** - Quick overview of who paid what and who owes whom
- **Expense History** - View all expenses with dates, categories, and amounts
- **Real-time Sync** - Changes sync instantly via Supabase

## Tech Stack 🛠️

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **UI Components**: Lucide React Icons

## Prerequisites 📋

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Google OAuth credentials (optional, for Google sign-in)

## Setup Instructions 🚀

### 1. Clone the Repository

```bash
git clone <repository-url>
cd coparent-pay
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create a `.env.local` file with these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Initialize Database

1. Go to Supabase SQL Editor
2. Copy the entire content from `supabase/schema.sql`
3. Paste it into the SQL editor and run it
4. This will create all necessary tables, RLS policies, and triggers

### 4. Configure Google OAuth (Optional)

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
2. Set authorized redirect URI to `https://your-supabase-url/auth/v1/callback`
3. In Supabase, go to Authentication > Providers > Google and add credentials

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to start using CoParent Pay!

## How to Use 📱

### First Time Setup

1. **Sign Up** - Create an account with email or Google
2. **Add Child** - Enter your child's name and date of birth
3. **Connect Co-Parent** - Enter your co-parent's email address
4. **Set Split Percentage** - Choose how to split expenses (default 50/50)
5. **Start Tracking** - Add expenses as they occur

### Adding Expenses

1. Click "Add Expense" button
2. Enter:
   - Description (e.g., "School uniform")
   - Amount
   - Category (Groceries, Healthcare, etc.)
   - Date
   - Optional notes
3. The split preview shows your share vs their share
4. Click "Save Expense"

### Viewing Summary

The dashboard shows:
- **Total Spent**: Combined expenses
- **You Paid**: Total amount paid by you
- **You Owe**: Settlement amount (positive = they owe you, negative = you owe them)
- **Split**: Current percentage split

## Database Schema 🗄️

### Tables

- **user_profiles** - User account information
- **children** - Child profiles
- **coparent_connections** - Links between co-parents and children with split percentages
- **expenses** - Individual expense records
- **expense_splits** - Tracks who owes what for each expense
- **expense_categories** - Pre-defined expense categories

### Row Level Security

All tables have RLS policies ensuring:
- Users only see their own data
- Co-parents can only see data for children they share
- Only the person who paid an expense can modify it

## API Routes 🔌

### Authentication

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in with email
- `GET /api/auth/callback` - OAuth callback handler

### Data Management

- `GET /api/expenses` - Fetch expenses for a child
- `POST /api/expenses` - Create new expense
- `GET /api/summary` - Get expense summary
- `GET /api/categories` - Fetch expense categories

## Customization 🎨

### Add More Categories

Edit `supabase/schema.sql` in the expense categories insert section:

```sql
insert into expense_categories (name, icon, color) values
  ('New Category', '🎯', '#COLOR_HEX')
```

### Change Split Percentages

Edit the default split in `CoParentSetup.tsx` or create dynamic splits per expense.

### Customize Colors

Update Tailwind classes in component files. Current theme uses blue/indigo.

## Troubleshooting 🔧

### "Co-parent not found"

- Ensure co-parent has created a Supabase account with the email you entered
- Check email spelling

### Expenses not showing up

- Verify Row Level Security policies are correctly configured
- Check that co-parent connection exists in database
- Ensure both users are linked to the same child

### Google OAuth not working

- Verify redirect URI matches Supabase callback URL
- Check OAuth credentials in Supabase settings
- Clear browser cookies and try again

## Development 🧑‍💻

### Project Structure

```
app/
  ├── page.tsx              # Home/auth page
  ├── dashboard/           # Dashboard route
  ├── settings/            # Settings page
  ├── auth/callback/       # OAuth callback
  └── api/                 # API routes
components/
  ├── AuthPage.tsx         # Login/signup UI
  ├── Dashboard.tsx        # Main dashboard
  ├── ExpenseForm.tsx      # Add expense form
  ├── ExpenseList.tsx      # Expense list view
  └── CoParentSetup.tsx    # Initial setup wizard
lib/
  ├── auth.tsx             # Auth context
  ├── supabase.ts          # Supabase client
  └── tax.ts               # (legacy)
types/
  └── index.ts             # TypeScript types
```

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment 🚀

### Deploy to Vercel

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy!

```bash
git push origin main
# Vercel automatically deploys on push
```

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Security Considerations 🔒

- All data is protected by Row Level Security (RLS)
- Passwords are hashed by Supabase Auth
- OAuth tokens are handled securely
- Never commit `.env.local` to version control
- CORS is restricted to your domain

## Support & Contributing 💬

For bugs, features, or questions, please open an issue on GitHub.

## License 📄

MIT License - feel free to use for personal or commercial projects

## Changelog 📝

### v1.0.0 - Initial Release

- Email & Google authentication
- Child expense tracking
- Customizable expense splits
- Expense categories
- Dashboard with summary
- Settings page
- Row Level Security

---

**Built with ❤️ for co-parents everywhere**
