import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { supabase } from '../../supabase';
import { FiPlus, FiBookOpen, FiCalendar, FiUsers, FiFileText, FiCheckCircle, FiChevronRight, FiFolderPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'draft' | 'closed' | 'classrooms' | 'students'

  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

  // Student creation state
  const [studentForm, setStudentForm] = useState({ name: '', username: '', password: '', parentEmail: '', age: 10, language: 'en' });
  const [creatingStudent, setCreatingStudent] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchClassrooms();
    fetchStudentsAndParents();
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

  async function fetchClassrooms() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClassrooms(data || []);
    } catch (e) {
      console.error('Failed to load classrooms:', e);
    }
  }

  async function fetchStudentsAndParents() {
    try {
      const { data: studentsData, error: sErr } = await supabase
        .from('profiles')
        .select('id, name, username, parent_email')
        .eq('role', 'child')
        .order('name');
      if (sErr) throw sErr;
      setStudents(studentsData || []);

      const { data: parentsData, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'parent')
        .order('name');
      if (pErr) throw pErr;
      setParents(parentsData || []);
    } catch (e) {
      console.error('Failed to load students and parents:', e);
    }
  }

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .insert({ name: newClassName.trim(), teacher_id: user.id })
        .select();
      if (error) throw error;
      toast.success(`Classroom "${newClassName.trim()}" created!`);
      setNewClassName('');
      fetchClassrooms();
    } catch (err) {
      toast.error('Failed to create classroom: ' + err.message);
    } finally {
      setCreatingClass(false);
    }
  };

  const handleAssignParent = async (studentId, parentEmail) => {
    setUpdatingStudentId(studentId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ parent_email: parentEmail || null })
        .eq('id', studentId);
      if (error) throw error;
      toast.success('Parent assigned successfully!');
      setStudents(students.map(s => s.id === studentId ? { ...s, parent_email: parentEmail } : s));
    } catch (err) {
      toast.error('Failed to assign parent: ' + err.message);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim() || !studentForm.username.trim() || !studentForm.password.trim() || !studentForm.parentEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (studentForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCreatingStudent(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/teacher/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: studentForm.name.trim(),
          username: studentForm.username.trim().toLowerCase(),
          password: studentForm.password,
          parentEmail: studentForm.parentEmail.trim().toLowerCase(),
          age: Number(studentForm.age),
          language: studentForm.language
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to create student');

      toast.success(`Student "${studentForm.name}" created and parent linked! 🎉`);
      setStudentForm({ name: '', username: '', password: '', parentEmail: '', age: 10, language: 'en' });
      fetchStudentsAndParents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingStudent(false);
    }
  };

  const handlePromptResetPassword = async (studentId, studentName) => {
    const newPassword = prompt(`Enter new password for ${studentName} (minimum 6 characters):`);
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
        body: JSON.stringify({ studentId, newPassword })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to reset password');

      toast.success(`Password for ${studentName} updated successfully! 🔑`);
    } catch (err) {
      toast.error(err.message);
    }
  };

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
            <span className="teacher-user-name">
              Welcome, {user?.user_metadata?.name || 'Teacher'}{profile?.teacherId ? ` (ID: ${profile.teacherId})` : ''} 👋
            </span>
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
              <button
                className={`tab-btn ${activeTab === 'classrooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('classrooms')}
              >
                🏫 My Classes
                <span className="tab-count">{classrooms.length}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                👨‍👩‍👧 Students & Parents
                <span className="tab-count">{students.length}</span>
              </button>
            </div>

            {activeTab === 'classrooms' ? (
              <div className="classrooms-section animate-fade-in">
                <div className="create-class-card card" style={{ maxWidth: '500px', margin: '0 0 2rem 0', padding: '1.5rem' }}>
                  <h3>Create a New Class</h3>
                  <form onSubmit={handleCreateClassroom} style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. Class 5-A, Writing Club"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="input"
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn btn-primary" disabled={creatingClass}>
                      {creatingClass ? 'Creating...' : 'Create Class'}
                    </button>
                  </form>
                </div>

                <div className="classrooms-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                  {classrooms.length === 0 ? (
                    <div className="empty-dashboard-card" style={{ gridColumn: '1/-1' }}>
                      <FiFolderPlus className="empty-icon" />
                      <h3>No classes created yet</h3>
                      <p>Create your first class above to start posting targeted assignments!</p>
                    </div>
                  ) : (
                    classrooms.map((cls) => (
                      <div key={cls.id} className="classroom-card card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '2rem' }}>🏫</span>
                        <h3 style={{ margin: 0 }}>{cls.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                          Created: {new Date(cls.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : activeTab === 'students' ? (
              <div className="students-section animate-fade-in card" style={{ padding: '2rem' }}>
                {/* Add Student Inline Form */}
                <div className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ margin: 0, marginBottom: '1rem', color: 'var(--primary)' }}>➕ Register a New Student & Link Parent</h4>
                  <form onSubmit={handleCreateStudent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Name *</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. Charlie" 
                        value={studentForm.name} 
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Username *</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. charlie_w" 
                        value={studentForm.username} 
                        onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Password *</label>
                      <input 
                        type="password" 
                        className="input" 
                        placeholder="Min 6 chars" 
                        value={studentForm.password} 
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Age *</label>
                      <select 
                        className="input" 
                        value={studentForm.age} 
                        onChange={(e) => setStudentForm({ ...studentForm, age: e.target.value })}
                      >
                        {Array.from({ length: 13 }, (_, i) => i + 5).map(age => (
                          <option key={age} value={age}>{age} years old</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>Parent Email *</label>
                      <input 
                        type="email" 
                        className="input" 
                        placeholder="parent@email.com" 
                        value={studentForm.parentEmail} 
                        onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })} 
                        required 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" style={{ height: '2.8rem' }} disabled={creatingStudent}>
                      {creatingStudent ? 'Registering...' : 'Register'}
                    </button>
                  </form>
                </div>

                <h3 style={{ margin: 0 }}>Students & Parents List</h3>
                <p style={{ margin: '0.5rem 0 1.5rem 0', opacity: 0.7, fontSize: '0.9rem' }}>
                  Manage student accounts and link parent email addresses. Use the action menu to reset credentials.
                </p>
                <div className="students-table-wrap" style={{ overflowX: 'auto' }}>
                  <table className="teacher-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                        <th style={{ padding: '10px' }}>Student Name</th>
                        <th style={{ padding: '10px' }}>Username ID</th>
                        <th style={{ padding: '10px' }}>Linked Parent Email</th>
                        <th style={{ padding: '10px' }}>Assign/Change Parent</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No students registered yet.</td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '15px 10px' }}><strong>{student.name}</strong></td>
                            <td style={{ padding: '15px 10px' }}>
                              <span className="student-username" style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                @{student.username || 'no-username'}
                              </span>
                            </td>
                            <td style={{ padding: '15px 10px' }}>
                              {student.parent_email ? (
                                <span style={{ color: 'hsl(160,65%,60%)', fontSize: '0.9rem' }}>{student.parent_email}</span>
                              ) : (
                                <span style={{ opacity: 0.5, fontSize: '0.9rem' }}>Unlinked</span>
                              )}
                            </td>
                            <td style={{ padding: '15px 10px' }}>
                              <select
                                className="parent-select"
                                value={student.parent_email || ''}
                                onChange={(e) => handleAssignParent(student.id, e.target.value)}
                                disabled={updatingStudentId === student.id}
                                style={{
                                  background: '#1a1a2e',
                                  color: '#fff',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">Unlink / Select Parent</option>
                                {parents.map((p) => (
                                  <option key={p.id} value={p.email}>
                                    {p.name} ({p.email})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '15px 10px' }}>
                              <button
                                onClick={() => handlePromptResetPassword(student.id, student.name)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'hsl(32,90%,55%)', borderColor: 'rgba(235,140,30,0.3)', padding: '3px 8px' }}
                              >
                                🔑 Reset PW
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : loading ? (
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
