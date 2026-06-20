-- ============================================================
-- Young Writers Platform — Seed Test Accounts (Fixed v2)
-- Run this in the Supabase SQL Editor (safe to re-run)
--
-- Password for all accounts is: password123
-- ============================================================

-- ── 1. Enable pgcrypto extension ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Clean up any existing seed users to prevent duplication ─
DELETE FROM auth.users WHERE email IN (
  'teacher@yw.local', 
  'parent@yw.local', 
  'student_charlie@yw-students.local'
);

-- ── 3. Insert users and identities ────────────────────────────
DO $$ 
DECLARE 
  v_teacher_id UUID := '11111111-1111-1111-1111-111111111111';
  v_parent_id  UUID := '22222222-2222-2222-2222-222222222222';
  v_student_id UUID := '33333333-3333-3333-3333-333333333333';
  v_encrypted_pw TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  -- A. TEACHER ACCOUNT
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change_token_new, email_change_token_current, recovery_token, 
    phone_change_token, email_change, phone_change, reauthentication_token, phone
  ) VALUES (
    v_teacher_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'teacher@yw.local', v_encrypted_pw, NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Teacher Alice","role":"teacher","account_type":"email_account"}', 
    NOW(), NOW(),
    '', '', '', '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    v_teacher_id, v_teacher_id, 
    jsonb_build_object('sub', v_teacher_id, 'email', 'teacher@yw.local'), 
    'email', 'teacher@yw.local', 
    NOW(), NOW()
  );

  -- B. PARENT ACCOUNT
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change_token_new, email_change_token_current, recovery_token, 
    phone_change_token, email_change, phone_change, reauthentication_token, phone
  ) VALUES (
    v_parent_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'parent@yw.local', v_encrypted_pw, NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Parent Bob","role":"parent","account_type":"email_account"}', 
    NOW(), NOW(),
    '', '', '', '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    v_parent_id, v_parent_id, 
    jsonb_build_object('sub', v_parent_id, 'email', 'parent@yw.local'), 
    'email', 'parent@yw.local', 
    NOW(), NOW()
  );

  -- C. STUDENT ACCOUNT (Username: student_charlie)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change_token_new, email_change_token_current, recovery_token, 
    phone_change_token, email_change, phone_change, reauthentication_token, phone
  ) VALUES (
    v_student_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'student_charlie@yw-students.local', v_encrypted_pw, NOW(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Student Charlie","role":"child","username":"student_charlie","age":10,"language":"en","account_type":"username_account"}', 
    NOW(), NOW(),
    '', '', '', '', '', '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    v_student_id, v_student_id, 
    jsonb_build_object('sub', v_student_id, 'email', 'student_charlie@yw-students.local'), 
    'email', 'student_charlie@yw-students.local', 
    NOW(), NOW()
  );
END $$;

-- ── 4. Manually trigger profiles in case trigger wasn't active yet ─
INSERT INTO public.profiles (id, name, role, age, language, username, account_type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Teacher Alice', 'teacher', NULL, 'en', NULL, 'email_account'),
  ('22222222-2222-2222-2222-222222222222', 'Parent Bob', 'parent', NULL, 'en', NULL, 'email_account'),
  ('33333333-3333-3333-3333-333333333333', 'Student Charlie', 'child', 10, 'en', 'student_charlie', 'username_account')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  age = EXCLUDED.age,
  language = EXCLUDED.language,
  username = EXCLUDED.username,
  account_type = EXCLUDED.account_type;

-- ── 5. Ensure any other auth.users columns are safe ──────────
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  recovery_token = COALESCE(recovery_token, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone = COALESCE(phone, '');
