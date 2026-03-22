# MatrixIN — Apply Schema to Supabase

## Step 1: Open the Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/mgmbbhfjawxlhfssnrbt/sql/new
2. Log in if prompted

## Step 2: Copy and Paste

Copy the entire content of:
`evting-hub/supabase/migrations/001_platform_schema.sql`

Paste it into the SQL editor and click **Run** (or press Ctrl+Enter).

## Step 3: Verify

After running, you should see tables like:
- `users`, `posts`, `likes`, `bookmarks`, `follows`
- `store_listings`, `projects`, `chat_rooms`, `messages`
- `notifications`, `dev_requests`, `feature_flags`
- `announcements`, `achievements`, `xp_events`

All with proper RLS policies and the `handle_new_user()` trigger that auto-creates
a user profile row when someone signs up via Supabase Auth.

## Step 4: Set OAuth Providers (Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/mgmbbhfjawxlhfssnrbt/auth/providers

Enable and configure:
- **GitHub** → Add Client ID + Secret from github.com/settings/developers
- **Google** → Add Client ID + Secret from console.cloud.google.com

## Step 5: Update .env.local

The `.env.local` already has the Supabase credentials — no changes needed.

## Step 6: Run the App

```bash
cd evting-hub
npm run dev
```

Visit http://localhost:3000
