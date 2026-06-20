import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { supabase } from '../supabase';
import { FiBookOpen, FiCalendar, FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import EvaluationCard from '../components/EvaluationCard';
import './Assignments.css';

export default function Assignments() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null); // for viewing completed evaluation

  useEffect(() => {
    fetchStudentAssignments();
  }, [user, profile]);

  async function fetchStudentAssignments() {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Fetch active assignments matching student age group
      const { data: assignData, error: assignErr } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (assignErr) throw assignErr;

      // 2. Fetch student's submissions for these assignments
      const { data: subData, error: subErr } = await supabase
        .from('submissions')
        .select(`
          *,
          evaluation:evaluations(*)
        `)
        .eq('student_id', user.id);

      if (subErr) throw subErr;

      // 3. Map submissions onto assignments
      const mapped = (assignData || []).map((a) => {
        const submission = (subData || []).find((s) => s.assignment_id === a.id);
        return {
          ...a,
          submission: submission || null,
        };
      });

      // Filter by target age band to keep relevant for child
      const studentAge = profile?.age || 10;
      const filtered = mapped.filter((a) => {
        if (!a.target_age_band || a.target_age_band === 'all') return true;
        const [min, max] = a.target_age_band.split('-').map(Number);
        if (min && max) {
          return studentAge >= min && studentAge <= max;
        }
        return true;
      });

      setAssignments(filtered);
    } catch (e) {
      toast.error('Failed to load assignments: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCardClick = (assign) => {
    if (assign.submission?.status === 'submitted') {
      // If submitted, open evaluation view
      setSelectedSubmission(assign.submission);
    } else {
      // Otherwise, go to writing workspace
      navigate(`/write/${assign.format}?assignment=${assign.id}`);
    }
  };

  const getFormatEmoji = (format) => {
    switch (format) {
      case 'story': return '📖';
      case 'poem': return '🎭';
      case 'essay': return '📝';
      case 'opinion': return '💬';
      default: return '✍️';
    }
  };

  return (
    <div className="student-assignments-page container">
      <div className="assignments-header">
        <h1>🏫 My Classroom Assignments</h1>
        <p>Complete writing challenges posted by your teacher and get friendly AI reviews!</p>
      </div>

      {loading ? (
        <div className="assignments-loading">
          <div className="spinner" />
          <p>Loading your assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="empty-assignments card text-center">
          <FiAlertCircle className="empty-icon" />
          <h3>No assignments yet</h3>
          <p>Your teacher hasn't posted any writing challenges for your age group yet. Keep checking back!</p>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map((a) => {
            const isSubmitted = a.submission?.status === 'submitted';
            const isDraft = a.submission?.status === 'draft';
            const statusLabel = isSubmitted ? 'Submitted' : isDraft ? 'Draft Saved' : 'Not Started';
            const statusClass = isSubmitted ? 'status-submitted' : isDraft ? 'status-draft' : 'status-not-started';

            return (
              <div 
                key={a.id} 
                className={`assignment-inbox-card card clickable-card ${isSubmitted ? 'submitted-border' : ''}`}
                onClick={() => handleCardClick(a)}
              >
                <div className="card-status-row">
                  <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                  {a.due_date && (
                    <span className="due-date-text">
                      <FiClock /> Due: {new Date(a.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="card-body-section">
                  <span className="inbox-emoji-box">{getFormatEmoji(a.format)}</span>
                  <div className="card-title-block">
                    <h3>{a.title}</h3>
                    <span className="inbox-format-label">{a.format} challenge</span>
                  </div>
                </div>

                <p className="card-desc-snippet">{a.description || 'Click to read instructions and start writing.'}</p>

                <div className="card-action-footer">
                  {isSubmitted ? (
                    <span className="view-feedback-action">
                      <FiAward /> View AI feedback & score
                    </span>
                  ) : (
                    <span className="start-writing-action">
                      Start writing <FiChevronRight />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation Report Modal */}
      {selectedSubmission && (
        <div className="evaluation-modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="evaluation-modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Writing Report: {selectedSubmission.title || 'Untitled'}</h2>
              <button className="modal-close-btn" onClick={() => setSelectedSubmission(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="student-story-review card">
                <h4>Your writing:</h4>
                <p className="story-text-preview">{selectedSubmission.content}</p>
              </div>

              {selectedSubmission.evaluation?.[0] ? (
                <div className="modal-evaluation-card mt-6">
                  <EvaluationCard 
                    evaluation={selectedSubmission.evaluation[0]} 
                    age={profile?.age || 10} 
                  />
                </div>
              ) : (
                <div className="no-eval-fallback card text-center mt-6">
                  <p>Your writing is submitted successfully! Evaluation details will load shortly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
