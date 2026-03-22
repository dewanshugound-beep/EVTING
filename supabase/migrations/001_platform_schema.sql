-- ==============================================================================
-- MatrixIN Platform Schema — Migration 001
-- Creator: Devanshu Gound (@its.devanshu_)
-- 9th-grade dev from a village. Interests: UI, Blender, creative code.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('visitor', 'member', 'dev', 'certified_dev', 'moderator', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE theme_enum AS ENUM ('dark', 'light', 'hacker'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE post_type AS ENUM ('text', 'image', 'gif', 'video', 'code', 'link', 'poll', 'meme', 'voice', 'shared_tool', 'shared_post', 'reply_gif'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audience_type AS ENUM ('public', 'followers', 'mentioned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_status AS ENUM ('open', 'resolved', 'dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'flagged'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_visibility AS ENUM ('open', 'private'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE cert_status AS ENUM ('none', 'pending', 'certified', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_member_role AS ENUM ('owner', 'maintainer', 'contributor', 'observer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_column AS ENUM ('backlog', 'todo', 'inprogress', 'review', 'done'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE discussion_type AS ENUM ('question', 'announcement', 'idea', 'bug'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE dev_target_role AS ENUM ('dev', 'certified_dev'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE chat_room_type AS ENUM ('public', 'project', 'dm', 'group_dm'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE msg_type AS ENUM ('text', 'image', 'gif', 'voice', 'code', 'video', 'link', 'poll', 'shared_tool'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'maintenance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role user_role DEFAULT 'member',
    avatar_url TEXT,
    banner_url TEXT,
    bio VARCHAR(160),
    location TEXT,
    website TEXT,
    pronouns TEXT,
    skills TEXT[],
    interests TEXT[],
    social_links JSONB DEFAULT '{}'::jsonb,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    reputation INT DEFAULT 0,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_until TIMESTAMPTZ,
    warn_count INT DEFAULT 0,
    is_email_verified BOOLEAN DEFAULT false,
    referral_code TEXT UNIQUE,
    referred_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    theme theme_enum DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POSTS
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type post_type NOT NULL DEFAULT 'text',
    content TEXT,
    image_urls TEXT[],
    gif_url TEXT,
    video_url TEXT,
    code_content TEXT,
    code_language TEXT,
    link_url TEXT,
    link_preview JSONB,
    poll_options JSONB,
    poll_end_at TIMESTAMPTZ,
    parent_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    repost_of UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_pinned BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    audience audience_type DEFAULT 'public',
    status post_status DEFAULT 'published',
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    dislike_count INT DEFAULT 0,
    repost_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCIAL
CREATE TABLE IF NOT EXISTS public.likes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, post_id));
CREATE TABLE IF NOT EXISTS public.dislikes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, post_id));
CREATE TABLE IF NOT EXISTS public.bookmarks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, post_id));
CREATE TABLE IF NOT EXISTS public.follows (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE, following_id UUID REFERENCES public.users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(follower_id, following_id));
CREATE TABLE IF NOT EXISTS public.hashtag_follows (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, hashtag TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, hashtag));
CREATE TABLE IF NOT EXISTS public.blocks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE, blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(blocker_id, blocked_id));
CREATE TABLE IF NOT EXISTS public.reactions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, emoji VARCHAR(10) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, post_id, emoji));
CREATE TABLE IF NOT EXISTS public.poll_votes (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, option_index INT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, post_id));
CREATE TABLE IF NOT EXISTS public.reports (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL, target_type TEXT NOT NULL, target_id UUID NOT NULL, reason TEXT NOT NULL, detail TEXT, status report_status DEFAULT 'open', admin_note TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

-- STORE
CREATE TABLE IF NOT EXISTS public.store_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT NOT NULL,
    description_md TEXT,
    category TEXT NOT NULL,
    tags TEXT[],
    license TEXT,
    os_requirements TEXT[],
    language TEXT[],
    version TEXT NOT NULL DEFAULT '1.0.0',
    file_url TEXT,
    file_size BIGINT,
    file_hash TEXT,
    screenshots TEXT[],
    readme_md TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    status listing_status DEFAULT 'pending',
    download_count INT DEFAULT 0,
    star_count INT DEFAULT 0,
    fork_count INT DEFAULT 0,
    virus_scan_status TEXT DEFAULT 'pending',
    virus_scan_result JSONB,
    is_paid BOOLEAN DEFAULT false,
    stripe_product_id TEXT,
    forked_from UUID REFERENCES public.store_listings(id) ON DELETE SET NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.listing_versions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, version TEXT NOT NULL, changelog TEXT, file_url TEXT NOT NULL, file_size BIGINT, file_hash TEXT, download_count INT DEFAULT 0, released_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.listing_stars (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, listing_id));
