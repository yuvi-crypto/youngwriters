import { SCORE_LABELS } from '../services/evaluationService';
import { FiAward, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import './EvaluationCard.css';

export default function EvaluationCard({ evaluation, age }) {
  if (!evaluation) return null;

  const {
    structure_score,
    vocabulary_score,
    creativity_score,
    prompt_adherence_score,
    voice_score,
    overall_score,
    feedback_text,
    growth_nudge,
    strengths,
  } = evaluation;

  const currentAge = Number(age) || 10;
  const roundedOverall = Math.round(overall_score || 3);
  const scoreDetails = SCORE_LABELS[roundedOverall] || SCORE_LABELS[3];

  // ── Render Age 5-7: Emoji Stars ─────────────────────────────
  const renderEarlyYears = () => {
    // Convert 1-4 scale to 3 star ranks
    const starCount = roundedOverall === 4 ? 3 : roundedOverall === 1 ? 1 : 2;
    const starEmojis = '⭐'.repeat(starCount);
    
    return (
      <div className="eval-early-years animate-scale-in">
        <div className="star-display">{starEmojis}</div>
        <h3 className="stars-title" style={{ color: scoreDetails.color }}>
          {roundedOverall === 4 ? 'WOW! Superstar! 🌟' 
           : roundedOverall === 3 ? 'Amazing Writing! ✨' 
           : 'Great Start! 🌱'}
        </h3>
      </div>
    );
  };

  // ── Render Age 8-12: Progress Circles ─────────────────────────
  const renderMiddleYears = () => {
    const renderCircle = (score, label) => {
      const percentage = (score / 4) * 100;
      const roundedVal = Math.round(score);
      const details = SCORE_LABELS[roundedVal] || SCORE_LABELS[2];
      
      return (
        <div className="progress-circle-item">
          <div className="circle-outer" style={{ borderColor: details.color + '20' }}>
            <div 
              className="circle-fill" 
              style={{ 
                borderColor: details.color,
                clipPath: `inset(${(100 - percentage)}% 0px 0px 0px)`
              }} 
            />
            <span className="circle-score-text" style={{ color: details.color }}>
              {details.emoji}
            </span>
          </div>
          <span className="circle-label">{label}</span>
        </div>
      );
    };

    return (
      <div className="eval-middle-years animate-fade-in">
        <div className="circles-grid">
          {renderCircle(structure_score || 3, 'Structure')}
          {renderCircle(vocabulary_score || 3, 'Words')}
          {renderCircle(creativity_score || 3, 'Creativity')}
          {renderCircle(voice_score || 3, 'Voice')}
        </div>
      </div>
    );
  };

  // ── Render Age 13-17: Horizontal Bar Chart ────────────────────
  const renderTeenYears = () => {
    const renderBar = (score, label) => {
      const percentage = (score / 4) * 100;
      const roundedVal = Math.round(score);
      const details = SCORE_LABELS[roundedVal] || SCORE_LABELS[2];

      return (
        <div className="bar-row">
          <div className="bar-label-wrap">
            <span className="bar-label">{label}</span>
            <span className="bar-score-val" style={{ color: details.color }}>
              {Number(score).toFixed(1)} / 4.0 ({details.label})
            </span>
          </div>
          <div className="bar-track">
            <div 
              className="bar-fill" 
              style={{ width: `${percentage}%`, backgroundColor: details.color }} 
            />
          </div>
        </div>
      );
    };

    return (
      <div className="eval-teen-years animate-fade-in">
        {renderBar(structure_score || 3, 'Structure & Flow')}
        {renderBar(vocabulary_score || 3, 'Vocabulary & Word Choice')}
        {renderBar(creativity_score || 3, 'Creativity & Detail')}
        {renderBar(prompt_adherence_score || 3, 'Prompt Adherence')}
        {renderBar(voice_score || 3, 'Voice & Authentic Tone')}
      </div>
    );
  };

  return (
    <div className="evaluation-card-component">
      {/* 1. Age-Adaptive Rubric Visuals */}
      <div className="eval-visuals-card card">
        <div className="eval-card-header">
          <FiAward className="eval-header-icon" />
          <h3>Your Skill Rubric</h3>
        </div>
        
        {currentAge <= 7 && renderEarlyYears()}
        {currentAge >= 8 && currentAge <= 12 && renderMiddleYears()}
        {currentAge >= 13 && renderTeenYears()}
      </div>

      {/* 2. Strength Chips */}
      {strengths && strengths.length > 0 && (
        <div className="eval-strengths-wrap mt-4">
          <div className="strengths-title-row">
            <FiCheckCircle className="strength-icon-header" />
            <h4>Your Writing Strengths:</h4>
          </div>
          <div className="strengths-chips">
            {strengths.map((str, idx) => (
              <span key={idx} className="strength-chip">
                {str}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Supportive Feedback */}
      <div className="eval-feedback-box card mt-4">
        <h4>💌 Coach's Feedback</h4>
        <p>"{feedback_text || 'Excellent job writing today! Keep it up!'}"</p>
      </div>

      {/* 4. Growth Nudge */}
      {growth_nudge && (
        <div className="eval-nudge-box card mt-4">
          <div className="nudge-header">
            <FiTrendingUp />
            <h4>Next Steps for Growth</h4>
          </div>
          <p>"{growth_nudge}"</p>
        </div>
      )}
    </div>
  );
}
