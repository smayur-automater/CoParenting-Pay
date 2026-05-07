# Deployment Guide - CoParent Pay

Deploy CoParent Pay to production on Vercel in minutes.

## Prerequisites

- GitHub account
- Vercel account (free)
- Production Supabase project

## Step 1: Prepare Production Supabase

1. Create a new Supabase project for production (or use existing one)
2. Run the schema.sql in that project
3. Copy Project URL and anon key

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Initial CoParent Pay app"
git push origin main
```

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Framework: Select "Next.js"
6. Root Directory: `./`
7. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your production anon key
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g., https://coparentpay.com)
8. Click "Deploy"

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to connect GitHub and deploy.

## Step 4: Configure Domain

1. In Vercel → Project Settings → Domains
2. Add your custom domain or use vercel.app subdomain
3. Update `NEXT_PUBLIC_APP_URL` if using custom domain

## Step 5: Configure Google OAuth (Production)

If using Google Sign-In:

1. Add production domain to Google OAuth credentials
2. Update redirect URI: `https://your-production-url/auth/v1/callback`
3. Ensure credentials are added to Supabase production project

## Step 6: Enable HTTPS

- Vercel automatically provides HTTPS
- All traffic redirects to HTTPS
- Supabase handles secure connections

## Monitoring & Maintenance

### View Logs

```bash
vercel logs
```

### View Analytics

In Vercel Dashboard → Analytics tab

### Database Backups

Supabase automatically backs up daily. To restore:
1. Go to Supabase → Backups
2. Select restore point
3. Restore database

## Performance Optimization

### Current Setup

- Next.js Static Generation for public pages
- API routes cached with Supabase
- Images optimized via next/image
- Database indexed for fast queries

### Further Optimization

1. **Enable ISR (Incremental Static Regeneration)**
   - Set revalidate time in getStaticProps

2. **Add CDN Cache Headers**
   - Configure in vercel.json or Vercel settings

3. **Monitor Bundle Size**
   ```bash
   npm run build
   ```

## Troubleshooting

### Deployment fails

- Check build logs in Vercel
- Ensure environment variables are set
- Verify Node.js version 18+

### Database connection errors

- Check Supabase project is running
- Verify anon key is correct
- Ensure RLS policies are configured

### OAuth redirect not working

- Update redirect URI in both Google and Supabase
- Match production domain exactly
- Clear browser cookies

## Database Migration

To migrate from local to production:

1. Export local data (if using localStorage)
2. Ensure production Supabase is initialized
3. Data will sync via Supabase automatically

## Continuous Deployment

Every push to main automatically:
1. Builds the app
2. Runs tests (if configured)
3. Deploys to Vercel
4. Generates production build

## Rollback

If deployment has issues:

```bash
vercel rollback
```

Or in Vercel Dashboard → Deployments → Select previous version → Promote

## Custom Domain SSL

Vercel handles SSL automatically for:
- `*.vercel.app` subdomains
- Custom domains added to Vercel

## Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Cost Estimation

- **Vercel**: Free tier (12 GB bandwidth/month), $20/month for Pro
- **Supabase**: Free tier (500 MB storage, 1GB bandwidth), $25/month for Pro
- **Custom Domain**: $10-15/year

## Backup & Disaster Recovery

1. **Database**: Supabase provides daily backups
2. **Code**: GitHub is your backup
3. **Static Assets**: Hosted on Vercel CDN

To restore after disaster:
1. Redeploy from GitHub
2. Restore database from Supabase backup
3. All user data is safe

## Security Checklist ✅

- [ ] HTTPS enabled (automatic)
- [ ] RLS policies configured
- [ ] Environment variables set
- [ ] API keys rotated
- [ ] Supabase project not exposed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (optional)

## Support

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- GitHub: https://github.com/support
