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
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import './AdminPanel.css';

// ── Authenticated admin fetch helper ────────────────────────────
async function adminFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }
  
  return res.json();
}

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/dashboard')
      .then(setData)
      .catch((err) => toast.error('Failed to load dashboard: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading-screen">Loading dashboard...</div>;
  if (!data) return <div className="admin-error-screen">Failed to load dashboard data.</div>;

  const m = data;
  return (
    <div className="admin-screen animate-fade-in">
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
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    adminFetch('/api/safety/queue')
      .then(setQueue)
      .catch((err) => toast.error('Failed to load safety queue: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReview = async (id, action) => {
    try {
      await adminFetch(`/api/safety/queue/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      toast.success(`Flag marked as ${action === 'dismiss' ? 'dismissed' : 'resolved'}`);
      fetchQueue();
    } catch (err) {
      toast.error('Review failed: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading-screen">Loading safety queue...</div>;

  return (
    <div className="admin-screen animate-fade-in">
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
              <th>Writer</th>
              <th>Age Band</th>
              <th>Submitted</th>
              <th>SLA Remaining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Safety queue is currently clean! ✨</td>
              </tr>
            ) : (
              queue.map((item) => (
                <tr key={item.id}>
                  <td><SeverityBadge level={item.severity} /></td>
                  <td className="admin-reason-cell">{item.reason}</td>
                  <td><strong>{item.author_name}</strong></td>
                  <td>{item.age_band}</td>
                  <td>{item.time_submitted}</td>
                  <td>
                    <SlaBar pct={item.sla_remaining_pct} />
                    <span className="admin-sla-pct">{item.sla_remaining_pct}%</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn btn-primary btn-xs" onClick={() => handleReview(item.id, 'resolve')}>Resolve</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => handleReview(item.id, 'dismiss')}>Dismiss</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [judges] = useState(['Priya M.', 'Rahul V.', 'Sunitha K.']);

  const fetchContests = () => {
    setLoading(true);
    adminFetch('/api/contests')
      .then(setContests)
      .catch((err) => toast.error('Failed to load contests: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleAssignJudge = async (contestId, judgeName) => {
    try {
      await adminFetch(`/api/contests/${contestId}/judge`, {
        method: 'POST',
        body: JSON.stringify({ judge: judgeName })
      });
      toast.success(`Assigned judge ${judgeName}`);
      fetchContests();
    } catch (err) {
      toast.error('Failed to assign judge: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading-screen">Loading contests...</div>;

  return (
    <div className="admin-screen animate-fade-in">
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
            {contests.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No active contests.</td>
              </tr>
            ) : (
              contests.map((c) => (
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
                    <select
                      className="admin-select"
                      value={c.judge || ''}
                      onChange={(e) => handleAssignJudge(c.id, e.target.value)}
                    >
                      <option value="">Select judge</option>
                      {judges.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/schools')
      .then(setSchools)
      .catch((err) => toast.error('Failed to load schools: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading-screen">Loading schools...</div>;

  return (
    <div className="admin-screen animate-fade-in">
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
            {schools.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No partner schools registered.</td>
              </tr>
            ) : (
              schools.map((s) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Moderation({ canEdit }) {
  const [moderation, setModeration] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    adminFetch('/api/moderation/queue')
      .then(setModeration)
      .catch((err) => toast.error('Failed to load moderation queue: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await adminFetch(`/api/moderation/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      toast.success(`Content ${action === 'approve' ? 'Approved' : 'Rejected'}`);
      fetchQueue();
    } catch (err) {
      toast.error('Action failed: ' + err.message);
    }
  };

  if (loading) return <div className="admin-loading-screen">Loading moderation queue...</div>;

  return (
    <div className="admin-screen animate-fade-in">
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
              <th>Writer</th>
              <th>Age Band</th>
              <th>Submitted</th>
              {canEdit && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {moderation.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} style={{ textAlign: 'center', padding: '20px' }}>No pending items in moderation queue.</td>
              </tr>
            ) : (
              moderation.map((item) => (
                <tr key={item.id}>
                  <td><span className="admin-badge admin-badge-neutral">{item.format}</span></td>
                  <td>{item.reason}</td>
                  <td><strong>{item.author_name}</strong></td>
                  <td>{item.age_band}</td>
                  <td>{item.submitted_at}</td>
                  {canEdit && (
                    <td className="admin-action-cell">
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-ghost btn-xs admin-approve-btn" onClick={() => handleAction(item.id, 'approve')}>Approve</button>
                        <button className="btn btn-primary btn-xs" onClick={() => handleAction(item.id, 'reject')}>Reject</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
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
