import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { supabase } from '../../supabase';
import { FiPlus, FiBookOpen, FiCalendar, FiUsers, FiFileText, FiCheckCircle, FiChevronRight, FiFolderPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'draft' | 'closed'

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  async function fetchAssignments() {
    if (!user) return;
    try {
      setLoading(true);
      // Query assignments with submission count
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          submissions:submissions(count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (e) {
      toast.error('Failed to load assignments: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  const filtered = assignments.filter((a) => {
    if (activeTab === 'all') return true;
    return a.status === activeTab;
  });

  const getFormatEmoji = (format) => {
    switch (format) {
      case 'story': return '✍️';
      case 'poem': return '✨';
      case 'essay': return '📖';
      case 'opinion': return '💬';
      case 'image':
      case 'image-sprint': return '🖼️';
      default: return '📝';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'closed': return 'status-closed';
      default: return 'status-draft';
    }
  };

  return (
    <div className="teacher-dashboard-page">
      <div className="teacher-bg-orbs">
        <div className="teacher-orb teacher-orb-1" />
        <div className="teacher-orb teacher-orb-2" />
      </div>

      <header className="teacher-header">
        <div className="teacher-header-content">
          <div className="teacher-logo">
            <span>🏫</span>
            <h1>Teacher<strong>Portal</strong></h1>
          </div>
          <div className="teacher-user-menu">
            <span className="teacher-user-name">Welcome, {user?.user_metadata?.name || 'Teacher'} 👋</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Log out</button>
          </div>
        </div>
      </header>

      <main className="teacher-main-content">
        <div className="dashboard-hero-section">
          <div className="hero-text-wrap">
            <h2>Welcome to your Classroom Dashboard</h2>
            <p>Create AI-scaffolded writing challenges, review submissions with age-appropriate rubrics, and guide your students' writing growth.</p>
          </div>
          <Link to="/teacher/assignments/new" className="btn btn-primary btn-lg create-btn-highlight">
            <FiPlus style={{ marginRight: '8px' }} /> Create New Assignment
          </Link>
        </div>

        <div className="dashboard-layout">
          <div className="dashboard-content-main">
            {/* Filter Tabs */}
            <div className="dashboard-tabs">
              {['all', 'active', 'draft', 'closed'].map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="tab-count">
                    {tab === 'all' 
                      ? assignments.length 
                      : assignments.filter(a => a.status === tab).length
                    }
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="dashboard-loading">
                <div className="spinner" />
                <p>Loading your assignments...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-dashboard-card">
                <FiFolderPlus className="empty-icon" />
                <h3>No assignments found</h3>
                <p>
                  {activeTab === 'all' 
                    ? "You haven't created any assignments yet. Get started by creating your first one!"
                    : `You don't have any assignments marked as "${activeTab}".`
                  }
                </p>
                {activeTab === 'all' && (
                  <Link to="/teacher/assignments/new" className="btn btn-primary mt-4">
                    Create First Assignment
                  </Link>
                )}
              </div>
            ) : (
              <div className="assignment-grid-list">
                {filtered.map((a) => {
                  const subCount = a.submissions?.[0]?.count || 0;
                  return (
                    <div key={a.id} className="assignment-card card clickable-card" onClick={() => navigate(`/teacher/assignments/${a.id}`)}>
                      <div className="card-top-header">
                        <span className={`status-badge ${getStatusClass(a.status)}`}>
                          {a.status}
                        </span>
                        <span className="age-band-tag">Age: {a.target_age_band?.toUpperCase()}</span>
                      </div>

                      <div className="card-main-title">
                        <span className="format-emoji-box">{getFormatEmoji(a.format)}</span>
                        <div>
                          <h3>{a.title}</h3>
                          <span className="format-label-sub">{a.format} assignment</span>
                        </div>
                      </div>

                      <p className="card-desc-snippet">{a.description || 'No description provided.'}</p>

                      <div className="card-stats-footer">
                        <div className="stat-item">
                          <FiUsers className="stat-icon" />
                          <span><strong>{subCount}</strong> submissions</span>
                        </div>
                        {a.due_date && (
                          <div className="stat-item">
                            <FiCalendar className="stat-icon" />
                            <span>Due: {new Date(a.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-hover-arrow">
                        <FiChevronRight />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
