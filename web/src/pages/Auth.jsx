import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAtSign } from 'react-icons/fi';
import { identifyUser, trackSignUpCompleted, trackLoginCompleted } from '../analytics';
import './Auth.css';

const ROLES = [
  { id: 'parent',  emoji: '👨‍👧',  label: "I'm a parent",   desc: 'Register with Google' },
  { id: 'teacher', emoji: '🏫',  label: "I'm a teacher",  desc: 'Register with Google' },
];

const AGES = Array.from({ length: 13 }, (_, i) => i + 5); // 5–17

// ── Friendly error mapper ─────────────────────────────────────
function friendlyError(err) {
  const msg = err?.message || '';
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered'))
    return 'This email already has an account. Try logging in instead! 👋';
  if (msg.includes('Invalid login') || msg.includes('Invalid credentials'))
    return 'Wrong username/password. Try again, or check with your teacher. 🔑';
  if (msg.includes('Email not confirmed'))
    return 'Please check your email and click the confirmation link first.';
  return msg || 'Something went wrong. Please try again.';
}

// ── Username validation ───────────────────────────────────────
function validateUsername(username) {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be 20 characters or less';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers and _ allowed';
  return null;
}

// ── Check if username already taken ──────────────────────────
async function isUsernameTaken(username) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  return !!data;
}

