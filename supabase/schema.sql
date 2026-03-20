-- ─── USERS (synced from Clerk via webhook) ───
alter table public.users add column if not exists message_count int default 0;

-- ─── SITE STATS (Analytics) ───
create table if not exists public.site_stats (
  id int primary key default 1,
  visitor_count int default 0,
  updated_at timestamptz default now(),
  check (id = 1) -- Ensure only one row exists
);

-- Seed site stats
insert into public.site_stats (id, visitor_count) values (1, 0) on conflict (id) do nothing;

-- Function to increment message count
create or replace function public.handle_new_message()
returns trigger as $$
begin
  update public.users
  set message_count = message_count + 1
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new messages
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- RPC for Visitor Counter
create or replace function public.increment_visitor_count()
returns void as $$
begin
  update public.site_stats
  set visitor_count = visitor_count + 1,
      updated_at = now()
  where id = 1;
end;
$$ language plpgsql security definer;

-- RLS for Site Stats
alter table public.site_stats enable row level security;
create policy "Admins can view site stats" on public.site_stats for select using (
  exists (select 1 from public.users where id = auth.uid()::text and role = 'admin')
);
create table if not exists public.users (
  id text primary key,
  email text unique,
  username text unique,
  display_name text,
  avatar_url text,
  banner_url text,
  bio text default '',
  youtube_url text,
  role text default 'user' check (role in ('user','admin')),
  xp int default 0,
  rank text default 'Novice',
  is_online boolean default false,
  is_banned boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- ─── FOLLOWS ───
create table if not exists public.follows (
  follower_id text references public.users(id) on delete cascade,
  following_id text references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- ─── PROJECTS ───
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text default '',
  readme_md text default '',
  cover_url text,
  tags text[] default '{}',
  external_links jsonb default '[]',
  install_command text,
  is_official boolean default false,
  is_published boolean default true,
  view_count int default 0,
  star_count int default 0,
  comment_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── STARS ───
create table if not exists public.stars (
  user_id text references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, project_id)
);

-- ─── COMMENTS ───
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id text references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ─── CHANNELS (chat rooms) ───
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'public' check (type in ('public','dm','squad')),
  created_at timestamptz default now()
);

-- ─── CHANNEL MEMBERS ───
create table if not exists public.channel_members (
  channel_id uuid references public.channels(id) on delete cascade,
  user_id text references public.users(id) on delete cascade,
  last_read_at timestamptz default now(),
  primary key (channel_id, user_id)
);

-- ─── MESSAGES ───
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references public.channels(id) on delete cascade,
  user_id text references public.users(id) on delete cascade,
  body text not null,
  is_broadcast boolean default false,
  sender_name text,
  created_at timestamptz default now()
);

-- ─── MESSAGE REACTIONS ───
create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  user_id text references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (message_id, user_id, emoji)
);

-- ─── PROJECT VIEWS (analytics) ───
create table if not exists public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  viewer_id text,
  viewed_at timestamptz default now()
);

-- Projects Table (Matrix Vault)
create table public.projects_vault (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text not null,
  category text check (category in ('Hacking', 'APK', 'Script', 'Tool')) default 'Tool',
  downloads int default 0,
  created_at timestamptz default now()
);

-- Reports Table (Oracle's Eye)
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id text references public.users(id) on delete cascade not null,
  content_id uuid not null, -- Can be a message_id or project_id
  content_type text check (content_type in ('message', 'project')) not null,
  reason text,
  status text check (status in ('pending', 'dismissed', 'resolved')) default 'pending',
  created_at timestamptz default now()
);

-- ─── INDEXES ───
create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_stars_project on public.stars(project_id);
create index if not exists idx_comments_project on public.comments(project_id);
create index if not exists idx_messages_channel on public.messages(channel_id);
create index if not exists idx_project_views_project on public.project_views(project_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- ─── SEED DEFAULT CHANNELS ───
insert into public.channels (name, type) values
  ('General', 'public'),
  ('Dev Talk', 'public'),
  ('Squad Finder', 'squad')
on conflict do nothing;

-- ─── ENABLE REALTIME ───
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.channel_members;

-- ─── RPC FUNCTIONS ───

-- Increment XP
create or replace function public.increment_xp(user_id_param text, amount int)
returns void as $$
begin
  update public.users
  set xp = xp + amount
  where id = user_id_param;
end;
$$ language plpgsql security definer;

-- Project Star Count
create or replace function public.increment_star_count(project_id_param uuid)
returns void as $$
begin
  update public.projects
  set star_count = star_count + 1
  where id = project_id_param;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_star_count(project_id_param uuid)
returns void as $$
begin
  update public.projects
  set star_count = greatest(0, star_count - 1)
  where id = project_id_param;
end;
$$ language plpgsql security definer;

-- Project Comment Count
create or replace function public.increment_comment_count(project_id_param uuid)
returns void as $$
begin
  update public.projects
  set comment_count = comment_count + 1
  where id = project_id_param;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_comment_count(project_id_param uuid)
returns void as $$
begin
  update public.projects
  set comment_count = greatest(0, comment_count - 1)
  where id = project_id_param;
end;
$$ language plpgsql security definer;

-- Project View Count
create or replace function public.increment_view_count(project_id_param uuid)
returns void as $$
begin
  update public.projects
  set view_count = view_count + 1
  where id = project_id_param;
end;
$$ language plpgsql security definer;

-- ─── ROW LEVEL SECURITY (RLS) ───

-- Enable RLS
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.stars enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.projects_vault enable row level security;
alter table public.reports enable row level security;

-- Users: Anyone can read, only users can update their own profile
-- ... (existing users policies)

-- Projects Vault: Public Select, Authenticated Insert/Delete own
create policy "Vault projects are viewable by everyone" on public.projects_vault for select using (true);
create policy "Users can insert into vault" on public.projects_vault for insert with check (auth.uid()::text = user_id);
create policy "Users can delete from vault" on public.projects_vault for delete using (auth.uid()::text = user_id);

-- Reports: Authenticated Insert, Admin Select
create policy "Users can submit reports" on public.reports for insert with check (auth.uid()::text = reporter_id);
create policy "Admins can manage reports" on public.reports for all using (
  exists (select 1 from public.users where id = auth.uid()::text and role = 'admin')
);

-- Users: Anyone can read, only users can update their own profile
create policy "Public profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can update their own profile" on public.users for update using (auth.uid()::text = id);

-- Projects: Anyone can read, owners can manage
create policy "Projects are viewable by everyone" on public.projects for select using (is_published = true or (auth.uid()::text = user_id));
create policy "Users can insert their own projects" on public.projects for insert with check (auth.uid()::text = user_id);
create policy "Users can update their own projects" on public.projects for update using (auth.uid()::text = user_id);
create policy "Users can delete their own projects" on public.projects for delete using (auth.uid()::text = user_id);

-- Stars: Anyone can see, authenticated can toggle
create policy "Stars are viewable by everyone" on public.stars for select using (true);
create policy "Users can manage their own stars" on public.stars for all using (auth.uid()::text = user_id);

-- Comments: Anyone can see, authenticated can manage own
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can insert their own comments" on public.comments for insert with check (auth.uid()::text = user_id);
create policy "Users can delete their own comments" on public.comments for delete using (auth.uid()::text = user_id);
