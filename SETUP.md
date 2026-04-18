# Setup Guide — Khmer POS

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project** → name it (e.g. `khmer-pos`)
3. Choose a strong database password and your nearest region
4. Wait for project creation (~2 minutes)

### Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. This creates all tables, RLS policies, and enables realtime

### Enable Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it is by default)

### Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon/public** key (under Project API keys)

### Set Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Quick Setup (Recommended)

Run the interactive setup script which creates your `.env`, manager account, and seeds data:

```bash
node scripts/setup.mjs
```

## 3. Manual Setup (Alternative)

### Seed the Database

```bash
node scripts/seedData.mjs
```

### Create Manager Account

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click **Add user** → enter email & password
3. Go to **Table Editor** → `staff` table
4. Insert a row: `id` = the user's UUID, `name`, `email`, `role: manager`, `active: true`

## 4. Run Locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/foodmenu-pos/`

Log in with your manager credentials. From Admin → Staff, you can create accounts for cashiers, waiters, and kitchen staff.

## 5. Deploy to GitHub Pages

### Set GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|------------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your anon/public key |

### Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: **GitHub Actions**

Now every push to `main` will auto-deploy via the workflow in `.github/workflows/deploy.yml`.

Live URL: `https://voraman.github.io/foodmenu-pos/`

## 6. Storage Setup (Optional)

For menu image uploads, create a storage bucket:

1. Go to Supabase dashboard → **Storage**
2. Click **New bucket** → name it `menu-images`
3. Set it to **Public** (so images can be served to the app)
4. Add a policy: allow authenticated users to upload
