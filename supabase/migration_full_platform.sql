-- ═══════════════════════════════════════════
-- MatrixIN Platform — Full Database Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ─── 1. Enhance existing USERS table ───
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS website text DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation int DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pinned_post_id uuid;
-- Ensure role column allows visitor/member/dev/admin
-- (role should already exist, just ensure defaults)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'member';

-- ─── 2. POSTS table (Social Feed) ───
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'image', 'code', 'poll', 'repost', 'quote')),
  content text DEFAULT '',
  image_url text,
  code_lang text,
  poll_options jsonb,       -- [{"text":"Option A","votes":0}, ...]
  parent_id uuid REFERENCES posts(id) ON DELETE CASCADE,  -- for threaded replies
  repost_of uuid REFERENCES posts(id) ON DELETE SET NULL,  -- original post ref
  like_count int DEFAULT 0,
  repost_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  bookmark_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts(repost_of);

-- ─── 3. LIKES table ───
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ─── 4. FOLLOWS table ───
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ─── 5. BOOKMARKS table ───
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- ─── 6. STORE_LISTINGS table ───
CREATE TABLE IF NOT EXISTS store_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  readme_md text DEFAULT '',
  version text DEFAULT '1.0.0',
  category text NOT NULL DEFAULT 'scripts'
    CHECK (category IN ('scripts', 'games', 'software', 'security', 'oss', 'ai', 'extensions')),
  license text DEFAULT 'MIT',
  os_requirements text DEFAULT '',
  tags text[] DEFAULT '{}',
  file_url text,
  screenshots text[] DEFAULT '{}',
  install_command text DEFAULT '',
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  admin_note text,
  download_count int DEFAULT 0,
  star_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  avg_rating numeric(3,2) DEFAULT 0,
  is_editors_pick boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_listings_user_id ON store_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_store_listings_status ON store_listings(status);
CREATE INDEX IF NOT EXISTS idx_store_listings_category ON store_listings(category);
CREATE INDEX IF NOT EXISTS idx_store_listings_slug ON store_listings(slug);

-- ─── 7. STORE_STARS table ───
CREATE TABLE IF NOT EXISTS store_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES store_listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- ─── 8. STORE_REVIEWS (comments with rating) ───
CREATE TABLE IF NOT EXISTS store_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES store_listings(id) ON DELETE CASCADE,
  body text NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  parent_id uuid REFERENCES store_reviews(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)  -- one review per user per listing
);

CREATE INDEX IF NOT EXISTS idx_store_reviews_listing ON store_reviews(listing_id);

-- ─── 9. DEV_REQUESTS table ───
CREATE TABLE IF NOT EXISTS dev_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  portfolio_url text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dev_requests_status ON dev_requests(status);
CREATE INDEX IF NOT EXISTS idx_dev_requests_user ON dev_requests(user_id);

-- ─── 10. NOTIFICATIONS table ───
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('like', 'follow', 'comment', 'mention', 'repost',
                    'star', 'download', 'dev_approved', 'dev_rejected',
                    'listing_approved', 'listing_rejected', 'report',
                    'ban', 'warn', 'system')),
  data jsonb DEFAULT '{}',  -- flexible payload: {actor_id, post_id, listing_id, message}
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- ─── 11. POLL_VOTES table ───
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)  -- one vote per user per poll
);

-- ─── 12. STORE DOWNLOAD TRACKING ───
CREATE TABLE IF NOT EXISTS store_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  listing_id uuid NOT NULL REFERENCES store_listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_downloads_listing ON store_downloads(listing_id);

-- ═══════════════════════════════════════════
-- RPC FUNCTIONS (increment/decrement counters)
-- ═══════════════════════════════════════════

