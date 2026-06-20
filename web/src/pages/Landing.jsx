import { Link } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  { emoji: '✍️', title: 'Write Freely', desc: 'No grammar checks, no red pen. Just your imagination on the page.' },
  { emoji: '🛡️', title: 'Stay Safe', desc: 'Real human moderation behind the AI. Your child is always protected.' },
  { emoji: '🌟', title: 'Grow Confident', desc: 'Positive, encouraging feedback that builds skill without crushing creativity.' },
  { emoji: '🏆', title: 'Global Contests', desc: 'Fair, transparent writing contests with real recognition for every entrant.' },
  { emoji: '🌐', title: 'Write in Your Language', desc: 'English, Telugu, or Hindi — every child writes in the language of their heart.' },
  { emoji: '🎭', title: '5 Types of Writing', desc: 'Stories, poems, essays, opinion pieces, and contest entries — all in one place.' },
];

const CONTENT_TYPES = [
  { emoji: '📖', label: 'Stories',       color: 'var(--color-primary)',   gradient: 'var(--gradient-primary)' },
  { emoji: '🎭', label: 'Poems',         color: 'var(--color-pink)',      gradient: 'linear-gradient(135deg,hsl(320,80%,62%),hsl(355,80%,65%))' },
  { emoji: '📝', label: 'Essays',        color: 'var(--color-secondary)', gradient: 'var(--gradient-warm)' },
  { emoji: '💬', label: 'Opinion Pieces',color: 'var(--color-accent)',    gradient: 'var(--gradient-green)' },
  { emoji: '🏆', label: 'Contests',      color: 'var(--color-blue)',      gradient: 'var(--gradient-cool)' },
];

const TESTIMONIALS = [
  { quote: "My daughter submitted her first story and couldn't stop smiling. She said 'Amma, I'm a real writer now!'", author: 'Parent, Hyderabad' },
  { quote: "My students actually look forward to writing now. The prompts are creative and the feedback is so encouraging.", author: 'Teacher, CBSE School' },
  { quote: "I wrote a poem about my ammamma and everyone in the community loved it!", author: 'Priya, age 10' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <header className="landing-hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <nav className="hero-nav">
          <div className="hero-logo">
            <span>✍️</span>
            <span>Young<strong>Writers</strong></span>
          </div>
          <div className="hero-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get started free</Link>
          </div>
        </nav>

        <div className="hero-content animate-fade-in">
          <div className="hero-badge badge badge-primary">
            🇮🇳 Hyderabad-first · Telugu · Hindi · English
          </div>
          <h1 className="hero-title">
            Every child is born
            <span className="hero-title-gradient"> a storyteller.</span>
          </h1>
          <p className="hero-subtitle">
            Young Writers is a safe, joyful space for children aged 5–17 to write stories,
            poems, essays, and opinion pieces — in their language, at their pace,
            free from judgment.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-xl animate-pulse-glow">
              Start writing for free ✨
            </Link>
            <Link to="/login" className="btn btn-ghost btn-xl">
              I already have an account
            </Link>
          </div>
          <p className="hero-no-card">No credit card. No ads. No judgment. Ever.</p>
        </div>

        {/* Floating content type pills */}
        <div className="hero-pills animate-fade-in delay-400">
          {CONTENT_TYPES.map((type, i) => (
            <div
              key={type.label}
              className="hero-pill animate-float"
              style={{
                background: `linear-gradient(135deg, ${type.color}22, ${type.color}44)`,
                border: `1px solid ${type.color}44`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              <span>{type.emoji}</span>
              <span style={{ color: type.color, fontWeight: 700 }}>{type.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ─── Stats ─────────────────────────────────────────── */}
      <section className="landing-stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { value: '5–17', label: 'Age range', emoji: '🎂' },
              { value: '3', label: 'Languages', emoji: '🌐' },
              { value: '5', label: 'Writing types', emoji: '📝' },
              { value: '0', label: 'Ads. Ever.', emoji: '🚫' },
            ].map((stat) => (
              <div className="stat-card card" key={stat.label}>
                <div className="stat-emoji">{stat.emoji}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────── */}
      <section className="landing-features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">Built for children</span>
            <h2>Everything a young writer needs</h2>
            <p>Designed from the ground up for children, parents, and teachers — not adapted from adult tools.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                className={`feature-card card animate-fade-in delay-${(i % 4) * 100 + 100}`}
                key={f.title}
              >
                <div className="feature-emoji">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────── */}
      <section className="landing-how" id="how-it-works">
        <div className="container container-sm">
          <div className="section-header">
            <span className="badge badge-secondary">Simple &amp; safe</span>
            <h2>How it works</h2>
          </div>
          <div className="how-steps">
            {[
              { step: '01', title: 'Sign up',         desc: 'Child signs up, parent gets an email for consent. Safe from day one.' },
              { step: '02', title: 'Get a prompt',     desc: 'AI generates 3 age-appropriate prompts. Child picks one (or ignores them all!).' },
              { step: '03', title: 'Write freely',     desc: 'A distraction-free editor. No grammar red lines. No pressure. Just flow.' },
              { step: '04', title: 'Earn recognition', desc: 'Genuine positive feedback + badges. Optionally share with the age-filtered community.' },
            ].map((s) => (
              <div className="how-step" key={s.step}>
                <div className="how-step-number">{s.step}</div>
                <div className="how-step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Safety Banner ─────────────────────────────────── */}
      <section className="landing-safety">
        <div className="container">
          <div className="safety-card">
            <div className="safety-icon">🛡️</div>
            <div className="safety-content">
              <h2>Safety is not a feature. It's the foundation.</h2>
              <p>
                Six layers of protection: AI moderation → human spot-checks → crisis classifier →
                trained reviewers → parent dashboard alerts → emergency escalation.
                A child's writing is never deleted punitively. Our response is always care-first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────── */}
      <section className="landing-testimonials">
        <div className="container">
          <div className="section-header">
            <h2>What people are saying</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card card" key={i}>
                <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">— {t.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orbs">
              <div className="cta-orb cta-orb-1" />
              <div className="cta-orb cta-orb-2" />
            </div>
            <h2>Ready to write your first story?</h2>
            <p>Join thousands of young writers from Hyderabad and beyond. Free, safe, and full of joy.</p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-xl">
                Start writing — it's free! ✍️
              </Link>
              <p className="cta-note">Available in English · తెలుగు · हिन्दी</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-logo">
            <span>✍️</span>
            <span>Young<strong>Writers</strong></span>
          </div>
          <p className="footer-tagline">A safe haven for young voices. Hyderabad-first. 🇮🇳</p>
          <p className="footer-legal">© 2026 Young Writers Platform. Made with ❤️ in Hyderabad.</p>
        </div>
      </footer>
    </div>
  );
}