CREATE TABLE IF NOT EXISTS public.listing_forks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, original_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.listing_purchases (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, stripe_session_id TEXT UNIQUE, amount DECIMAL(10,2) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.reviews (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, rating INT CHECK(rating >= 1 AND rating <= 5) NOT NULL, body TEXT, is_verified_purchaser BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, listing_id));
CREATE TABLE IF NOT EXISTS public.collections (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, is_public BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.collection_items (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE, listing_id UUID REFERENCES public.store_listings(id) ON DELETE CASCADE, added_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(collection_id, listing_id));

-- PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_md TEXT,
    cover_image TEXT,
    logo TEXT,
    category TEXT,
    tags TEXT[],
    tech_stack TEXT[],
    visibility project_visibility DEFAULT 'open',
    license TEXT,
    github_url TEXT,
    is_certified BOOLEAN DEFAULT false,
    cert_status cert_status DEFAULT 'none',
    cert_note TEXT,
    star_count INT DEFAULT 0,
    member_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.project_members (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, role project_member_role DEFAULT 'observer', joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(project_id, user_id));
CREATE TABLE IF NOT EXISTS public.project_join_requests (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, reason TEXT, skills TEXT, portfolio_url TEXT, status request_status DEFAULT 'pending', reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, reviewer_note TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), resolved_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS public.project_files (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL, filename TEXT NOT NULL, path TEXT NOT NULL, file_url TEXT NOT NULL, file_size BIGINT, mime_type TEXT, version INT DEFAULT 1, previous_version_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.project_tasks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT, column_id task_column DEFAULT 'backlog', priority task_priority DEFAULT 'medium', tags TEXT[], due_date TIMESTAMPTZ, estimated_hours DECIMAL(6,2), actual_hours DECIMAL(6,2), position INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.project_discussions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, title TEXT NOT NULL, body_md TEXT NOT NULL, type discussion_type DEFAULT 'question', is_pinned BOOLEAN DEFAULT false, is_solved BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.project_milestones (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, due_date TIMESTAMPTZ, is_completed BOOLEAN DEFAULT false, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.project_stars (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, project_id));

-- CHAT
CREATE TABLE IF NOT EXISTS public.chat_rooms (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT, slug TEXT UNIQUE, type chat_room_type NOT NULL, project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL, description TEXT, avatar_url TEXT, is_private BOOLEAN DEFAULT false, slow_mode_seconds INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.chat_members (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, role TEXT DEFAULT 'member', joined_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(room_id, user_id));
CREATE TABLE IF NOT EXISTS public.messages (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, content TEXT, type msg_type DEFAULT 'text', file_url TEXT, gif_url TEXT, voice_url TEXT, link_preview JSONB, reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL, reactions JSONB DEFAULT '{}'::jsonb, is_edited BOOLEAN DEFAULT false, is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());

-- NOTIFICATIONS & GAMIFICATION
CREATE TABLE IF NOT EXISTS public.notifications (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, type TEXT NOT NULL, data JSONB DEFAULT '{}'::jsonb, is_read BOOLEAN DEFAULT false, reference_id UUID, reference_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.dev_requests (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, reason TEXT NOT NULL, portfolio_url TEXT, skills TEXT, status request_status DEFAULT 'pending', target_role dev_target_role NOT NULL DEFAULT 'dev', admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL, admin_note TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), resolved_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS public.achievements (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, badge_key TEXT NOT NULL, earned_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, badge_key));
CREATE TABLE IF NOT EXISTS public.xp_events (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, action TEXT NOT NULL, xp_amount INT NOT NULL, reference_id UUID, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.referrals (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE, referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE, signed_up_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.login_streaks (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE, current_streak INT DEFAULT 0, longest_streak INT DEFAULT 0, last_login_date DATE, updated_at TIMESTAMPTZ DEFAULT NOW());

-- PLATFORM MANAGEMENT
CREATE TABLE IF NOT EXISTS public.feature_flags (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), key TEXT UNIQUE NOT NULL, value BOOLEAN DEFAULT false, description TEXT, updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.announcements (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, body TEXT NOT NULL, type announcement_type DEFAULT 'info', start_at TIMESTAMPTZ NOT NULL, end_at TIMESTAMPTZ NOT NULL, target_role TEXT DEFAULT 'all', is_dismissible BOOLEAN DEFAULT true, created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.api_keys (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, key_hash TEXT UNIQUE NOT NULL, name TEXT NOT NULL, last_used TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), is_revoked BOOLEAN DEFAULT false, rate_limit_tier TEXT DEFAULT 'free');
CREATE TABLE IF NOT EXISTS public.scheduled_posts (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, scheduled_for TIMESTAMPTZ NOT NULL, is_sent BOOLEAN DEFAULT false);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON public.posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_store_status ON public.store_listings(status);
CREATE INDEX IF NOT EXISTS idx_store_category ON public.store_listings(category);
CREATE INDEX IF NOT EXISTS idx_store_downloads ON public.store_listings(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_store_created ON public.store_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_xp_user_id ON public.xp_events(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS: users
CREATE POLICY "Anyone can view public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS: posts
CREATE POLICY "Public posts visible to all" ON public.posts FOR SELECT USING (status = 'published' AND audience = 'public');
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS: likes/dislikes/bookmarks/reactions/poll_votes
CREATE POLICY "Users see own likes" ON public.likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users like posts" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike posts" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own dislikes" ON public.dislikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users dislike posts" ON public.dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove dislikes" ON public.dislikes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users bookmark posts" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "Users see own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users block others" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users unblock" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "Anyone can view reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users add reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see own votes" ON public.poll_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users vote on polls" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: store_listings
CREATE POLICY "Approved listings visible to all" ON public.store_listings FOR SELECT USING (status = 'approved');
CREATE POLICY "Authors see own listings" ON public.store_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Dev users create listings" ON public.store_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dev users update own listings" ON public.store_listings FOR UPDATE USING (auth.uid() = user_id);

-- RLS: listing_stars
CREATE POLICY "Anyone can view stars" ON public.listing_stars FOR SELECT USING (true);
CREATE POLICY "Users star listings" ON public.listing_stars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unstar listings" ON public.listing_stars FOR DELETE USING (auth.uid() = user_id);

-- RLS: reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users submit reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- RLS: collections
CREATE POLICY "Public collections visible to all" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users create collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Collection items follow collection visibility" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public = true OR c.user_id = auth.uid()))
);
CREATE POLICY "Collection owners add items" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Collection owners remove items" ON public.collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);

-- RLS: projects
CREATE POLICY "Open projects visible to all" ON public.projects FOR SELECT USING (visibility = 'open');
CREATE POLICY "Private projects visible to members" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid())
);
CREATE POLICY "Dev users create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners update projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

-- RLS: project_members
CREATE POLICY "Project members visible to all project members" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.visibility = 'open')
);

-- RLS: chat_rooms
CREATE POLICY "Public chat rooms visible to all" ON public.chat_rooms FOR SELECT USING (is_private = false);
CREATE POLICY "Private room members can view" ON public.chat_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.room_id = id AND cm.user_id = auth.uid())
);
CREATE POLICY "Users create community rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- RLS: messages
CREATE POLICY "Room members can view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.room_id = room_id AND cm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.chat_rooms cr WHERE cr.id = room_id AND cr.is_private = false)
);
CREATE POLICY "Room members can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.room_id = room_id AND cm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.chat_rooms cr WHERE cr.id = room_id AND cr.is_private = false)
  )
);
CREATE POLICY "Users edit own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- RLS: notifications
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications (mark read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS: dev_requests
CREATE POLICY "Users see own dev requests" ON public.dev_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users submit dev requests" ON public.dev_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: achievements, xp_events
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view xp history" ON public.xp_events FOR SELECT USING (true);

-- RLS: api_keys
CREATE POLICY "Users see own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users revoke own api keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER store_listings_updated_at BEFORE UPDATE ON public.store_listings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _username TEXT;
  _referral TEXT;
BEGIN
  -- Generate unique username from email
  _username := split_part(NEW.email, '@', 1);
  -- Make it unique if needed
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = _username) LOOP
    _username := _username || floor(random() * 9000 + 1000)::text;
  END LOOP;

  -- Generate unique referral code
  _referral := upper(substring(md5(NEW.id::text) FROM 1 FOR 8));

  INSERT INTO public.users (id, email, username, display_name, referral_code, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    _username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    _referral,
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- HELPER RPC FUNCTIONS (used by server actions)
-- ==============================================================================
CREATE OR REPLACE FUNCTION increment_post_likes(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET like_count = like_count + 1 WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET like_count = GREATEST(0, like_count - 1) WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_reposts(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET repost_count = repost_count + 1 WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_reposts(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET repost_count = GREATEST(0, repost_count - 1) WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_comments(post_id_param UUID)
RETURNS void AS $$
  UPDATE public.posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = post_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_reputation(user_id_param UUID, amount INT DEFAULT 1)
RETURNS void AS $$
  UPDATE public.users SET reputation = reputation + amount WHERE id = user_id_param;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_xp(user_id_param UUID, action_param TEXT, xp_param INT, ref_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  new_xp INT;
  new_level INT;
BEGIN
  -- Add XP event
  INSERT INTO public.xp_events (user_id, action, xp_amount, reference_id)
  VALUES (user_id_param, action_param, xp_param, ref_id);
  
  -- Update user XP
  UPDATE public.users SET xp = xp + xp_param WHERE id = user_id_param
  RETURNING xp INTO new_xp;
  
  -- Recalculate level
  new_level := CASE
    WHEN new_xp >= 60000 THEN 8
    WHEN new_xp >= 25000 THEN 7
    WHEN new_xp >= 10000 THEN 6
    WHEN new_xp >= 4000 THEN 5
    WHEN new_xp >= 1500 THEN 4
    WHEN new_xp >= 500 THEN 3
    WHEN new_xp >= 100 THEN 2
    ELSE 1
  END;
  
  UPDATE public.users SET level = new_level WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- DEFAULT FEATURE FLAGS
-- ==============================================================================
INSERT INTO public.feature_flags (key, value, description) VALUES
  ('paid_listings', false, 'Enable paid tool listings with Stripe'),
  ('guest_access', true, 'Allow guest/visitor browsing'),
  ('registrations_open', true, 'Allow new user registrations'),
  ('store_submissions', true, 'Allow Devs to submit to the store'),
  ('certification_applications', true, 'Allow project certification requests'),
  ('maintenance_mode', false, 'Show maintenance page to non-admins')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- DEFAULT PUBLIC CHAT ROOMS
-- ==============================================================================
INSERT INTO public.chat_rooms (name, slug, type, is_private, description) VALUES
  ('General', 'general', 'public', false, 'Welcome to MatrixIN! Chat about anything.'),
  ('Security', 'security', 'public', false, 'Discuss pentesting, OSINT, and cybersecurity.'),
  ('GameDev', 'gamedev', 'public', false, 'Game development and design chat.'),
  ('AI & ML', 'ai-ml', 'public', false, 'Artificial intelligence and machine learning.'),
  ('Random', 'random', 'public', false, 'Off-topic conversations and memes.')
ON CONFLICT (slug) DO NOTHING;
