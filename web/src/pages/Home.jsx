import { Link } from 'react-router-dom';
import { useAuthStore, useAppStore } from '../store';
import { FORMATS, ACTIVE_CONTESTS, SAMPLE_FEED } from '../constants';
import { FiEdit3, FiTrendingUp, FiAward, FiClock, FiCpu, FiImage, FiInbox } from 'react-icons/fi';
import './Home.css';

export default function Home() {
  const { profile } = useAuthStore();
  const { pieces, badges, xp, streak } = useAppStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.name?.split(' ')[0] || 'Writer';

  const recentPieces = [...pieces].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  return (
    <div className="home-page container">
      {/* ─── Clean Header Hero ─── */}
      <header className="home-hero-clean animate-fade-in">
        <div className="hero-welcome">
          <span className="welcome-emoji animate-float">👋</span>
          <div>
            <h1>{greeting}, {name}!</h1>
            <p>Welcome back to your writing adventures. What would you like to build today? ✨</p>
          </div>
        </div>

        {/* Compact stats strip */}
        <div className="hero-stats-strip">
          <div className="strip-item">
            <span className="strip-emoji">🔥</span>
            <div>
              <strong>{streak} Days</strong>
              <span>Streak</span>
            </div>
          </div>
          <div className="strip-item">
            <span className="strip-emoji">⚡</span>
            <div>
              <strong>{xp} XP</strong>
              <span>XP Level</span>
            </div>
          </div>
          <div className="strip-item">
            <span className="strip-emoji">🏅</span>
            <div>
              <strong>{badges.length}</strong>
              <span>Badges</span>
            </div>
          </div>
          <div className="strip-item">
            <span className="strip-emoji">📝</span>
            <div>
              <strong>{pieces.length}</strong>
              <span>Stories</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Quick Actions Hub (4x1 grid) ─── */}
      <section className="actions-hub-section animate-fade-in">
        <h2 className="section-title">🚀 Activity Hub</h2>
        <div className="actions-hub-grid">
          <Link to="/write" className="hub-action-card write-card">
            <div className="hub-icon-box"><FiEdit3 size={22} /></div>
            <div className="hub-info">
              <h3>Start Writing</h3>
              <p>Draft stories, poems, essays, and opinions.</p>
            </div>
            <span className="hub-arrow">→</span>
          </Link>

          <Link to="/lab" className="hub-action-card lab-card">
            <div className="hub-icon-box"><FiCpu size={22} /></div>
            <div className="hub-info">
              <h3>Creativity Lab</h3>
              <p>Puzzles, dice roll, & detective riddles.</p>
            </div>
            <span className="hub-arrow">→</span>
          </Link>

          <Link to="/write/image-sprint" className="hub-action-card sprint-card">
            <div className="hub-icon-box"><FiImage size={22} /></div>
            <div className="hub-info">
              <h3>Image Sprint</h3>
              <p>Observe pictures and write visual stories.</p>
            </div>
            <span className="hub-arrow">→</span>
          </Link>

          <Link to="/assignments" className="hub-action-card inbox-card">
            <div className="hub-icon-box"><FiInbox size={22} /></div>
            <div className="hub-info">
              <h3>Class Inbox</h3>
              <p>Prompts and challenges from your teacher.</p>
            </div>
            <span className="hub-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ─── Two-Column Dashboard Layout ─── */}
      <div className="home-dashboard-layout">
        
        {/* LEFT COLUMN: Journals & Spotlight */}
        <div className="dashboard-left-col">
          {/* Recent Pieces */}
          <section className="home-section">
            <div className="home-section-header">
              <h2><FiClock size={18} /> Recent Writing</h2>
              <Link to="/journal" className="btn btn-ghost btn-sm">View Journal</Link>
            </div>
            {recentPieces.length === 0 ? (
              <div className="home-empty card">
                <span className="home-empty-emoji">📄</span>
                <p>No pieces written yet! Start your first adventure today.</p>
                <Link to="/write" className="btn btn-primary btn-sm mt-3">Write Now →</Link>
              </div>
            ) : (
              <div className="recent-pieces-list">
                {recentPieces.map((piece) => {
                  const fmt = FORMATS.find((f) => f.id === piece.type);
                  return (
                    <Link to={`/write/${piece.type}?edit=${piece.id}`} key={piece.id} className="recent-piece-card card">
                      <div className="recent-piece-icon">
                        {fmt?.emoji || '📝'}
                      </div>
                      <div className="recent-piece-info">
                        <h4>{piece.title || 'Untitled'}</h4>
                        <p>{piece.content?.slice(0, 75)}...</p>
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

          {/* Community Spotlight */}
          <section className="home-section">
            <div className="home-section-header">
              <h2><FiTrendingUp size={18} /> Community Spotlight</h2>
              <Link to="/community" className="btn btn-ghost btn-sm">Feed View →</Link>
            </div>
            <div className="spotlight-grid">
              {SAMPLE_FEED.slice(0, 2).map((post) => {
                const fmt = FORMATS.find((f) => f.id === post.format);
                return (
                  <div key={post.id} className="spotlight-card card">
                    <div className="spotlight-header">
                      <div className="avatar avatar-sm">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar (Badges + Contests) */}
        <div className="dashboard-right-col">
          {/* Badges Panel */}
          <section className="home-section">
            <div className="home-section-header">
              <h2><FiAward size={18} /> Achievements</h2>
            </div>
            {badges.length === 0 ? (
              <div className="home-empty home-empty-sm card">
                <span className="home-empty-emoji">🏅</span>
                <p>Complete challenges to unlock unique writing badges!</p>
              </div>
            ) : (
              <div className="badges-grid-compact card">
                {badges.map((b) => (
                  <div key={b.id} className="badge-compact-item" title={b.desc}>
                    <span className="badge-emoji">{b.emoji}</span>
                    <span className="badge-name">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contest Panel */}
          {ACTIVE_CONTESTS.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>🏆 Active Contest</h2>
              </div>
              <Link to="/contests" className="contest-preview-card" style={{ background: ACTIVE_CONTESTS[0].gradient }}>
                <div className="contest-preview-emoji">{ACTIVE_CONTESTS[0].emoji}</div>
                <div className="contest-preview-info">
                  <h3>{ACTIVE_CONTESTS[0].theme}</h3>
                  <p>Deadline: {new Date(ACTIVE_CONTESTS[0].deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                  <p>{ACTIVE_CONTESTS[0].entries} submissions</p>
                </div>
                <div className="contest-preview-cta">Enter →</div>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
