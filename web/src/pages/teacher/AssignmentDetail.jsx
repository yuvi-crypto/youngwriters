import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { SCORE_LABELS } from '../../services/evaluationService';
import { FiChevronLeft, FiDownload, FiUser, FiAward, FiClock, FiBookOpen, FiAlertCircle, FiTrash2, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AssignmentDetail.css';

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null); // currently viewed submission

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [id]);

  async function fetchAssignmentAndSubmissions() {
    try {
      setLoading(true);
      // Fetch assignment info
      const { data: assignData, error: assignErr } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (assignErr) throw assignErr;
      setAssignment(assignData);

      // Fetch submissions with student profile and evaluation data
      const { data: subData, error: subErr } = await supabase
        .from('submissions')
        .select(`
          *,
          student:profiles!submissions_student_id_fkey(name, age, username),
          evaluation:evaluations(
            id,
            structure_score,
            vocabulary_score,
            creativity_score,
            prompt_adherence_score,
            voice_score,
            overall_score,
            feedback_text,
            growth_nudge,
            strengths,
            fallback_used,
            evaluated_at
          )
        `)
        .eq('assignment_id', id)
        .order('submitted_at', { ascending: false });

      if (subErr) throw subErr;
      setSubmissions(subData || []);
    } catch (e) {
      toast.error('Failed to load assignment details: ' + e.message);
      navigate('/teacher');
    } finally {
      setLoading(false);
    }
  }

  // Toggle Assignment Status
  const handleToggleStatus = async () => {
    const newStatus = assignment.status === 'active' ? 'closed' : 'active';
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setAssignment({ ...assignment, status: newStatus });
      toast.success(`Assignment marked as ${newStatus}!`);
    } catch (e) {
      toast.error('Failed to update status: ' + e.message);
    }
  };

  // Delete Assignment
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment? All student submissions and evaluations will be permanently deleted.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Assignment deleted successfully');
      navigate('/teacher');
    } catch (e) {
      toast.error('Failed to delete assignment: ' + e.message);
    }
  };

  // Download All Submissions as Text file
  const handleDownloadAll = () => {
    if (submissions.length === 0) {
      toast.error('No submissions to download');
      return;
    }

    let textContent = `============================================================\n`;
    textContent += `Young Writers Platform — Submissions Package\n`;
    textContent += `Assignment: ${assignment.title}\n`;
    textContent += `Format: ${assignment.format.toUpperCase()}\n`;
    textContent += `Target Age Band: ${assignment.target_age_band.toUpperCase()}\n`;
    textContent += `Date Exported: ${new Date().toLocaleDateString()}\n`;
    textContent += `Total Submissions: ${submissions.length}\n`;
    textContent += `============================================================\n\n`;

    submissions.forEach((s, index) => {
      const studentName = s.student?.name || 'Unknown Student';
      const studentAge = s.student?.age ? `(Age ${s.student.age})` : '';
      const username = s.student?.username ? `@${s.student.username}` : '';
      
      textContent += `------------------------------------------------------------\n`;
      textContent += `[Submission #${index + 1}] Student: ${studentName} ${studentAge} ${username}\n`;
      textContent += `Submitted: ${new Date(s.submitted_at).toLocaleString()}\n`;
      textContent += `Word Count: ${s.word_count} words\n`;
      if (s.evaluation?.[0]) {
        textContent += `AI Score: ${s.evaluation[0].overall_score}/4.0\n`;
      }
      textContent += `------------------------------------------------------------\n`;
      textContent += `Title: ${s.title || 'Untitled'}\n\n`;
      textContent += `${s.content}\n\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignment.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_submissions.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded submissions package! 💾');
  };

  // Visual helper for rubric scores
  const renderScoreCircle = (score) => {
    const rounded = Math.round(score);
    const details = SCORE_LABELS[rounded] || SCORE_LABELS[2];
    return (
      <div className="detail-score-pill" style={{ backgroundColor: details.color + '20', color: details.color }}>
        <span className="pill-emoji">{details.emoji}</span>
        <span className="pill-score">{Number(score).toFixed(1)}</span>
        <span className="pill-label">{details.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="assignment-detail-loading-page">
        <div className="spinner" />
        <p>Loading assignment and submissions...</p>
      </div>
    );
  }

  const activeSubmissions = submissions.length;

  return (
    <div className="assignment-detail-page">
      <div className="detail-bg-orbs">
        <div className="detail-orb detail-orb-1" />
        <div className="detail-orb detail-orb-2" />
      </div>

      <div className="detail-header-wrap">
        <button onClick={() => navigate('/teacher')} className="back-btn-detail">
          <FiChevronLeft /> Back to Dashboard
        </button>
        
        <div className="header-actions">
          <button 
            onClick={handleToggleStatus} 
            className={`btn ${assignment.status === 'active' ? 'btn-ghost' : 'btn-accent'}`}
          >
            {assignment.status === 'active' ? '🔒 Close Submissions' : '🔓 Open Submissions'}
          </button>
          
          <button onClick={handleDownloadAll} className="btn btn-outline-primary" disabled={submissions.length === 0}>
            <FiDownload /> Export All as TXT
          </button>

          <button onClick={handleDelete} className="btn btn-ghost delete-btn-detail">
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className="detail-layout">
        
        {/* ASSIGNMENT INFO PANEL */}
        <aside className="assignment-info-aside card">
          <div className="info-aside-header">
            <span className={`status-badge status-${assignment.status}`}>{assignment.status}</span>
            <span className="age-band-badge">Age: {assignment.target_age_band?.toUpperCase()}</span>
          </div>

          <h2>{assignment.title}</h2>
          <span className="format-type-indicator">Format: {assignment.format.toUpperCase()}</span>
          
          {assignment.due_date && (
            <div className="due-date-meta mt-2">
              <FiClock className="meta-icon" />
              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          )}

          <hr className="divider" />

          <h4>Instructions:</h4>
          <p className="description-text">{assignment.description || 'No instructions provided.'}</p>

          <h4 className="mt-4">Writing Prompt / Start:</h4>
          <p className="prompt-text-quote">"{assignment.prompt_text}"</p>

          {assignment.image_url && (
            <div className="attached-image-container mt-4">
              <h4>Attached Image:</h4>
              <img src={assignment.image_url} alt="Assignment prompt" className="info-aside-image" />
            </div>
          )}

          {assignment.scaffold && assignment.scaffold.length > 0 && (
            <div className="attached-scaffold-container mt-4">
              <h4>Scaffold Guides:</h4>
              <div className="scaffold-chips-wrap">
                {assignment.scaffold.map((s, i) => <span key={i} className="scaffold-chip">{s}</span>)}
              </div>
            </div>
          )}
        </aside>

        {/* SUBMISSIONS LIST & DETAIL */}
        <section className="submissions-section">
          <div className="submissions-section-header">
            <h3>Submissions ({activeSubmissions})</h3>
          </div>

          {submissions.length === 0 ? (
            <div className="empty-submissions-card card">
              <FiAlertCircle className="empty-icon" />
              <h4>No submissions yet</h4>
              <p>When students submit their writing to this assignment, they will appear here along with their AI rubrics.</p>
            </div>
          ) : (
            <div className="submissions-split-view">
              
              {/* List of submissions */}
              <div className="submissions-sidebar-list">
                {submissions.map((sub) => {
                  const evalObj = sub.evaluation?.[0]; // Supabase returns list
                  const isSelected = selectedSub?.id === sub.id;
                  return (
                    <div 
                      key={sub.id} 
                      className={`submission-row-card card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSub(sub)}
                    >
                      <div className="submission-row-main">
                        <FiUser className="user-avatar-icon" />
                        <div>
                          <h4>{sub.student?.name || 'Unknown Student'}</h4>
                          <span className="submission-meta-line">
                            {sub.word_count} words · {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {evalObj && (
                        <span className="submission-overall-badge">
                          ⭐ {Number(evalObj.overall_score).toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detail view of selected submission */}
              <div className="submission-detail-container">
                {selectedSub ? (
                  <div className="submission-detail-card card animate-fade-in">
                    <div className="detail-sub-header">
                      <div>
                        <h3>{selectedSub.student?.name || 'Student Writing'}</h3>
                        <span className="sub-timestamp">
                          Submitted on {new Date(selectedSub.submitted_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="detail-word-count">{selectedSub.word_count} words</span>
                    </div>

                    <div className="detail-writing-content">
                      {selectedSub.title && <h4 className="student-story-title">Title: {selectedSub.title}</h4>}
                      <p className="student-story-text">{selectedSub.content}</p>
                    </div>

                    {/* AI Evaluation Rubric Panel */}
                    <div className="detail-evaluation-panel mt-6">
                      <div className="evaluation-panel-header">
                        <FiAward className="eval-icon" />
                        <h4>AI Rubric Evaluation</h4>
                      </div>

                      {selectedSub.evaluation?.[0] ? (
                        <div className="evaluation-scores-container">
                          {/* Dimensions */}
                          <div className="rubric-dimensions-list">
                            <div className="dimension-score-row">
                              <span>Structure</span>
                              {renderScoreCircle(selectedSub.evaluation[0].structure_score)}
                            </div>
                            <div className="dimension-score-row">
                              <span>Vocabulary</span>
                              {renderScoreCircle(selectedSub.evaluation[0].vocabulary_score)}
                            </div>
                            <div className="dimension-score-row">
                              <span>Creativity</span>
                              {renderScoreCircle(selectedSub.evaluation[0].creativity_score)}
                            </div>
                            <div className="dimension-score-row">
                              <span>Prompt Adherence</span>
                              {renderScoreCircle(selectedSub.evaluation[0].prompt_adherence_score)}
                            </div>
                            <div className="dimension-score-row">
                              <span>Voice & Style</span>
                              {renderScoreCircle(selectedSub.evaluation[0].voice_score)}
                            </div>
                          </div>

                          <div className="overall-score-banner">
                            <span>Overall Average Score</span>
                            <h3>{Number(selectedSub.evaluation[0].overall_score).toFixed(1)} / 4.0</h3>
                          </div>

                          {/* Strengths */}
                          {selectedSub.evaluation[0].strengths && selectedSub.evaluation[0].strengths.length > 0 && (
                            <div className="strengths-box mt-4">
                              <h5>Key Strengths:</h5>
                              <div className="strengths-chips-list">
                                {selectedSub.evaluation[0].strengths.map((str, idx) => (
                                  <span key={idx} className="strength-badge">{str}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Feedback Text */}
                          <div className="feedback-text-box mt-4">
                            <h5>Positive Feedback:</h5>
                            <p>"{selectedSub.evaluation[0].feedback_text}"</p>
                          </div>

                          {/* Growth Nudge */}
                          <div className="growth-nudge-box mt-4">
                            <h5>Growth Suggestion:</h5>
                            <p>"{selectedSub.evaluation[0].growth_nudge}"</p>
                          </div>
                        </div>
                      ) : (
                        <div className="no-evaluation-alert">
                          <p>This submission doesn't have an AI evaluation report yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-sub-detail-message card">
                    <FiFileText className="empty-icon-sub" />
                    <h4>Select a submission</h4>
                    <p>Click on any student submission on the left to read their writing and view their AI evaluation scores.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </section>

      </div>
    </div>
  );
}
