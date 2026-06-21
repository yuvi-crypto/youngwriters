import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { supabase } from '../../supabase';
import { generateAssignmentIdeas } from '../../aiService';
import { IMAGE_LIBRARY } from '../../constants';
import { FiChevronLeft, FiChevronRight, FiZap, FiUploadCloud, FiImage, FiCheck, FiBookOpen, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AssignmentCreate.css';

export default function AssignmentCreate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Form State
  const [format, setFormat] = useState('story');
  const [targetAgeBand, setTargetAgeBand] = useState('8-12');
  const [classroomId, setClassroomId] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [scaffoldInput, setScaffoldInput] = useState('');
  const [scaffold, setScaffold] = useState([]);

  useEffect(() => {
    async function fetchTeacherClassrooms() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('teacher_id', user.id)
          .order('name');
        if (error) throw error;
        setClassrooms(data || []);
        if (data && data.length > 0) {
          setClassroomId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classrooms:', err);
      }
    }
    fetchTeacherClassrooms();
  }, [user]);
  
  // Image State
  const [includeImage, setIncludeImage] = useState(false);
  const [imageSource, setImageSource] = useState('none'); // 'none' | 'curated' | 'upload'
  const [curatedImageId, setCuratedImageId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');

  // ── AI Suggestions ──────────────────────────────────────────
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a theme or topic first');
      return;
    }
    setAiGenerating(true);
    try {
      const suggestions = await generateAssignmentIdeas(aiTopic, format, targetAgeBand);
      setAiSuggestions(suggestions);
      toast.success('AI generated 3 ideas for you! ✨');
    } catch (e) {
      toast.error('AI generation failed: ' + e.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplySuggestion = (sug) => {
    setTitle(sug.title || '');
    setDescription(sug.instructions || '');
    setPromptText(sug.prompt || '');
    if (Array.isArray(sug.scaffold)) {
      setScaffold(sug.scaffold);
      setScaffoldInput(sug.scaffold.join(', '));
    } else {
      setScaffold([]);
      setScaffoldInput('');
    }
    toast.success('Applied assignment template!');
  };

  // ── Scaffold Helpers ─────────────────────────────────────────
  const handleScaffoldChange = (val) => {
    setScaffoldInput(val);
    const sections = val.split(',').map(s => s.trim()).filter(Boolean);
    setScaffold(sections);
  };

  // ── Image Upload & Library Select ─────────────────────────────
  const handleImageSourceChange = (src) => {
    setImageSource(src);
    if (src === 'none') {
      setImageUrl('');
      setCuratedImageId('');
      setUploadFile(null);
      setUploadPreview('');
    }
  };

  const handleSelectCurated = (img) => {
    setCuratedImageId(img.id);
    setImageUrl(img.src);
    toast.success(`Selected "${img.title}"`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File size too large (max 3MB)');
      return;
    }
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  // ── Submit Assignment ────────────────────────────────────────
  const handleSubmit = async (publishStatus) => {
    if (!title.trim() || !promptText.trim()) {
      toast.error('Title and Writing Prompt are required');
      return;
    }
    if (!classroomId) {
      toast.error('Please assign this assessment to a class');
      return;
    }

    setLoading(true);
    let finalImageUrl = imageUrl;

    try {
      // 1. Upload custom image if needed
      if (imageSource === 'upload' && uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error: uploadErr } = await supabase.storage
          .from('assignment-images')
          .upload(filePath, uploadFile);

        if (uploadErr) {
          throw new Error('Image upload failed. Make sure storage bucket "assignment-images" is set up: ' + uploadErr.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('assignment-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      // 2. Insert assignment to Supabase
      const newAssignment = {
        teacher_id: user.id,
        classroom_id: classroomId,
        title: title.trim(),
        description: description.trim(),
        format,
        prompt_text: promptText.trim(),
        scaffold: format === 'essay' || format === 'opinion' ? scaffold : null,
        image_url: imageSource !== 'none' ? finalImageUrl : null,
        image_source: imageSource,
        curated_image_id: imageSource === 'curated' ? curatedImageId : null,
        target_age_band: targetAgeBand,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: publishStatus,
        allow_ai_assist: true,
      };

      const { error } = await supabase
        .from('assignments')
        .insert(newAssignment);

      if (error) throw error;

      toast.success(publishStatus === 'active' ? 'Assignment published! 🚀' : 'Draft saved!');
      navigate('/teacher');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Rendering Helper
  const getSelectedCuratedImg = () => IMAGE_LIBRARY.find(i => i.id === curatedImageId);

  return (
    <div className="assignment-create-page">
      <div className="create-header">
        <button onClick={() => navigate('/teacher')} className="back-btn-header">
          <FiChevronLeft /> Back to Dashboard
        </button>
        <h2>Create Writing Assignment</h2>
        <div className="steps-indicator">Step {step} of 4</div>
      </div>

      <div className="create-layout">
        {/* Main Work Area */}
        <div className="create-main-container card">
          
          {/* STEP 1: Format & Target Group */}
          {step === 1 && (
            <div className="step-pane animate-fade-in">
              <h3>Step 1: Assignment Basics</h3>
              <p className="step-subtitle">Pick the writing format, target age, and optional due date.</p>

              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Writing Format</label>
                  <select className="input" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="story">📖 Story (Narrative writing)</option>
                    <option value="poem">🎭 Poem (Poetic expression)</option>
                    <option value="essay">📝 Essay (Expository writing)</option>
                    <option value="opinion">💬 Opinion (Argumentative writing)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Target Age Group</label>
                  <select className="input" value={targetAgeBand} onChange={(e) => setTargetAgeBand(e.target.value)}>
                    <option value="5-7">Early (Ages 5–7)</option>
                    <option value="8-12">Middle (Ages 8–12)</option>
                    <option value="13-17">Teen (Ages 13–17)</option>
                    <option value="all">All ages</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Assign to Class *</label>
                  <select 
                    className="input" 
                    value={classroomId} 
                    onChange={(e) => setClassroomId(e.target.value)}
                    required
                  >
                    <option value="">Select a Class</option>
                    {classrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        🏫 {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Content & AI Assist */}
          {step === 2 && (
            <div className="step-pane animate-fade-in">
              <h3>Step 2: Add Content & AI Help</h3>
              <p className="step-subtitle">Write the assignment details yourself, or enter a theme below to generate suggestions with AI.</p>

              {/* AI Assist box */}
              <div className="ai-assist-box">
                <div className="ai-assist-header">
                  <FiZap className="ai-icon" />
                  <h4>AI Assistant</h4>
                </div>
                <div className="ai-assist-input-wrap">
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter theme (e.g. monsoon adventure, visiting Mars, magic school bag)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <button 
                    onClick={handleGenerateAI} 
                    className="btn btn-primary"
                    disabled={aiGenerating}
                  >
                    {aiGenerating ? '⏳ Generating...' : 'Generate Templates'}
                  </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="ai-suggestions-list">
                    {aiSuggestions.map((sug, i) => (
                      <div key={i} className="suggestion-card card clickable-card" onClick={() => handleApplySuggestion(sug)}>
                        <h5>{sug.title}</h5>
                        <p>{sug.instructions}</p>
                        <span className="suggestion-apply-tag">Click to apply template</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Form */}
              <div className="content-form-wrap mt-6">
                <div className="input-group">
                  <label className="input-label">Assignment Title *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. The Treehouse Mystery"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group mt-4">
                  <label className="input-label">Instructions / Instructions for child</label>
                  <textarea
                    className="input textarea"
                    placeholder="Provide simple instructions to guide the students..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="input-group mt-4">
                  <label className="input-label">Writing Prompt / Starting Line *</label>
                  <textarea
                    className="input textarea"
                    placeholder="Add a starting line or specific prompt to kick off writing..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    required
                  />
                </div>

                {(format === 'essay' || format === 'opinion') && (
                  <div className="input-group mt-4">
                    <label className="input-label">
                      Scaffold Sections
                      <span className="input-hint">Provide structure tags for the child (separated by commas)</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Introduction, First Reason, Another View, Summary"
                      value={scaffoldInput}
                      onChange={(e) => handleScaffoldChange(e.target.value)}
                    />
                    <div className="scaffold-preview-chips">
                      {scaffold.map((s, i) => (
                        <span key={i} className="scaffold-chip">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Image Sprint (Visual write) */}
          {step === 3 && (
            <div className="step-pane animate-fade-in">
              <h3>Step 3: Visual Inspiration (Optional)</h3>
              <p className="step-subtitle">Attach an image to this assignment so students see a reference illustration while writing.</p>

              <div className="image-toggle-card card">
                <label className="image-toggle-label">
                  <input
                    type="checkbox"
                    checked={includeImage}
                    onChange={(e) => {
                      setIncludeImage(e.target.checked);
                      if (e.target.checked && imageSource === 'none') {
                        setImageSource('curated');
                      } else if (!e.target.checked) {
                        handleImageSourceChange('none');
                      }
                    }}
                  />
                  <span>Attach an image for this assignment</span>
                </label>
              </div>

              {includeImage && (
                <div className="image-options mt-6">
                  <div className="image-source-tabs">
                    <button
                      className={`source-tab-btn ${imageSource === 'curated' ? 'active' : ''}`}
                      onClick={() => handleImageSourceChange('curated')}
                    >
                      <FiImage /> Choose from Curated Library
                    </button>
                    <button
                      className={`source-tab-btn ${imageSource === 'upload' ? 'active' : ''}`}
                      onClick={() => handleImageSourceChange('upload')}
                    >
                      <FiUploadCloud /> Upload Custom Image
                    </button>
                  </div>

                  {/* Curated Library Selector */}
                  {imageSource === 'curated' && (
                    <div className="curated-selector-container">
                      <div className="curated-images-grid">
                        {IMAGE_LIBRARY.map((img) => (
                          <div 
                            key={img.id} 
                            className={`curated-image-card ${curatedImageId === img.id ? 'selected' : ''}`}
                            onClick={() => handleSelectCurated(img)}
                          >
                            <img src={img.src} alt={img.title} />
                            <div className="curated-check-overlay">
                              <FiCheck />
                            </div>
                            <span className="curated-image-title">{img.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Upload Box */}
                  {imageSource === 'upload' && (
                    <div className="upload-box-wrap text-center">
                      <label className="upload-dropzone">
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <FiUploadCloud className="upload-cloud-icon" />
                        <h4>Click to upload image</h4>
                        <p>PNG, JPG up to 3MB</p>
                      </label>

                      {uploadPreview && (
                        <div className="upload-preview-card mt-4">
                          <h5>Upload Preview</h5>
                          <img src={uploadPreview} alt="Upload preview" className="preview-image-box" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Publish */}
          {step === 4 && (
            <div className="step-pane animate-fade-in text-center">
              <h3>Step 4: Review & Post</h3>
              <p className="step-subtitle">You are almost done! Review your assignment and choose whether to publish it to your class or save it as a draft.</p>

              <div className="final-review-summary">
                <div className="review-stat-row">
                  <span><strong>Format:</strong> {format.toUpperCase()}</span>
                  <span><strong>Target:</strong> Age {targetAgeBand}</span>
                  {dueDate && <span><strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}</span>}
                </div>

                <div className="review-preview-box text-left mt-6 card">
                  <span className="preview-flag">STUDENT VIEW PREVIEW</span>
                  <h4 className="preview-title">{title || 'Untitled Assignment'}</h4>
                  <p className="preview-desc">{description || 'No description provided.'}</p>
                  
                  <div className="preview-prompt-wrap">
                    <h5>Prompt/Starting line:</h5>
                    <p>"{promptText || 'No prompt provided.'}"</p>
                  </div>

                  {includeImage && (imageUrl || uploadPreview) && (
                    <div className="preview-image-wrap mt-4">
                      <h5>Attached Image:</h5>
                      <img 
                        src={imageSource === 'curated' ? imageUrl : uploadPreview} 
                        alt="Selected assignment"
                        className="preview-image-element" 
                      />
                    </div>
                  )}

                  {scaffold.length > 0 && (
                    <div className="preview-scaffold-wrap mt-4">
                      <h5>Structure hints provided:</h5>
                      <div className="scaffold-chips">
                        {scaffold.map((s, i) => <span key={i} className="scaffold-chip">{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="final-actions-buttons-wrap mt-8">
                <button 
                  onClick={() => handleSubmit('draft')} 
                  className="btn btn-ghost btn-lg mr-4"
                  disabled={loading}
                >
                  Save as Draft
                </button>
                <button 
                  onClick={() => handleSubmit('active')} 
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? '⏳ Publishing...' : 'Publish to Class 🚀'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="step-nav-controls">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-ghost">
                <FiChevronLeft /> Back
              </button>
            )}
            <div style={{ flexGrow: 1 }} />
            {step < 4 && (
              <button 
                onClick={() => {
                  if (step === 2 && (!title.trim() || !promptText.trim())) {
                    toast.error('Title and Writing Prompt are required');
                    return;
                  }
                  setStep(step + 1);
                }} 
                className="btn btn-primary"
              >
                Next Step <FiChevronRight />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