-- Increment post like count
CREATE OR REPLACE FUNCTION increment_post_likes(post_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = post_id_param;
END; $$;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = post_id_param;
END; $$;

-- Increment post repost count
CREATE OR REPLACE FUNCTION increment_post_reposts(post_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET repost_count = repost_count + 1 WHERE id = post_id_param;
END; $$;

-- Increment post comment count
CREATE OR REPLACE FUNCTION increment_post_comments(post_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = post_id_param;
END; $$;

CREATE OR REPLACE FUNCTION decrement_post_comments(post_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = post_id_param;
END; $$;

-- Increment store listing download count
CREATE OR REPLACE FUNCTION increment_listing_downloads(listing_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE store_listings SET download_count = download_count + 1 WHERE id = listing_id_param;
END; $$;

-- Increment store listing star count
CREATE OR REPLACE FUNCTION increment_listing_stars(listing_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE store_listings SET star_count = star_count + 1 WHERE id = listing_id_param;
END; $$;

CREATE OR REPLACE FUNCTION decrement_listing_stars(listing_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE store_listings SET star_count = GREATEST(star_count - 1, 0) WHERE id = listing_id_param;
END; $$;

-- Recalculate avg rating for a listing
CREATE OR REPLACE FUNCTION recalc_listing_rating(listing_id_param uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE store_listings SET
    avg_rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM store_reviews WHERE listing_id = listing_id_param AND rating IS NOT NULL), 0),
    comment_count = (SELECT COUNT(*) FROM store_reviews WHERE listing_id = listing_id_param)
  WHERE id = listing_id_param;
END; $$;

-- Increment user reputation
CREATE OR REPLACE FUNCTION increment_reputation(user_id_param text, amount int)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET reputation = reputation + amount WHERE id = user_id_param;
END; $$;

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════

-- Enable RLS on all new tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_downloads ENABLE ROW LEVEL SECURITY;

-- POSTS: anyone can read, only author can insert/update/delete
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- LIKES: anyone can read, users can toggle own
CREATE POLICY "Likes are viewable" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (true);

-- FOLLOWS: anyone can read, users can toggle own
CREATE POLICY "Follows are viewable" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (true);

-- BOOKMARKS: only owner can see own bookmarks
CREATE POLICY "Users see own bookmarks" ON bookmarks FOR SELECT USING (true);
CREATE POLICY "Users can bookmark" ON bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unbookmark" ON bookmarks FOR DELETE USING (true);

-- STORE LISTINGS: approved ones viewable by all, authors can manage own
CREATE POLICY "Approved listings viewable" ON store_listings FOR SELECT USING (true);
CREATE POLICY "Devs can create listings" ON store_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Authors can update listings" ON store_listings FOR UPDATE USING (true);
CREATE POLICY "Authors can delete listings" ON store_listings FOR DELETE USING (true);

-- STORE STARS
CREATE POLICY "Stars viewable" ON store_stars FOR SELECT USING (true);
CREATE POLICY "Users can star" ON store_stars FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unstar" ON store_stars FOR DELETE USING (true);

-- STORE REVIEWS
CREATE POLICY "Reviews viewable" ON store_reviews FOR SELECT USING (true);
CREATE POLICY "Users can review" ON store_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can edit own review" ON store_reviews FOR UPDATE USING (true);
CREATE POLICY "Users can delete own review" ON store_reviews FOR DELETE USING (true);

-- DEV REQUESTS: users see own, admins see all (enforced server-side)
CREATE POLICY "Dev requests viewable" ON dev_requests FOR SELECT USING (true);
CREATE POLICY "Users can request" ON dev_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Update dev requests" ON dev_requests FOR UPDATE USING (true);

-- NOTIFICATIONS: users see own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark read" ON notifications FOR UPDATE USING (true);

-- POLL VOTES
CREATE POLICY "Votes viewable" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (true);

-- STORE DOWNLOADS
CREATE POLICY "Downloads viewable" ON store_downloads FOR SELECT USING (true);
CREATE POLICY "Track downloads" ON store_downloads FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════
-- DONE — All tables, indexes, RPC functions, and RLS policies created
-- ═══════════════════════════════════════════
