import { Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { FORMATS, ACTIVE_CONTESTS, SAMPLE_FEED } from '../constants';
import { FiEdit3, FiTrendingUp, FiAward, FiClock } from 'react-icons/fi';
import './Home.css';

const FORMAT_CARD_COLORS = {
  story:   { bg: 'var(--gradient-primary)',  shadow: 'hsla(258,80%,62%,0.4)' },
  poem:    { bg: 'linear-gradient(135deg,hsl(320,80%,62%),hsl(355,80%,65%))', shadow: 'hsla(320,80%,62%,0.4)' },
  essay:   { bg: 'var(--gradient-warm)',     shadow: 'hsla(32,95%,58%,0.4)' },
  opinion: { bg: 'var(--gradient-green)',    shadow: 'hsla(160,65%,46%,0.4)' },
};

export default function Home() {
  const { profile } = useAuthStore();
  const { pieces, badges, xp, streak } = useAppStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.name?.split(' ')[0] || 'Writer';

  const recentPieces = [...pieces].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const availableFormats = FORMATS.filter((f) => !f.minAge || (profile?.age || 12) >= f.minAge);

  return (
    <div className="home-page">
      {/* ─── Welcome Banner ──────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-greeting">
            <span className="home-greeting-wave animate-float">✋</span>
            <div>
              <p className="home-greeting-text">{greeting},</p>
              <h1 className="home-name">{name}!</h1>
            </div>
          </div>
          <p className="home-tagline">
            {pieces.length === 0
              ? "Your writing journey starts today. What will you create? ✨"
              : `You've written ${pieces.length} piece${pieces.length > 1 ? 's' : ''} so far. Keep going! 🚀`}
          </p>
          <Link to="/write" className="btn btn-primary btn-xl home-write-btn animate-pulse-glow">
            <FiEdit3 size={20} /> Start writing
          </Link>
        </div>

        {/* Stats Row */}
        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat-emoji">📝</span>
            <strong>{pieces.length}</strong>
            <span>Pieces</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-emoji">⚡</span>
            <strong>{xp}</strong>
            <span>XP</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-emoji">🏅</span>
            <strong>{badges.length}</strong>
            <span>Badges</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-emoji">🔥</span>
            <strong>{streak}</strong>
            <span>Day streak</span>
          </div>
        </div>
      </section>

      <div className="home-content container">
        {/* ─── What to Write ───────────────────────────────── */}
        <section className="home-section">
          <div className="home-section-header">
            <h2>What do you want to write today?</h2>
            <Link to="/write" className="btn btn-ghost btn-sm">See all</Link>
          </div>
          <div className="format-grid">
            {availableFormats.map((fmt) => {
              const colors = FORMAT_CARD_COLORS[fmt.id];
              return (
                <Link
                  key={fmt.id}
                  to={`/write/${fmt.id}`}
                  className="format-card animate-fade-in"
                  style={{
                    '--fmt-gradient': colors.bg,
                    '--fmt-shadow': colors.shadow,
                  }}
                >
                  <span className="format-card-emoji">{fmt.emoji}</span>
                  <h3 className="format-card-label">{fmt.label}</h3>
                  <p className="format-card-desc">{fmt.description}</p>
                  <div className="format-card-arrow">→</div>
                </Link>
              );
            })}
          </div>

          {/* Image Sprint Feature Card */}
          <Link
            to="/write/image-sprint"
            className="image-sprint-promo animate-fade-in delay-400"
          >
            <div className="sprint-promo-left">
              <span className="sprint-promo-badge">✨ New</span>
              <h3>📸 Image Sprint</h3>
              <p>Watch a picture for 12 seconds, then write the story you see in it.</p>
              <span className="sprint-promo-cta">Try it now →</span>
            </div>
            <div className="sprint-promo-right">
              <span className="sprint-promo-icons">🦉🌿🏠🔦🍄</span>
            </div>
          </Link>

          {/* Lab Feature Card */}
          <Link
            to="/lab"
            className="lab-promo animate-fade-in delay-400"
          >
            <div className="sprint-promo-left">
              <span className="sprint-promo-badge" style={{ background: 'hsla(0,0%,100%,0.2)', border: '1px solid hsla(0,0%,100%,0.35)' }}>🧠 Lab</span>
              <h3>Critical Thinking & Creativity Lab</h3>
              <p>Solve mysteries, arrange story structures, roll Story Dice, and challenge logical fallacies.</p>
              <span className="sprint-promo-cta">Enter the Lab →</span>
            </div>
            <div className="sprint-promo-right">
              <span className="sprint-promo-icons">🔬🎲🔍💡</span>
            </div>
          </Link>

        </section>

        <div className="home-two-col">
          {/* ─── Recent Pieces ─────────────────────────────── */}
          <section className="home-section">
            <div className="home-section-header">
              <h2><FiClock size={18} /> Recent pieces</h2>
              <Link to="/journal" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {recentPieces.length === 0 ? (
              <div className="home-empty">
                <span className="home-empty-emoji">📄</span>
                <p>No pieces yet! Write your first one today.</p>
                <Link to="/write" className="btn btn-primary btn-sm">Write now →</Link>
              </div>
            ) : (
              <div className="recent-pieces-list">
                {recentPieces.map((piece) => {
                  const fmt = FORMATS.find((f) => f.id === piece.type);
                  return (
                    <Link to={`/write/${piece.type}?edit=${piece.id}`} key={piece.id} className="recent-piece-card card">
                      <div className="recent-piece-icon" style={{ background: FORMAT_CARD_COLORS[piece.type]?.bg }}>
                        {fmt?.emoji}
                      </div>
                      <div className="recent-piece-info">
                        <h4>{piece.title || 'Untitled'}</h4>
                        <p>{piece.content?.slice(0, 60)}...</p>
                        <div className="recent-piece-meta">
                          <span className="badge badge-primary">{fmt?.label}</span>
                          <span className="text-xs text-muted">
                            {new Date(piece.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─── Right Column: Badges + Contests ─────────────── */}
          <div className="home-right-col">
            {/* Badges */}
            <section className="home-section">
              <div className="home-section-header">
                <h2><FiAward size={18} /> My badges</h2>
              </div>
              {badges.length === 0 ? (
                <div className="home-empty home-empty-sm">
                  <span className="home-empty-emoji">🏅</span>
                  <p>Write a piece to earn your first badge!</p>
                </div>
              ) : (
                <div className="badges-grid">
                  {badges.map((b) => (
                    <div key={b.id} className="badge-item" title={b.desc}>
                      <span className="badge-item-emoji">{b.emoji}</span>
                      <span className="badge-item-name">{b.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Active contest */}
            {ACTIVE_CONTESTS.length > 0 && (
              <section className="home-section">
                <div className="home-section-header">
                  <h2>🏆 Live contest</h2>
                </div>
                <Link to="/contests" className="contest-preview-card" style={{ background: ACTIVE_CONTESTS[0].gradient }}>
                  <div className="contest-preview-emoji">{ACTIVE_CONTESTS[0].emoji}</div>
                  <div className="contest-preview-info">
                    <h3>{ACTIVE_CONTESTS[0].theme}</h3>
                    <p>Deadline: {new Date(ACTIVE_CONTESTS[0].deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                    <p>{ACTIVE_CONTESTS[0].entries} entries so far</p>
                  </div>
                  <div className="contest-preview-cta">Enter →</div>
                </Link>
              </section>
            )}
          </div>
        </div>

        {/* ─── Community Spotlight ─────────────────────────── */}
        <section className="home-section">
          <div className="home-section-header">
            <h2><FiTrendingUp size={18} /> Community spotlight</h2>
            <Link to="/community" className="btn btn-ghost btn-sm">See all →</Link>
          </div>
          <div className="spotlight-grid">
            {SAMPLE_FEED.slice(0, 3).map((post) => {
              const fmt = FORMATS.find((f) => f.id === post.format);
              return (
                <div key={post.id} className="spotlight-card card">
                  <div className="spotlight-header">
                    <div className="avatar avatar-sm" style={{ background: FORMAT_CARD_COLORS[post.format]?.bg }}>
                      {post.author.avatar}
                    </div>
                    <div>
                      <strong className="spotlight-author">{post.author.name}</strong>
                      <span className="badge badge-primary">{fmt?.emoji} {fmt?.label}</span>
                    </div>
                  </div>
                  <h4 className="spotlight-title">{post.title}</h4>
                  <p className="spotlight-excerpt">{post.excerpt}</p>
                  <div className="spotlight-footer">
                    <span>❤️ {post.hearts}</span>
                    <span>💬 {post.comments}</span>
                    <span className="text-muted text-xs">{post.postedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
