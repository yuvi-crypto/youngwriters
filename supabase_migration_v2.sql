-- ============================================================
-- Young Writers Platform — Migration v2
-- Run this in the Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ── 1. Add username to profiles ───────────────────────────────
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'email_account'
    CHECK (account_type IN ('email_account', 'username_account'));

-- Unique constraint on username (prevents duplicate student accounts)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique 
  ON profiles (username) WHERE username IS NOT NULL;

-- ── 2. Assignments (teacher-created tasks) ────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  format          TEXT NOT NULL CHECK (format IN ('story','poem','essay','opinion','image')),
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

-- ── 3. Submissions (student responses to assignments) ─────────
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title           TEXT,
  content         TEXT NOT NULL,
  word_count      INTEGER DEFAULT 0,
  image_used_id   TEXT,               -- which image they wrote from (if any)
  status          TEXT DEFAULT 'submitted' CHECK (status IN ('draft','submitted')),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)   -- one submission per student per assignment
);

-- ── 4. Evaluations (AI rubric scores per submission) ──────────
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

-- ── 5. Row Level Security ─────────────────────────────────────

-- Assignments: teachers can CRUD their own; students/parents can read active
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_teacher_all" ON assignments
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "assignments_student_read" ON assignments
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- Submissions: students can CRUD their own; teachers can read all for their assignments
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_own" ON submissions
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "submissions_teacher_read" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
  );

-- Evaluations: students can read their own; teachers can read for their assignments
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluations_student_read" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = evaluations.submission_id
        AND s.student_id = auth.uid()
    )
  );

CREATE POLICY "evaluations_insert" ON evaluations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "evaluations_teacher_read" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      WHERE s.id = evaluations.submission_id
        AND a.teacher_id = auth.uid()
    )
  );

-- ── 6. Update pieces table to support image-sprint type ───────
-- The check constraint needs to include 'image' format
ALTER TABLE pieces DROP CONSTRAINT IF EXISTS pieces_type_check;
ALTER TABLE pieces ADD CONSTRAINT pieces_type_check 
  CHECK (type IN ('story','poem','essay','opinion','image','image-sprint'));

-- ── 7. Storage bucket instructions ───────────────────────────
-- Run this manually in Supabase Dashboard → Storage:
-- 1. Create bucket: "assignment-images"  (set to PUBLIC)
-- 2. Create bucket: "sprint-images-uploads" (set to PUBLIC)
-- OR use the SQL below (requires storage extension):
-- INSERT INTO storage.buckets (id, name, public) 
--   VALUES ('assignment-images', 'assignment-images', true)
--   ON CONFLICT DO NOTHING;

-- ── 8. Helper: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assignments_updated_at ON assignments;
CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS submissions_updated_at ON submissions;
CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 9. Update handle_new_user to include username ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, age, language, parent_email, username, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'parentEmail',
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'email_account')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
