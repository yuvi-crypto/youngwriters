import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './WritingImagePanel.css';

export default function WritingImagePanel({ imageUrl, title, defaultMemoryMode = false }) {
  const [memoryMode, setMemoryMode] = useState(defaultMemoryMode);

  if (!imageUrl) return null;

  return (
    <div className="writing-image-panel card">
      <div className="panel-header">
        <span className="panel-title">📸 Illustration</span>
        <button 
          type="button" 
          className={`memory-toggle-btn ${memoryMode ? 'active' : ''}`}
          onClick={() => setMemoryMode(!memoryMode)}
          title={memoryMode ? "Show Image" : "Hide Image (Memory Mode)"}
        >
          {memoryMode ? <FiEyeOff /> : <FiEye />} 
          <span>{memoryMode ? 'Hidden' : 'Hide'}</span>
        </button>
      </div>

      {memoryMode ? (
        <div className="image-memory-placeholder">
          <span className="brain-emoji">🧠</span>
          <p>Memory Mode is active! The image is hidden to challenge your memory.</p>
        </div>
      ) : (
        <div className="panel-image-wrap animate-scale-in">
          <img src={imageUrl} alt={title || "Writing reference"} className="panel-img" />
          {title && <span className="panel-image-caption">{title}</span>}
        </div>
      )}
    </div>
  );
}
