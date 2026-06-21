-- ============================================================
-- Young Writers Platform — Migration v3
-- Run this in the Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ── 1. Update Profiles Table check constraint to support admin roles ──
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('child', 'parent', 'teacher', 'super_admin', 'trust_safety', 'contest_coordinator', 'school_manager'));

-- ── 2. Add email and teacher_id columns to profiles to support easy querying ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS teacher_id TEXT;

-- ── 3. Create Classrooms Table ──
CREATE TABLE IF NOT EXISTS classrooms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  teacher_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Create Schools Table (for Admin Panel) ──
CREATE TABLE IF NOT EXISTS schools (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  students     INTEGER DEFAULT 0,
  consent_rate INTEGER DEFAULT 100 CHECK (consent_rate BETWEEN 0 AND 100),
  manager_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Add classroom reference to assignments and submissions ──
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL;

-- ── 6. Add columns to contests for judging and integrity ──
ALTER TABLE contests ADD COLUMN IF NOT EXISTS judge TEXT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS integrity TEXT DEFAULT 'pending';

-- ── 7. Enable Row Level Security (RLS) on Classrooms, Schools, and Profiles ──
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classrooms_select_all" ON classrooms;
CREATE POLICY "classrooms_select_all" ON classrooms 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "classrooms_insert_teacher" ON classrooms;
CREATE POLICY "classrooms_insert_teacher" ON classrooms 
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "classrooms_update_teacher" ON classrooms;
CREATE POLICY "classrooms_update_teacher" ON classrooms 
  FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "classrooms_delete_teacher" ON classrooms;
CREATE POLICY "classrooms_delete_teacher" ON classrooms 
  FOR DELETE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "schools_select_all" ON schools;
CREATE POLICY "schools_select_all" ON schools 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "schools_admin_all" ON schools;
CREATE POLICY "schools_admin_all" ON schools 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('super_admin', 'school_manager')
    )
  );

-- Create policy to allow all authenticated users to read profiles
DROP POLICY IF EXISTS "profiles_select_auth" ON profiles;
CREATE POLICY "profiles_select_auth" ON profiles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policy to allow teachers to update child profiles (e.g. parent assignments)
DROP POLICY IF EXISTS "profiles_teacher_update" ON profiles;
CREATE POLICY "profiles_teacher_update" ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    ) 
    AND role = 'child'
  );

-- ── 8. Update handle_new_user trigger to save email and teacher_id ──
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

-- ── 9. Backfill emails for existing profiles ──
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- ── 10. Seed Sample Schools ──
INSERT INTO schools (name, city, students, consent_rate)
VALUES
  ('DPS Hyderabad', 'Hyderabad', 340, 97),
  ('Ganga Bhavani School', 'Warangal', 210, 88),
  ('Oakridge International', 'Hyderabad', 190, 100)
ON CONFLICT DO NOTHING;
