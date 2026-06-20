-- ============================================================
-- Young Writers Platform — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
-- Extended user data (supplements Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('child', 'parent', 'teacher')) DEFAULT 'child',
  age         INTEGER,
  language    TEXT DEFAULT 'en',
  parent_email TEXT,
  xp          INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pieces ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pieces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('story', 'poem', 'essay', 'opinion')),
  title        TEXT,
  content      TEXT NOT NULL,
  counter_arg  TEXT,
  prompt_used  TEXT,
  status       TEXT DEFAULT 'private' CHECK (status IN ('draft', 'private', 'community', 'contest')),
  word_count   INTEGER DEFAULT 0,
  language     TEXT DEFAULT 'en',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Community Posts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id    UUID REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  age_band    TEXT CHECK (age_band IN ('early', 'middle', 'teen')),
  hearts      INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'removed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reactions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT DEFAULT 'heart',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ── Badges ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id    TEXT NOT NULL,
  badge_name  TEXT,
  badge_emoji TEXT,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── Contests ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme         TEXT NOT NULL,
  emoji         TEXT,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  age_band_min  INTEGER DEFAULT 8,
  age_band_max  INTEGER DEFAULT 17,
  formats       TEXT[] DEFAULT '{story,poem}',
  status        TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'judging', 'closed')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contest Entries ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contest_entries (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id           UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  piece_id             UUID REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plagiarism_status    TEXT DEFAULT 'pending' CHECK (plagiarism_status IN ('pending', 'clean', 'flagged')),
  parent_consented_at  TIMESTAMPTZ,
  submitted_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- ── Moderation Flags ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('piece', 'comment')),
  content_id   UUID NOT NULL,
  flag_type    TEXT CHECK (flag_type IN ('troll', 'profanity', 'crisis', 'spam')),
  severity     TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────
-- Profiles: users can read their own, update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Pieces: users can CRUD their own; community pieces are readable by all authed users
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pieces_own" ON pieces FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "pieces_community_read" ON pieces FOR SELECT USING (status = 'community' AND auth.uid() IS NOT NULL);

-- Community posts: readable by all authed users
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Comments: readable by all authed
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Reactions: own only
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_read" ON reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reactions_own" ON reactions FOR ALL USING (auth.uid() = user_id);

-- Badges: own only
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Auto-create Profile on Signup ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, age, language, parent_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'parentEmail'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Sample Contest Data ───────────────────────────────────────
INSERT INTO contests (theme, emoji, start_at, end_at, age_band_min, age_band_max, formats)
VALUES
  ('Stories of Kindness', '💛', NOW(), NOW() + INTERVAL '25 days', 8, 17, '{story,poem}'),
  ('My City in 2050', '🏙️', NOW(), NOW() + INTERVAL '42 days', 11, 17, '{essay,story,opinion}')
ON CONFLICT DO NOTHING;
