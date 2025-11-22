# Turso Database Setup for Vercel Deployment

This guide will help you set up Turso (serverless SQLite) for deploying OBOB.dog to Vercel.

## Why Turso?

Vercel uses serverless functions which don't support traditional SQLite files (no persistent filesystem). Turso provides SQLite in the cloud, allowing you to keep the same SQLite syntax while deploying to Vercel.

## Step 1: Create a Turso Account

1. Go to [turso.tech](https://turso.tech/)
2. Sign up for a free account (generous free tier)
3. Install the Turso CLI (optional but recommended):
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Or use Homebrew
   brew install tursodatabase/tap/turso
   ```

## Step 2: Create a Database

### Option A: Using Turso CLI (Recommended)

```bash
# Login to Turso
turso auth login

# Create a database
turso db create obob-prod

# Get the database URL
turso db show obob-prod --url

# Create an auth token
turso db tokens create obob-prod
```

### Option B: Using Turso Dashboard

1. Go to [app.turso.tech](https://app.turso.tech/)
2. Click "Create Database"
3. Name it `obob-prod` (or your preferred name)
4. Select a location closest to your users
5. Copy the database URL (starts with `libsql://`)
6. Create an auth token from the database settings

## Step 3: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   SESSION_SECRET=<your-session-secret-from-env-local>
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token-here
   NODE_ENV=production
   ```

4. Make sure to set these for **Production**, **Preview**, and **Development** environments

## Step 4: Deploy to Vercel

```bash
# Push your changes
git push origin main

# Or deploy directly with Vercel CLI
vercel --prod
```

## Step 5: Database Will Auto-Initialize

The database schema will be created automatically on first request. No manual migrations needed!

## Local Development

For local development, you can continue using the local SQLite file:

1. **Don't** set `TURSO_DATABASE_URL` in your `.env.local`
2. The app will automatically use `file:obob.db` locally
3. Your local database is in the `.gitignore` and won't be committed

## Testing Turso Locally (Optional)

If you want to test with Turso before deploying:

1. Uncomment the Turso variables in `.env.local`:
   ```
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token-here
   ```

2. Run the app:
   ```bash
   pnpm run dev
   ```

3. The app will now use Turso instead of local SQLite

## Troubleshooting

### "Database not found" error

- Check that `TURSO_DATABASE_URL` starts with `libsql://`
- Verify the database name is correct in the URL

### "Authentication failed" error

- Regenerate your auth token: `turso db tokens create obob-prod`
- Make sure the token is set correctly in Vercel

### Schema not created

- The schema is created automatically on first database access
- Check the Vercel function logs for any initialization errors
- Verify the database URL and token are correct

## Turso Dashboard

Monitor your database:
- View at [app.turso.tech](https://app.turso.tech/)
- Check query stats, storage usage, and connection metrics
- Free tier: 9 GB storage, 1 billion row reads/month

## Migrating Existing Data

If you have local data you want to migrate to Turso:

1. Export from local SQLite:
   ```bash
   sqlite3 obob.db .dump > dump.sql
   ```

2. Import to Turso:
   ```bash
   turso db shell obob-prod < dump.sql
   ```

## Cost

Turso free tier includes:
- **3 databases**
- **9 GB total storage**
- **1 billion row reads/month**
- **25 million row writes/month**

This is more than enough for most OBOB teams!

## Support

- Turso Discord: [discord.gg/turso](https://discord.gg/turso)
- Turso Docs: [docs.turso.tech](https://docs.turso.tech/)
- OBOB.dog issues: Create an issue in this repository
