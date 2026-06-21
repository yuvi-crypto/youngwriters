-- ============================================================
-- Young Writers Platform — Migration v4 (Parent Dashboard RLS)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── 1. Enable parent to read pieces written by their child ──
DROP POLICY IF EXISTS "pieces_parent_read" ON pieces;
CREATE POLICY "pieces_parent_read" ON pieces FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = pieces.author_id 
      AND profiles.parent_email = (auth.jwt() ->> 'email')
  )
);

-- ── 2. Enable parent to read submissions written by their child ──
DROP POLICY IF EXISTS "submissions_parent_read" ON submissions;
CREATE POLICY "submissions_parent_read" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = submissions.student_id 
      AND profiles.parent_email = (auth.jwt() ->> 'email')
  )
);

-- ── 3. Enable parent to create and manage assignments (practice tasks) ──
-- We already have assignments_teacher_all: auth.uid() = teacher_id.
-- Since a parent has a user account, if the parent creates an assignment,
-- auth.uid() = teacher_id will naturally evaluate to true, allowing the parent to CRUD their own practice tasks.

-- ── 4. Enable parent to read evaluations of their child's submissions ──
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

-- ── 5. Rebind Submissions student_id to Profiles table instead of auth.users ──
-- This enables PostgREST to resolve the relationship between submissions and profiles
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_student_id_fkey;
ALTER TABLE public.submissions 
  ADD CONSTRAINT submissions_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
