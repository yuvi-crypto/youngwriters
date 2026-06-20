import { Link } from 'react-router-dom';
import { ACTIVE_CONTESTS } from '../constants';
import './Contests.css';

export default function Contests() {
  return (
    <div className="contests-page">
      <div className="container">
        <div className="contests-header">
          <div>
            <h1>🏆 Writing Contests</h1>
            <p>Fair, transparent competitions — recognition for every entrant, not just winners.</p>
          </div>
          <div className="contests-trust-badge">
            🛡️ Human-judged · Age-banded · Multilingual
          </div>
        </div>

        {/* How contests work */}
        <div className="contests-how card">
          <h2>How our contests work</h2>
          <div className="contests-how-grid">
            {[
              { emoji: '📋', title: 'Criteria published first', desc: 'You always know what judges are looking for before you enter.' },
              { emoji: '👥', title: 'Age-banded judging', desc: 'A 9-year-old is never compared to a 16-year-old. Fair by design.' },
              { emoji: '💛', title: 'Everyone gets feedback', desc: 'Win or not, every entrant receives a personal, encouraging note.' },
              { emoji: '🏅', title: 'No cash prizes', desc: 'Recognition, certificates, and platform features — no complicated legal stuff.' },
              { emoji: '🌐', title: 'Any language', desc: 'Write in English, Telugu, or Hindi — never a hidden disadvantage.' },
              { emoji: '🔍', title: 'Plagiarism checked', desc: 'Every entry is checked to protect kids who did their own work.' },
            ].map((item) => (
              <div key={item.title} className="contests-how-item">
                <span className="contests-how-emoji">{item.emoji}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active contests */}
        <div className="contests-section">
          <h2>🔴 Live now</h2>
          <div className="contests-grid">
            {ACTIVE_CONTESTS.map((contest) => (
              <div
                key={contest.id}
                className="contest-card animate-fade-in"
                style={{ background: contest.gradient }}
              >
                <div className="contest-card-inner">
                  <div className="contest-emoji">{contest.emoji}</div>
                  <h3>{contest.theme}</h3>
                  <div className="contest-meta">
                    <span>📅 Deadline: {new Date(contest.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>👥 {contest.entries} entries so far</span>
                    <span>🎂 Ages: {contest.ageBands.join(', ')}</span>
                    <span>📝 Formats: {contest.formats.join(', ')}</span>
                  </div>
                  <div className="contest-enter-btn">
                    <Link to="/write" className="btn" style={{ background: 'white', color: 'var(--color-primary)' }}>
                      Enter this contest →
                    </Link>
                  </div>
                  <p className="contest-consent-note">
                    🔒 Parent consent required. You'll see a separate consent screen before entering.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="contests-section">
          <h2>🔜 Coming soon</h2>
          <div className="contest-upcoming-list">
            {[
              { theme: 'Nature & the Environment', emoji: '🌿', eta: 'August 2026' },
              { theme: 'A Hero in My Life', emoji: '🦸', eta: 'September 2026' },
              { theme: 'Sounds of My City', emoji: '🏙️', eta: 'October 2026' },
            ].map((u) => (
              <div key={u.theme} className="contest-upcoming-card card">
                <span className="contest-upcoming-emoji">{u.emoji}</span>
                <div>
                  <strong>{u.theme}</strong>
                  <p className="text-muted text-sm">Expected {u.eta}</p>
                </div>
                <span className="badge badge-primary">Coming soon</span>
              </div>
            ))}
          </div>
        </div>

        {/* Past winners */}
        <div className="contests-section contests-past">
          <div className="card contests-past-card">
            <h2>🌟 Contest spotlight</h2>
            <p>
              Our quarterly contests celebrate writing from children across Hyderabad and beyond.
              Winners receive certificates, platform features, and their work may be featured in
              printed anthologies sent to schools.
            </p>
            <p className="text-muted text-sm" style={{ marginTop: 'var(--space-3)' }}>
              No past contests yet — we're just getting started! Be part of history. ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
