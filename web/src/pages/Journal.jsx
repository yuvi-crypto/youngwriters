import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { FORMATS } from '../constants';
import { FiPlus, FiEdit3, FiTrash2, FiSearch } from 'react-icons/fi';
import './Journal.css';

const FORMAT_COLORS = {
  story:   'var(--gradient-primary)',
  poem:    'linear-gradient(135deg,hsl(320,80%,62%),hsl(355,80%,65%))',
  essay:   'var(--gradient-warm)',
  opinion: 'var(--gradient-green)',
};

export default function Journal() {
  const { pieces, updatePiece } = useAppStore();
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const filtered = pieces
    .filter((p) => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.content?.toLowerCase().includes(search.toLowerCase());
      const matchFormat = formatFilter === 'all' || p.type === formatFilter;
      return matchSearch && matchFormat;
    })
    .sort((a, b) =>
      sortBy === 'newest'
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : new Date(a.createdAt) - new Date(b.createdAt)
    );

  const totalWords = pieces.reduce((sum, p) => sum + (p.wordCount || 0), 0);

  return (
    <div className="journal-page">
      <div className="container">
        {/* Header */}
        <div className="journal-header">
          <div>
            <h1>My Journal 📖</h1>
            <p>{pieces.length} piece{pieces.length !== 1 ? 's' : ''} · {totalWords} words written</p>
          </div>
          <Link to="/write" className="btn btn-primary">
            <FiPlus /> New piece
          </Link>
        </div>

        {/* Stats */}
        {pieces.length > 0 && (
          <div className="journal-stats">
            {FORMATS.map((fmt) => {
              const count = pieces.filter((p) => p.type === fmt.id).length;
              return (
                <button
                  key={fmt.id}
                  className={`journal-stat-pill ${formatFilter === fmt.id ? 'active' : ''}`}
                  onClick={() => setFormatFilter(formatFilter === fmt.id ? 'all' : fmt.id)}
                  style={{ '--fmt-gradient': FORMAT_COLORS[fmt.id] }}
                >
                  <span>{fmt.emoji}</span>
                  <span>{fmt.label}s</span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Sort */}
        {pieces.length > 0 && (
          <div className="journal-controls">
            <div className="journal-search">
              <FiSearch className="journal-search-icon" />
              <input
                className="input journal-search-input"
                type="text"
                placeholder="Search your pieces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input journal-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        )}

        {/* Pieces grid */}
        {pieces.length === 0 ? (
          <div className="journal-empty">
            <div className="journal-empty-icon">📝</div>
            <h2>Your journal is empty</h2>
            <p>Every great writer started with a blank page. Yours awaits.</p>
            <Link to="/write" className="btn btn-primary btn-lg">
              Write your first piece ✍️
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="journal-empty journal-empty-sm">
            <span>🔍</span>
            <p>No pieces match your search. Try a different word!</p>
          </div>
        ) : (
          <div className="journal-grid">
            {filtered.map((piece) => {
              const fmt = FORMATS.find((f) => f.id === piece.type);
              const gradient = FORMAT_COLORS[piece.type] || FORMAT_COLORS.story;
              return (
                <div key={piece.id} className="journal-card card animate-fade-in">
                  <div className="journal-card-header" style={{ background: gradient }}>
                    <span className="journal-card-emoji">{fmt?.emoji}</span>
                    <span className="journal-card-type">{fmt?.label}</span>
                  </div>
                  <div className="journal-card-body">
                    <h3 className="journal-card-title">{piece.title || 'Untitled'}</h3>
                    <p className="journal-card-excerpt">
                      {piece.content?.slice(0, 120)}{piece.content?.length > 120 ? '...' : ''}
                    </p>
                    <div className="journal-card-meta">
                      <span className="text-xs text-muted">
                        {new Date(piece.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-muted">{piece.wordCount || 0} words</span>
                    </div>
                  </div>
                  <div className="journal-card-actions">
                    <Link
                      to={`/write/${piece.type}?edit=${piece.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      <FiEdit3 size={14} /> Edit
                    </Link>
                    {piece.status === 'private' ? (
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => {
                          updatePiece(piece.id, { status: 'community' });
                        }}
                      >
                        🌍 Share
                      </button>
                    ) : (
                      <span className="badge badge-accent">🌍 Shared</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
