/**
 * AdminPanel.jsx — Young Writers Platform Admin
 *
 * Role-based access enforced by useAdminRole hook.
 * Five screens: Dashboard | Safety | Contests | Schools | Moderation
 *
 * IMPORTANT BOUNDARY: Nobody with contest or school account roles
 * sees flagged safety content — this is enforced here AND must be
 * enforced in backend API middleware (never trust frontend-only gates).
 *
 * Backend endpoints (all need real implementation — see TODOs):
 *   GET /api/admin/dashboard
 *   GET /api/safety/queue
 *   GET /api/contests
 *   POST /api/contests/:id/judge
 *   GET /api/schools
 *   GET /api/moderation/queue
 *   POST /api/moderation/:id/action
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { useAdminRole, SCREENS } from '../hooks/useAdminRole';
import './AdminPanel.css';

// ── Mock data ─────────────────────────────────────────────────
// TODO: Replace with real API calls. Each fetch call is clearly marked.

const MOCK_DASHBOARD = {
  wcw: 1247,         // Weekly Completing Writers (North Star)
  active_users: 8432,
  pieces_per_day: 1104,
  safety_flag_rate: 0.8,   // %
  contest_entries: 430,
  school_count: 47,
  wcw_trend: '+12%',
};

const MOCK_SAFETY_QUEUE = [
  { id: 'sf1', severity: 'high',   reason: 'Possible distress signal', age_band: '8-12', time_submitted: '14 min ago', sla_remaining_pct: 15 },
  { id: 'sf2', severity: 'medium', reason: 'Age-inappropriate reference', age_band: '5-7', time_submitted: '1h ago', sla_remaining_pct: 55 },
  { id: 'sf3', severity: 'low',    reason: 'Minor policy concern', age_band: '13-17', time_submitted: '3h ago', sla_remaining_pct: 80 },
];

const MOCK_CONTESTS = [
  { id: 'c1', theme: 'Stories of Kindness', integrity: 'pass', judge: null, entries: 247, deadline: '2026-07-15' },
  { id: 'c2', theme: 'My City in 2050',     integrity: 'pending', judge: 'Priya M.', entries: 183, deadline: '2026-08-01' },
];

const MOCK_SCHOOLS = [
  { id: 's1', name: 'DPS Hyderabad',      students: 340, consent_rate: 97, city: 'Hyderabad' },
  { id: 's2', name: 'Ganga Bhavani School', students: 210, consent_rate: 88, city: 'Warangal' },
  { id: 's3', name: 'Oakridge International', students: 190, consent_rate: 100, city: 'Hyderabad' },
];

const MOCK_MODERATION = [
  { id: 'm1', format: 'story',   reason: 'Community guideline: bullying reference', age_band: '8-12', submitted_at: '2h ago' },
  { id: 'm2', format: 'opinion', reason: 'Potential political content (age-inappropriate)', age_band: '13-17', submitted_at: '4h ago' },
];

// ── Severity badge ────────────────────────────────────────────
function SeverityBadge({ level }) {
  const map = { high: 'admin-badge-red', medium: 'admin-badge-amber', low: 'admin-badge-green' };
  return <span className={`admin-badge ${map[level] || 'admin-badge-green'}`}>{level}</span>;
}

// ── SLA Bar ───────────────────────────────────────────────────
function SlaBar({ pct }) {
  const color = pct < 25 ? 'hsl(0,75%,60%)' : pct < 50 ? 'hsl(32,95%,55%)' : 'hsl(160,65%,46%)';
  return (
    <div className="sla-bar-track" title={`${pct}% time remaining`}>
      <div className="sla-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Screens ───────────────────────────────────────────────────

function Dashboard() {
  // TODO: fetch('/api/admin/dashboard')
  const m = MOCK_DASHBOARD;
  return (
    <div className="admin-screen">
      <h2 className="admin-screen-title">Dashboard</h2>

      {/* North Star Metric */}
      <div className="admin-wcw-card">
        <div className="admin-wcw-label">📈 Weekly Completing Writers (North Star)</div>
        <div className="admin-wcw-value">{m.wcw.toLocaleString()}</div>
        <div className="admin-wcw-trend">{m.wcw_trend} vs last week</div>
      </div>

      {/* L1 Metrics Grid */}
      <div className="admin-metrics-grid">
        {[
          { label: 'Active Users', value: m.active_users.toLocaleString(), emoji: '👥' },
          { label: 'Pieces / Day', value: m.pieces_per_day.toLocaleString(), emoji: '✍️' },
          { label: 'Safety Flag Rate', value: `${m.safety_flag_rate}%`, emoji: '🛡️' },
          { label: 'Contest Entries', value: m.contest_entries.toLocaleString(), emoji: '🏆' },
          { label: 'Partner Schools', value: m.school_count, emoji: '🏫' },
        ].map((metric) => (
          <div className="admin-metric-card" key={metric.label}>
            <span className="admin-metric-emoji">{metric.emoji}</span>
            <strong className="admin-metric-value">{metric.value}</strong>
            <span className="admin-metric-label">{metric.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SafetyQueue() {
  // TODO: fetch('/api/safety/queue')
  return (
    <div className="admin-screen">
      <h2 className="admin-screen-title">🛡️ Trust & Safety Queue</h2>
      <p className="admin-screen-desc">
        Flagged items sorted by severity. Flagged text is never shown raw in list view.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Reason</th>
              <th>Age Band</th>
              <th>Submitted</th>
              <th>SLA Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SAFETY_QUEUE.map((item) => (
              <tr key={item.id}>
                <td><SeverityBadge level={item.severity} /></td>
                <td className="admin-reason-cell">{item.reason}</td>
                <td>{item.age_band}</td>
                <td>{item.time_submitted}</td>
                <td>
                  <SlaBar pct={item.sla_remaining_pct} />
                  <span className="admin-sla-pct">{item.sla_remaining_pct}%</span>
                </td>
                <td>
                  {/* TODO: POST /api/safety/queue/:id/review */}
                  <button className="btn btn-primary btn-xs">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Contests() {
  const [judges] = useState(['Priya M.', 'Rahul V.', 'Sunitha K.']);
  // TODO: fetch('/api/contests')
  return (
    <div className="admin-screen">
      <h2 className="admin-screen-title">🏆 Contests</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Theme</th>
              <th>Entries</th>
              <th>Deadline</th>
              <th>Integrity Check</th>
              <th>Judge Assigned</th>
              <th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_CONTESTS.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.theme}</strong></td>
                <td>{c.entries}</td>
                <td>{new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td>
                  <span className={`admin-badge ${c.integrity === 'pass' ? 'admin-badge-green' : 'admin-badge-amber'}`}>
                    {c.integrity === 'pass' ? '✓ Passed' : '⏳ Pending'}
                  </span>
                </td>
                <td>{c.judge || <span className="admin-text-muted">Unassigned</span>}</td>
                <td>
                  {/* TODO: POST /api/contests/:id/judge */}
                  <select
                    className="admin-select"
                    defaultValue={c.judge || ''}
                    onChange={(e) => {
                      console.log(`TODO: assign ${e.target.value} to contest ${c.id}`);
                    }}
                  >
                    <option value="">Select judge</option>
                    {judges.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Schools() {
  // TODO: fetch('/api/schools') — School Account Manager sees only their own schools
  return (
    <div className="admin-screen">
      <h2 className="admin-screen-title">🏫 Schools & Users</h2>
      <p className="admin-screen-desc">
        Consent-verification rate must stay at 100% for active accounts (DPDP requirement).
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>School</th>
              <th>City</th>
              <th>Students</th>
              <th>Consent Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SCHOOLS.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.city}</td>
                <td>{s.students}</td>
                <td>
                  <div className="admin-consent-wrap">
                    <SlaBar pct={s.consent_rate} />
                    <strong style={{ color: s.consent_rate === 100 ? 'hsl(160,65%,40%)' : 'hsl(32,95%,50%)' }}>
                      {s.consent_rate}%
                    </strong>
                  </div>
                </td>
                <td>
                  <span className={`admin-badge ${s.consent_rate === 100 ? 'admin-badge-green' : 'admin-badge-amber'}`}>
                    {s.consent_rate === 100 ? '✓ Verified' : '⚠ Incomplete'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Moderation({ canEdit }) {
  // TODO: fetch('/api/moderation/queue')
  return (
    <div className="admin-screen">
      <h2 className="admin-screen-title">🔍 Moderation</h2>
      <p className="admin-screen-desc">
        Reason shown — raw flagged text never displayed in list view.
        Full content visible only inside the individual review flow.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Format</th>
              <th>Flag Reason</th>
              <th>Age Band</th>
              <th>Submitted</th>
              {canEdit && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {MOCK_MODERATION.map((item) => (
              <tr key={item.id}>
                <td><span className="admin-badge admin-badge-neutral">{item.format}</span></td>
                <td>{item.reason}</td>
                <td>{item.age_band}</td>
                <td>{item.submitted_at}</td>
                {canEdit && (
                  <td className="admin-action-cell">
                    {/* TODO: POST /api/moderation/:id/action { action: 'approve'|'reject' } */}
                    <button className="btn btn-ghost btn-xs admin-approve-btn">Approve</button>
                    <button className="btn btn-primary btn-xs">Review</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { isAdmin, canView, canEdit, visibleScreens } = useAdminRole();

  const [activeScreen, setActiveScreen] = useState(SCREENS.DASHBOARD);

  // Redirect non-admin users
  useEffect(() => {
    if (profile && !isAdmin) navigate('/home');
  }, [profile, isAdmin, navigate]);

  // Default to first visible screen
  useEffect(() => {
    if (visibleScreens.length > 0 && !visibleScreens.includes(activeScreen)) {
      setActiveScreen(visibleScreens[0]);
    }
  }, [visibleScreens, activeScreen]);

  if (!isAdmin) return null;

  const NAV_ITEMS = [
    { id: SCREENS.DASHBOARD,   label: 'Dashboard',   emoji: '📊' },
    { id: SCREENS.SAFETY,      label: 'Safety Queue', emoji: '🛡️' },
    { id: SCREENS.CONTESTS,    label: 'Contests',     emoji: '🏆' },
    { id: SCREENS.SCHOOLS,     label: 'Schools',      emoji: '🏫' },
    { id: SCREENS.MODERATION,  label: 'Moderation',   emoji: '🔍' },
  ].filter((item) => canView(item.id));

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <span>✍️</span>
            <div>
              <strong>Admin Panel</strong>
              <span className="admin-role-chip">{profile?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeScreen === item.id ? 'admin-nav-active' : ''}`}
              onClick={() => setActiveScreen(item.id)}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/home')}>
            ← Back to app
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content">
        {activeScreen === SCREENS.DASHBOARD   && canView(SCREENS.DASHBOARD)   && <Dashboard />}
        {activeScreen === SCREENS.SAFETY      && canView(SCREENS.SAFETY)      && <SafetyQueue />}
        {activeScreen === SCREENS.CONTESTS    && canView(SCREENS.CONTESTS)    && <Contests />}
        {activeScreen === SCREENS.SCHOOLS     && canView(SCREENS.SCHOOLS)     && <Schools />}
        {activeScreen === SCREENS.MODERATION  && canView(SCREENS.MODERATION)  && (
          <Moderation canEdit={canEdit(SCREENS.MODERATION)} />
        )}
      </main>
    </div>
  );
}
