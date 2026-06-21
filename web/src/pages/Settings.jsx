import { useAuthStore, useAppStore } from '../store';
import { LANGUAGES, BADGES } from '../constants';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, setProfile, logout } = useAuthStore();
  const {
    dyslexicMode, highContrast, language,
    toggleDyslexicMode, toggleHighContrast, setLanguage,
    badges, xp, pieces,
  } = useAppStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const initials = profile?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="settings-page">
      <div className="container container-sm">
        <h1 className="settings-title">Settings ⚙️</h1>

        {/* Profile */}
        <section className="settings-section card">
          <h2>👤 My profile</h2>
          <div className="profile-display">
            <div className="avatar avatar-xl" style={{ background: 'var(--gradient-primary)' }}>
              {initials}
            </div>
            <div className="profile-info">
              <h3>{profile?.name || 'Young Writer'}</h3>
              <p>{profile?.email}</p>
              {profile?.role === 'teacher' && profile?.teacherId && (
                <div style={{ marginTop: '4px', fontSize: '0.9rem', color: 'hsl(258, 20%, 75%)' }}>
                  🔑 Teacher ID: <strong style={{ color: 'white' }}>{profile.teacherId}</strong>
                </div>
              )}
              <div className="profile-badges-row">
                <span className="badge badge-primary">{profile?.role || 'Writer'}</span>
                {profile?.age && <span className="badge badge-secondary">Age {profile.age}</span>}
                <span className="badge badge-accent">⚡ {xp} XP</span>
              </div>
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{pieces.length}</strong>
              <span>Pieces written</span>
            </div>
            <div className="profile-stat">
              <strong>{badges.length}</strong>
              <span>Badges earned</span>
            </div>
            <div className="profile-stat">
              <strong>{xp}</strong>
              <span>XP total</span>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="settings-section card">
          <h2>🌐 Language</h2>
          <p className="settings-desc">Choose your preferred language for prompts and feedback.</p>
          <div className="language-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                className={`language-card ${language === lang.id ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(lang.id);
                  toast.success(`Language changed to ${lang.label}!`);
                }}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-label">{lang.label}</span>
                <span className="language-native">{lang.nativeLabel}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Accessibility */}
        <section className="settings-section card">
          <h2>♿ Accessibility</h2>
          <p className="settings-desc">Make Young Writers work best for you.</p>
          <div className="settings-toggles">
            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <strong>Dyslexia-friendly font</strong>
                <p>Uses OpenDyslexic with wider letter and line spacing</p>
              </div>
              <button
                className={`toggle-switch ${dyslexicMode ? 'on' : ''}`}
                onClick={toggleDyslexicMode}
                aria-label="Toggle dyslexic mode"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <strong>High contrast mode</strong>
                <p>Higher contrast for better readability</p>
              </div>
              <button
                className={`toggle-switch ${highContrast ? 'on' : ''}`}
                onClick={toggleHighContrast}
                aria-label="Toggle high contrast"
              >
                <div className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <strong>Text to speech</strong>
                <p>Have your writing read aloud to you</p>
              </div>
              <button
                className="toggle-switch"
                onClick={() => toast('Text to speech coming soon! 🔊')}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>
        </section>

        {/* Badges */}
        {badges.length > 0 && (
          <section className="settings-section card">
            <h2>🏅 My badges ({badges.length})</h2>
            <div className="all-badges-grid">
              {badges.map((badge) => (
                <div key={badge.id} className="all-badge-item">
                  <div className="all-badge-emoji animate-float">{badge.emoji}</div>
                  <strong>{badge.name}</strong>
                  <p>{badge.desc}</p>
                  <span className="text-xs text-muted">
                    {new Date(badge.earnedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Safety / Privacy */}
        <section className="settings-section card">
          <h2>🛡️ Safety & privacy</h2>
          <div className="privacy-items">
            <div className="privacy-item">
              <strong>Your writing is private by default</strong>
              <p>Nothing is shared until you choose to share it.</p>
            </div>
            <div className="privacy-item">
              <strong>No behavioral tracking or ads</strong>
              <p>We don't track what you do for advertising. Ever.</p>
            </div>
            <div className="privacy-item">
              <strong>Parental consent for contests</strong>
              <p>A parent must consent separately before you enter any contest.</p>
            </div>
            <div className="privacy-item">
              <strong>Data stored in India</strong>
              <p>Your data is stored in India-region servers, aligned with the DPDP Act.</p>
            </div>
          </div>
        </section>

        {/* Logout */}
        <section className="settings-section">
          <button
            className="btn btn-ghost w-full"
            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            onClick={handleLogout}
          >
            🚪 Log out
          </button>
        </section>
      </div>
    </div>
  );
}
