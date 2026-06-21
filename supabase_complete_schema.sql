-- ============================================================
-- Young Writers Platform — Complete Unified Supabase Schema
-- Run this in the Supabase SQL Editor (safe for new databases or re-runs)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Helper: Auto-update updated_at function ───────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Profiles Table ─────────────────────────────────────────
-- Extended user data (supplements Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('child', 'parent', 'teacher', 'super_admin', 'trust_safety', 'contest_coordinator', 'school_manager')) DEFAULT 'child',
  age          INTEGER,
  language     TEXT DEFAULT 'en',
  parent_email TEXT,
  xp           INTEGER DEFAULT 0,
  streak_days  INTEGER DEFAULT 0,
  last_active  DATE,
  username     TEXT,
  account_type TEXT DEFAULT 'email_account' CHECK (account_type IN ('email_account', 'username_account')),
  email        TEXT,
  teacher_id   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on username (prevents duplicate student accounts)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique 
  ON profiles (username) WHERE username IS NOT NULL;

-- ── 3. Pieces Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pieces (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('story','poem','essay','opinion','image','image-sprint')),
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

-- ── 4. Community Posts Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  piece_id    UUID REFERENCES pieces(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  age_band    TEXT CHECK (age_band IN ('early', 'middle', 'teen')),
  hearts      INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Comments Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'removed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Reactions Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT DEFAULT 'heart',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ── 7. Badges Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id    TEXT NOT NULL,
  badge_name  TEXT,
  badge_emoji TEXT,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ── 8. Contests Table ─────────────────────────────────────────
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
  judge         TEXT,
  integrity     TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Contest Entries Table ──────────────────────────────────
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

-- ── 10. Moderation Flags Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('piece', 'comment')),
  content_id   UUID NOT NULL,
  flag_type    TEXT CHECK (flag_type IN ('troll', 'profanity', 'crisis', 'spam')),
  severity     TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Create Classrooms Table ──
CREATE TABLE IF NOT EXISTS classrooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  teacher_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Create Schools Table (for Admin Panel) ──
CREATE TABLE IF NOT EXISTS schools (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  students     INTEGER DEFAULT 0,
  consent_rate INTEGER DEFAULT 100 CHECK (consent_rate BETWEEN 0 AND 100),
  manager_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. Assignments Table (Teacher tasks) ────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  classroom_id    UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  format          TEXT NOT NULL CHECK (format IN ('story','poem','essay','opinion','image','image-sprint')),
  prompt_text     TEXT,
  scaffold        JSONB,              -- array of section labels for essay/opinion
  image_url       TEXT,               -- null if no image
  image_source    TEXT DEFAULT 'none' CHECK (image_source IN ('none','curated','upload')),
  curated_image_id TEXT,              -- matches IMAGE_LIBRARY[].id
  target_age_band TEXT CHECK (target_age_band IN ('5-7','8-12','13-17','all')),
  due_date        TIMESTAMPTZ,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),
  allow_ai_assist BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 12. Submissions Table (Student replies to assignments) ─────
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id    UUID REFERENCES classrooms(id) ON DELETE SET NULL,
  title           TEXT,
  content         TEXT NOT NULL,
  word_count      INTEGER DEFAULT 0,
  image_used_id   TEXT,               -- which image they wrote from (if any)
  status          TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted')),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)   -- one submission per student per assignment
);

-- ── 13. Evaluations Table (AI rubrics per submission) ──────────
CREATE TABLE IF NOT EXISTS evaluations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id         UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  piece_id              UUID REFERENCES pieces(id) ON DELETE SET NULL,  -- for self-directed pieces
  evaluator             TEXT DEFAULT 'gemini-1.5-flash',
  -- Rubric dimensions (1=beginner, 2=developing, 3=proficient, 4=excellent)
  structure_score       NUMERIC(3,1) CHECK (structure_score BETWEEN 1 AND 4),
  vocabulary_score      NUMERIC(3,1) CHECK (vocabulary_score BETWEEN 1 AND 4),
  creativity_score      NUMERIC(3,1) CHECK (creativity_score BETWEEN 1 AND 4),
  prompt_adherence_score NUMERIC(3,1) CHECK (prompt_adherence_score BETWEEN 1 AND 4),
  voice_score           NUMERIC(3,1) CHECK (voice_score BETWEEN 1 AND 4),
  overall_score         NUMERIC(3,1),  -- computed average
  feedback_text         TEXT,
  growth_nudge          TEXT,
  strengths             TEXT[],        -- array of 2-3 strength chips
  age_band              TEXT,
  fallback_used         BOOLEAN DEFAULT false, -- true = AI failed, used rule-based
  evaluated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 14. Row Level Security (RLS) Policies ─────────────────────

-- Profiles: RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
DROP POLICY IF EXISTS "profiles_teacher_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Classrooms: RLS policies
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classrooms_select_all" ON classrooms;
DROP POLICY IF EXISTS "classrooms_insert_teacher" ON classrooms;
DROP POLICY IF EXISTS "classrooms_update_teacher" ON classrooms;
DROP POLICY IF EXISTS "classrooms_delete_teacher" ON classrooms;