// ── Signup ───────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '',
    age: 10, language: 'en', teacherId: '',
  });

  const isChild = role === 'child';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'username') setUsernameError('');
  };

  // ── Child signup (username + password, no email) ─────────────
  const handleChildSignup = async () => {
    const username = form.username.trim().toLowerCase();
    const uErr = validateUsername(username);
    if (uErr) { setUsernameError(uErr); return; }
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    // Check username uniqueness before hitting Supabase auth
    const taken = await isUsernameTaken(username);
    if (taken) {
      setUsernameError(`"${username}" is already taken! Try adding your lucky number 🎯`);
      return;
    }

    // Generate a deterministic internal email (never sent, never shown to user)
    // Format: username@yw-students.local
    const internalEmail = `${username}@yw-students.local`;

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password: form.password,
      options: {
        emailRedirectTo: undefined, // no confirmation email
        data: {
          name: form.name.trim(),
          role: 'child',
          username,
          age: Number(form.age),
          language: form.language,
          account_type: 'username_account',
        },
      },
    });
    if (error) throw error;
    return { data, username, internalEmail };
  };

  // ── Teacher/Parent signup (email + password) ─────────────────
  const handleEmailSignup = async () => {
    if (!form.email || !form.password || !form.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (role === 'teacher' && !form.teacherId.trim()) {
      toast.error('Teacher ID is required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name.trim(),
          role,
          language: form.language,
          account_type: 'email_account',
          teacher_id: role === 'teacher' ? form.teacherId.trim() : null,
        },
      },
    });
    if (error) throw error;
    return { data };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result;
      if (isChild) {
        result = await handleChildSignup();
      } else {
        result = await handleEmailSignup();
      }
      if (!result) return; // validation stopped early

      const { data } = result;
      if (!data?.user) throw new Error('Account creation failed. Please try again.');

      const profile = {
        uid: data.user.id,
        name: form.name.trim(),
        role,
        age: isChild ? Number(form.age) : null,
        language: form.language,
        username: isChild ? form.username.trim().toLowerCase() : null,
        accountType: isChild ? 'username_account' : 'email_account',
        teacherId: role === 'teacher' ? form.teacherId.trim() : null,
      };
      setUser(data.user);
      setProfile(profile);
      identifyUser(data.user.id, profile);
      trackSignUpCompleted({ role, age: isChild ? Number(form.age) : null, language: form.language });
      toast.success(`Welcome, ${form.name.trim()}! 🎉`);
      navigate(role === 'teacher' ? '/teacher' : '/home');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (role === 'teacher' && !form.teacherId.trim()) {
      toast.error('Teacher ID is required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
          data: {
            role: role,
            language: form.language,
            teacher_id: role === 'teacher' ? form.teacherId.trim() : null,
            account_type: 'email_account',
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error(friendlyError(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card card animate-scale-in">
        <Link to="/" className="auth-logo">
          <span>✍️</span>
          <span>Young<strong>Writers</strong></span>
        </Link>

        {step === 1 ? (
          <>
            <h1 className="auth-title">Who are you?</h1>
            <p className="auth-subtitle">Pick the option that describes you best.</p>
            <div className="role-grid">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  className={`role-card ${role === r.id ? 'selected' : ''}`}
                  onClick={() => { setRole(r.id); setStep(2); }}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-label">{r.label}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
            <div className="divider-text">already have an account?</div>
            <Link to="/login" className="btn btn-ghost w-full">Log in</Link>
          </>
        ) : (
          <>
            <button className="auth-back" onClick={() => setStep(1)}>← Back</button>
            <h1 className="auth-title">
              {isChild ? '✍️ Create your writer profile'
                : role === 'parent' ? '👨‍👧 Parent account'
                : '🏫 Teacher account'}
            </h1>

            {isChild && (
              <div className="auth-info-banner">
                🔐 Writers log in with a <strong>username</strong> — no email needed!
              </div>
            )}

            {isChild ? (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Name */}
                <div className="input-group">
                  <label className="input-label">Your name *</label>
                  <div className="input-icon-wrap">
                    <FiUser className="input-icon" />
                    <input
                      className="input input-with-icon"
                      type="text"
                      name="name"
                      placeholder="E.g. Arjun"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Username (children only) */}
                <div className="input-group">
                  <label className="input-label">
                    Choose a username *
                    <span className="input-hint">This is how you'll log in</span>
                  </label>
                  <div className="input-icon-wrap">
                    <FiAtSign className="input-icon" />
                    <input
                      className={`input input-with-icon ${usernameError ? 'input-error' : ''}`}
                      type="text"
                      name="username"
                      placeholder="e.g. arjun_writes42"
                      value={form.username}
                      onChange={handleChange}
                      maxLength={20}
                      autoCapitalize="none"
                      required
                    />
                  </div>
                  {usernameError && (
                    <span className="input-error-msg">{usernameError}</span>
                  )}
                  <span className="input-hint-small">Letters, numbers and _ only · 3–20 characters</span>
                </div>

                {/* Age (child only) */}
                <div className="input-group">
                  <label className="input-label">Your age *</label>
                  <select className="input" name="age" value={form.age} onChange={handleChange}>
                    {AGES.map((a) => <option key={a} value={a}>{a} years old</option>)}
                  </select>
                </div>

                {/* Language */}
                <div className="input-group">
                  <label className="input-label">Preferred language</label>
                  <select className="input" name="language" value={form.language} onChange={handleChange}>
                    <option value="en">🇬🇧 English</option>
                    <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                    <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                  </select>
                </div>

                {/* Password */}
                <div className="input-group">
                  <label className="input-label">Password *</label>
                  <div className="input-icon-wrap">
                    <FiLock className="input-icon" />
                    <input
                      className="input input-with-icon input-with-suffix"
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button type="button" className="input-suffix-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? '⏳ Creating account...' : '🚀 Create my account'}
                </button>
              </form>
            ) : (
              <div className="auth-form">
                {/* Language */}
                <div className="input-group">
                  <label className="input-label">Preferred language</label>
                  <select className="input" name="language" value={form.language} onChange={handleChange}>
                    <option value="en">🇬🇧 English</option>
                    <option value="te">🇮🇳 తెలుగు (Telugu)</option>
                    <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                  </select>
                </div>

                {/* Teacher ID (teachers only) */}
                {role === 'teacher' && (
                  <div className="input-group">
                    <label className="input-label">Teacher ID *</label>
                    <div className="input-icon-wrap">
                      <FiUser className="input-icon" />
                      <input
                        className="input input-with-icon"
                        type="text"
                        name="teacherId"
                        placeholder="e.g. TEA-482"
                        value={form.teacherId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text)',
                    height: '2.8rem',
                    width: '100%',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    marginTop: '1.5rem',
                  }}
                >
                  <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.3-1.12 2.18l3.22 2.5c1.88-1.73 2.95-4.28 2.95-7.53z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.22-2.5c-.9.6-2.05.96-3.22.96-3.11 0-5.74-2.1-6.68-4.96l-3.32 2.58C5.47 21.09 8.44 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.32 14.59c-.24-.7-.38-1.46-.38-2.24s.14-1.54.38-2.24L1.99 7.53C1.19 9.17.75 11 .75 12.85s.44 3.68 1.24 5.32l3.33-2.58z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 8.44 0 5.47 2.91 3.49 5.32l3.33 2.58C7.76 5.1 10.39 4.75 12 4.75z"
                    />
                  </svg>
                  Register with Google
                </button>
              </div>
            )}

            <p className="auth-footer-text">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────
// Students can log in with username OR email
// Teachers/parents use email only
export function Login() {
  const navigate = useNavigate();
  const { setUser, setProfile } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('username'); // 'username' | 'email'
  const [form, setForm] = useState({ identifier: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let email = form.identifier.trim();

      // If logging in with username, look up the internal email
      if (loginType === 'username') {
        const username = email.toLowerCase();
        // Derive the internal email directly (same formula as signup)
        email = `${username}@yw-students.local`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });
      if (error) throw error;

      const meta = data.user?.user_metadata || {};
      const userRole = meta.role || 'child';

      // Enforce: only student can login with ID/username, students cannot login with email
      if (loginType === 'email' && (userRole === 'child' || data.user.email?.endsWith('@yw-students.local'))) {
        await supabase.auth.signOut();
        throw new Error('Students must log in with their Username ID in the Writer tab.');
      }

      if (loginType === 'username' && userRole !== 'child') {
        await supabase.auth.signOut();
        throw new Error('Only student/writer accounts can log in with username ID.');
      }

      const profile = {
        uid: data.user.id,
        name: meta.name || data.user.email?.split('@')[0] || 'Writer',
        email: meta.account_type === 'username_account' ? null : data.user.email,
        role: userRole,
        age: meta.age || 12,
        language: meta.language || 'en',
        username: meta.username || null,
        accountType: meta.account_type || 'email_account',
        teacherId: meta.teacher_id || null,
      };
      setUser(data.user);
      setProfile(profile);
      identifyUser(data.user.id, profile);
      trackLoginCompleted({ role: profile.role, age: profile.age, language: profile.language });
      toast.success(`Welcome back, ${profile.name}! 👋`);
      navigate(profile.role === 'teacher' ? '/teacher' : '/home');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error(friendlyError(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card card animate-scale-in">
        <Link to="/" className="auth-logo">
          <span>✍️</span>
          <span>Young<strong>Writers</strong></span>
        </Link>

        <h1 className="auth-title">Welcome back! 👋</h1>
        <p className="auth-subtitle">Your stories are waiting for you.</p>

        {/* Login type toggle */}
        <div className="login-type-tabs">
          <button
            className={`login-tab ${loginType === 'username' ? 'active' : ''}`}
            onClick={() => setLoginType('username')}
            type="button"
          >
            ✍️ Writer (username)
          </button>
          <button
            className={`login-tab ${loginType === 'email' ? 'active' : ''}`}
            onClick={() => setLoginType('email')}
            type="button"
          >
            📧 Teacher / Parent
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">
              {loginType === 'username' ? 'Username' : 'Email'}
            </label>
            <div className="input-icon-wrap">
              {loginType === 'username'
                ? <FiAtSign className="input-icon" />
                : <FiMail className="input-icon" />
              }
              <input
                className="input input-with-icon"
                type={loginType === 'username' ? 'text' : 'email'}
                name="identifier"
                placeholder={loginType === 'username' ? 'your_username' : 'your@email.com'}
                value={form.identifier}
                onChange={handleChange}
                autoCapitalize="none"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrap">
              <FiLock className="input-icon" />
              <input
                className="input input-with-icon input-with-suffix"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="input-suffix-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🚀 Log in'}
          </button>
        </form>

        {loginType === 'email' && (
          <>
            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
              <span>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text)',
                height: '2.8rem',
                width: '100%',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.3-1.12 2.18l3.22 2.5c1.88-1.73 2.95-4.28 2.95-7.53z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.22-2.5c-.9.6-2.05.96-3.22.96-3.11 0-5.74-2.1-6.68-4.96l-3.32 2.58C5.47 21.09 8.44 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.59c-.24-.7-.38-1.46-.38-2.24s.14-1.54.38-2.24L1.99 7.53C1.19 9.17.75 11 .75 12.85s.44 3.68 1.24 5.32l3.33-2.58z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 8.44 0 5.47 2.91 3.49 5.32l3.33 2.58C7.76 5.1 10.39 4.75 12 4.75z"
                />
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        <p className="auth-footer-text">
          New here? <Link to="/signup">Create a free account</Link>
        </p>
      </div>
    </div>
  );
}
