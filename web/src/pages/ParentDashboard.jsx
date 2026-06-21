import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { supabase } from '../supabase';
import { FiTrendingUp, FiPlus, FiBookOpen, FiAward, FiCalendar, FiCheckCircle, FiUsers, FiEdit3, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ParentDashboard.css';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pieces, setPieces] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [practiceTasks, setPracticeTasks] = useState([]);
  const [averages, setAverages] = useState({
    structure: 0,
    vocabulary: 0,
    creativity: 0,
    promptAdherence: 0,
    voice: 0,
  });

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    format: 'story',
    promptText: '',
    dueDate: '',
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadParentData();
    }
  }, [user]);

  async function loadParentData() {
    try {
      setLoading(true);
      // 1. Fetch linked child
      const { data: childProfile, error: childErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_email', user.email)
        .maybeSingle();

      if (childErr) throw childErr;
      
      if (childProfile) {
        setChild(childProfile);

        // 2. Fetch child's pieces
        const { data: childPieces, error: piecesErr } = await supabase
          .from('pieces')
          .select('*')
          .eq('author_id', childProfile.id)
          .order('created_at', { ascending: false });
        if (piecesErr) throw piecesErr;
        setPieces(childPieces || []);

        // 3. Fetch submissions with assignment and evaluation info
        const { data: childSubs, error: subsErr } = await supabase
          .from('submissions')
          .select('*, assignment:assignments(*), evaluation:evaluations(*)')
          .eq('student_id', childProfile.id);
        if (subsErr) throw subsErr;
        setSubmissions(childSubs || []);

        // 4. Calculate average evaluation scores
        calculateAverages(childSubs || []);
      }

      // 5. Fetch practice tasks assigned by this parent
      const { data: tasks, error: tasksErr } = await supabase
        .from('assignments')
        .select('*, submissions:submissions(status, submitted_at)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (tasksErr) throw tasksErr;
      setPracticeTasks(tasks || []);

    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
      toast.error('Error loading child data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateAverages(subs) {
    // Filter evaluations
    const evals = subs
      .map((s) => s.evaluation?.[0])
      .filter(Boolean);

    if (evals.length === 0) {
      setAverages({ structure: 0, vocabulary: 0, creativity: 0, promptAdherence: 0, voice: 0 });
      return;
    }

    const totals = evals.reduce(
      (acc, curr) => {
        acc.structure += Number(curr.structure_score) || 0;
        acc.vocabulary += Number(curr.vocabulary_score) || 0;
        acc.creativity += Number(curr.creativity_score) || 0;
        acc.promptAdherence += Number(curr.prompt_adherence_score) || 0;
        acc.voice += Number(curr.voice_score) || 0;
        return acc;
      },
      { structure: 0, vocabulary: 0, creativity: 0, promptAdherence: 0, voice: 0 }
    );

    const count = evals.length;
    setAverages({
      structure: parseFloat((totals.structure / count).toFixed(1)),
      vocabulary: parseFloat((totals.vocabulary / count).toFixed(1)),
      creativity: parseFloat((totals.creativity / count).toFixed(1)),
      promptAdherence: parseFloat((totals.promptAdherence / count).toFixed(1)),
      voice: parseFloat((totals.voice / count).toFixed(1)),
    });
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!child) {
      toast.error('No linked student found to assign task to.');
      return;
    }
    setSubmittingTask(true);
    try {
      const { error } = await supabase.from('assignments').insert({
        teacher_id: user.id, // parent id as creator
        classroom_id: null,  // direct task, no class
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        format: taskForm.format,
        prompt_text: taskForm.promptText.trim(),
        due_date: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
        status: 'active',
        target_age_band: 'all',
      });

      if (error) throw error;
      toast.success('Practice task assigned successfully! 🎉');
      setTaskForm({ title: '', description: '', format: 'story', promptText: '', dueDate: '' });
      setShowTaskForm(false);
      loadParentData();
    } catch (err) {
      toast.error('Failed to assign practice task: ' + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  const handleResetChildPassword = async () => {
    if (!child) return;
    const newPassword = prompt(`Enter new password for ${child.name} (minimum 6 characters):`);
    if (newPassword === null) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/student/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: child.id, newPassword })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to reset password');

      toast.success(`Password for ${child.name} updated successfully! 🔑`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="parent-dashboard-page">
      <div className="parent-bg-orbs">
        <div className="parent-orb parent-orb-1" />
        <div className="parent-orb parent-orb-2" />
      </div>

      <header className="parent-header">
        <div className="parent-header-content">
          <div className="parent-logo">
            <span>👨‍👩‍👧</span>
            <h1>Parent<strong>Dashboard</strong></h1>
          </div>
          <div className="parent-user-menu">
            <span className="parent-user-name">Welcome, Parent 👋</span>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Log out</button>
          </div>
        </div>
      </header>

      <main className="parent-main-content container">
        {loading ? (
          <div className="parent-loading">
            <div className="spinner" />
            <p>Loading analytics & tasks...</p>
          </div>
        ) : !child ? (
          <div className="unlinked-notice card text-center" style={{ padding: '3rem', maxWidth: '600px', margin: '3rem auto' }}>
            <span style={{ fontSize: '3.5rem' }}>🛡️</span>
            <h2 className="mt-4">No child linked yet</h2>
            <p className="mt-2 text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
              Please ask your child's teacher to link your email (<strong>{user?.email}</strong>) to their student profile in the school portal. Once linked, their writing analytics will appear here!
            </p>
          </div>
        ) : (
          <div className="parent-dashboard-grid">
            {/* Child Header Card */}
            <div className="child-profile-summary-card card animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="child-avatar">
                  {child.name ? child.name.slice(0,2).toUpperCase() : 'W'}
                </div>
                <div className="child-meta">
                  <h2>{child.name}'s Creative Journey</h2>
                  <p className="text-muted">Username: @{child.username} · Age: {child.age || 'N/A'}</p>
                  <div className="meta-pills">
                    <span className="pill pill-xp">⚡ {child.xp || 0} XP</span>
                    <span className="pill pill-streak">🔥 {child.streak_days || 0} Day Streak</span>
                    <span className="pill pill-pieces">📝 {pieces.length} Pieces Written</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleResetChildPassword}
                className="btn btn-outline btn-sm"
                style={{ borderColor: 'rgba(235,140,30,0.3)', color: 'hsl(32,90%,55%)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                🔑 Reset Child's PW
              </button>
            </div>

            {/* Left Side: Analytics */}
            <div className="parent-dashboard-left animate-fade-in">
              <div className="card parent-card">
                <div className="card-header">
                  <h3><FiTrendingUp className="icon-header" /> Writing Skill Breakdown</h3>
                  <span className="text-xs text-muted">Averaged across AI evaluations</span>
                </div>

                <div className="skills-analytics-grid mt-4">
                  {[
                    { label: 'Structure & Flow', score: averages.structure, desc: 'Paragraph design, logical sequencing' },
                    { label: 'Vocabulary Diversity', score: averages.vocabulary, desc: 'Choice of descriptive, vibrant words' },
                    { label: 'Creative Spark', score: averages.creativity, desc: 'Original hooks, metaphors, narrative depth' },
                    { label: 'Prompt Adherence', score: averages.promptAdherence, desc: 'Alignment to instructions & constraints' },
                    { label: 'Author Voice', score: averages.voice, desc: 'Tone consistency, emotional resonance' },
                  ].map((s) => {
                    const percentage = Math.round((s.score / 4) * 100);
                    return (
                      <div key={s.label} className="analytics-bar-item">
                        <div className="bar-labels">
                          <div>
                            <strong>{s.label}</strong>
                            <p className="bar-desc">{s.desc}</p>
                          </div>
                          <span className="bar-score">{s.score ? `${s.score} / 4` : 'No rating yet'}</span>
                        </div>
                        <div className="bar-bg-container">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${percentage || 0}%`,
                              background: s.score >= 3.5 ? 'linear-gradient(90deg, hsl(160,65%,50%), hsl(170,80%,55%))' 
                                        : s.score >= 2.5 ? 'linear-gradient(90deg, hsl(258,75%,66%), hsl(290,75%,66%))' 
                                        : 'linear-gradient(90deg, hsl(35,90%,55%), hsl(45,95%,60%))'
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Child Recent Pieces */}
              <div className="card parent-card mt-6">
                <div className="card-header">
                  <h3><FiBookOpen className="icon-header" /> Recent Pieces & Journal</h3>
                </div>
                <div className="pieces-summary-list mt-4">
                  {pieces.length === 0 ? (
                    <p className="text-muted text-center py-4">No stories or poems written yet.</p>
                  ) : (
                    pieces.slice(0, 4).map((p) => (
                      <div key={p.id} className="parent-piece-row card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="piece-row-type badge badge-secondary">{p.type.toUpperCase()}</span>
                          <span className="piece-row-date">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="piece-row-title mt-2">{p.title || 'Untitled Draft'}</h4>
                        <p className="piece-row-preview mt-1">{p.content?.slice(0, 140)}...</p>
                        <div className="piece-row-meta mt-3">
                          <span>Word Count: <strong>{p.word_count || 0} words</strong></span>
                          <span className={`status-badge-small ${p.status === 'community' ? 'status-shared' : 'status-private'}`}>
                            {p.status === 'community' ? 'Community Shared' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Assign Practice Tasks & Community Link */}
            <div className="parent-dashboard-right animate-fade-in">
              {/* Practice Tasks Section */}
              <div className="card parent-card">
                <div className="card-header-flex">
                  <h3>🎯 Parent Practice Tasks</h3>
                  {!showTaskForm && (
                    <button onClick={() => setShowTaskForm(true)} className="btn btn-primary btn-sm flex-align">
                      <FiPlus style={{ marginRight: '6px' }} /> Assign Task
                    </button>
                  )}
                </div>

                {showTaskForm && (
                  <form onSubmit={handleCreateTask} className="task-creation-form card mt-4 animate-scale-in">
                    <h4>Create Practice Writing Task</h4>
                    
                    <div className="input-group mt-3">
                      <label className="input-label">Task Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. The Mystery of the Missing Key"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        className="input"
                        required
                      />
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Writing Format *</label>
                      <select
                        value={taskForm.format}
                        onChange={(e) => setTaskForm({ ...taskForm, format: e.target.value })}
                        className="input"
                      >
                        <option value="story">✍️ Story</option>
                        <option value="poem">✨ Poem</option>
                        <option value="essay">📖 Essay</option>
                        <option value="opinion">💬 Opinion Piece</option>
                      </select>
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Instructions / Description</label>
                      <textarea
                        rows={2}
                        placeholder="Explain what you want them to focus on..."
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Writing Prompt Text *</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Write a story about waking up and discovering you have wings!"
                        value={taskForm.promptText}
                        onChange={(e) => setTaskForm({ ...taskForm, promptText: e.target.value })}
                        className="input"
                        required
                      />
                    </div>

                    <div className="input-group mt-3">
                      <label className="input-label">Due Date (Optional)</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="form-actions mt-4">
                      <button type="button" onClick={() => setShowTaskForm(false)} className="btn btn-ghost">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submittingTask}>
                        {submittingTask ? 'Assigning...' : 'Assign to Child'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="tasks-summary-list mt-4">
                  {practiceTasks.length === 0 ? (
                    <div className="empty-tasks text-center py-6">
                      <FiCalendar className="empty-icon-small" />
                      <p className="text-muted mt-2">No practice tasks assigned yet.</p>
                    </div>
                  ) : (
                    practiceTasks.map((task) => {
                      const completed = (task.submissions || []).length > 0;
                      return (
                        <div key={task.id} className="practice-task-item card">
                          <div className="task-header-row">
                            <span className="task-format-badge badge badge-primary">{task.format}</span>
                            <span className={`task-status-badge ${completed ? 'status-completed' : 'status-pending'}`}>
                              {completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                          <h4 className="mt-2">{task.title}</h4>
                          <p className="task-prompt mt-1">Prompt: "{task.prompt_text}"</p>
                          {task.due_date && (
                            <span className="task-due-text mt-2 block">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Community Spotlight CTA */}
              <div className="card parent-card mt-6 text-center py-6" style={{ background: 'linear-gradient(135deg, hsl(258,60%,15%), hsl(290,60%,15%))', border: '1px solid rgba(255,255,255,0.05)' }}>
                <FiUsers style={{ fontSize: '3rem', color: 'var(--color-primary)', display: 'block', margin: '0 auto 1rem auto' }} />
                <h3>Explore Community Pieces</h3>
                <p className="text-muted mt-1" style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0.5rem auto 1.5rem auto' }}>
                  Browse writing pieces shared by children in Hyderabad and globally, and leave positive emojis of encouragement!
                </p>
                <Link to="/community" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers /> Go to Community Feed
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