CREATE POLICY "classrooms_select_all" ON classrooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "classrooms_insert_teacher" ON classrooms FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "classrooms_update_teacher" ON classrooms FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "classrooms_delete_teacher" ON classrooms FOR DELETE USING (auth.uid() = teacher_id);

-- Schools: RLS policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schools_select_all" ON schools;
DROP POLICY IF EXISTS "schools_admin_all" ON schools;

CREATE POLICY "schools_select_all" ON schools FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "schools_admin_all" ON schools FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'school_manager')
  )
);

-- Profiles select for all authenticated
CREATE POLICY "profiles_select_auth" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Profiles update for teacher to assign parent
CREATE POLICY "profiles_teacher_update" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  ) 
  AND role = 'child'
);

-- Pieces: CRUD own; community readable by all authenticated
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pieces_own" ON pieces;
DROP POLICY IF EXISTS "pieces_community_read" ON pieces;
CREATE POLICY "pieces_own" ON pieces FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "pieces_community_read" ON pieces FOR SELECT USING (status = 'community' AND auth.uid() IS NOT NULL);

-- Community posts: readable by all authed users, inserts only for own
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_read" ON community_posts;
DROP POLICY IF EXISTS "posts_insert" ON community_posts;
CREATE POLICY "posts_read" ON community_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Comments: readable by all authed, inserts only for own
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_read" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Reactions: readable by all authed, CRUD own
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_read" ON reactions;
DROP POLICY IF EXISTS "reactions_own" ON reactions;
CREATE POLICY "reactions_read" ON reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reactions_own" ON reactions FOR ALL USING (auth.uid() = user_id);

-- Badges: read own, insert own
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_read" ON user_badges;
DROP POLICY IF EXISTS "badges_insert" ON user_badges;
CREATE POLICY "badges_read" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badges_insert" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assignments: teachers can CRUD own; students/parents can read active
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignments_teacher_all" ON assignments;
DROP POLICY IF EXISTS "assignments_student_read" ON assignments;
CREATE POLICY "assignments_teacher_all" ON assignments FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "assignments_student_read" ON assignments FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Submissions: students can CRUD own; teachers can read for their assignments
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_own" ON submissions;
DROP POLICY IF EXISTS "submissions_teacher_read" ON submissions;
CREATE POLICY "submissions_own" ON submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "submissions_teacher_read" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid()
  )
);

-- Evaluations: students can read own; teachers can read for their assignments; allow authed insert
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evaluations_student_read" ON evaluations;
DROP POLICY IF EXISTS "evaluations_insert" ON evaluations;
DROP POLICY IF EXISTS "evaluations_teacher_read" ON evaluations;
CREATE POLICY "evaluations_student_read" ON evaluations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = evaluations.submission_id AND s.student_id = auth.uid()
  )
);
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "evaluations_teacher_read" ON evaluations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.id = evaluations.submission_id AND a.teacher_id = auth.uid()
  )
);

-- Parent Dashboard: RLS policies
DROP POLICY IF EXISTS "pieces_parent_read" ON pieces;
CREATE POLICY "pieces_parent_read" ON pieces FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = pieces.author_id 
      AND profiles.parent_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "submissions_parent_read" ON submissions;
CREATE POLICY "submissions_parent_read" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = submissions.student_id 
      AND profiles.parent_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "evaluations_parent_read" ON evaluations;
CREATE POLICY "evaluations_parent_read" ON evaluations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN profiles p ON p.id = s.student_id
    WHERE s.id = evaluations.submission_id 
      AND p.parent_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "evaluations_pieces_parent_read" ON evaluations;
CREATE POLICY "evaluations_pieces_parent_read" ON evaluations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM pieces p
    JOIN profiles pr ON pr.id = p.author_id
    WHERE p.id = evaluations.piece_id 
      AND pr.parent_email = (auth.jwt() ->> 'email')
  )
);


-- ── 15. Triggers: update_updated_at ──────────────────────────
DROP TRIGGER IF EXISTS assignments_updated_at ON assignments;
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS submissions_updated_at ON submissions;
CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 16. Trigger: Auto-create Profile on Signup ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, age, language, parent_email, username, account_type, email, teacher_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'parentEmail',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'email_account'),
    NEW.email,
    NEW.raw_user_meta_data->>'teacher_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    teacher_id = EXCLUDED.teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 17. Sample Contest Data ───────────────────────────────────
INSERT INTO contests (theme, emoji, start_at, end_at, age_band_min, age_band_max, formats)
VALUES
  ('Stories of Kindness', '💛', NOW(), NOW() + INTERVAL '25 days', 8, 17, '{story,poem}'),
  ('My City in 2050', '🏙️', NOW(), NOW() + INTERVAL '42 days', 11, 17, '{essay,story,opinion}')
ON CONFLICT DO NOTHING;
