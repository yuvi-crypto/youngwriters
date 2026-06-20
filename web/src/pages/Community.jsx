import { useState } from 'react';
import { useCommunityStore } from '../store';
import { FORMATS, SAMPLE_FEED } from '../constants';
import { moderateComment } from '../aiService';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi';
import './Community.css';

const FORMAT_COLORS = {
  story:   { bg: 'var(--gradient-primary)',  text: '#5B21B6' },
  poem:    { bg: 'linear-gradient(135deg,hsl(320,80%,62%),hsl(355,80%,65%))', text: '#831843' },
  essay:   { bg: 'var(--gradient-warm)',     text: '#92400E' },
  opinion: { bg: 'var(--gradient-green)',    text: '#064E3B' },
};

const AGE_FILTERS = [
  { id: 'all',    label: 'All Writers' },
  { id: 'early',  label: '5–7 years' },
  { id: 'middle', label: '8–12 years' },
  { id: 'teen',   label: '13–17 years' },
];

const FORMAT_FILTERS = [
  { id: 'all',     emoji: '📚', label: 'All types' },
  { id: 'story',   emoji: '📖', label: 'Stories' },
  { id: 'poem',    emoji: '🎭', label: 'Poems' },
  { id: 'essay',   emoji: '📝', label: 'Essays' },
  { id: 'opinion', emoji: '💬', label: 'Opinions' },
];

export default function Community() {
  const { feed: customFeed, toggleReaction } = useCommunityStore();
  const [ageFilter, setAgeFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});

  // Merge sample + user feed
  const allFeed = [...customFeed, ...SAMPLE_FEED];

  // Apply filters
  const filtered = allFeed.filter((post) => {
    const ageOk = ageFilter === 'all' || post.author.ageBand === ageFilter;
    const fmtOk = formatFilter === 'all' || post.format === formatFilter;
    return ageOk && fmtOk;
  });

  const handleReaction = (postId) => {
    toggleReaction(postId);
    // Update sample feed locally
  };

  const handleComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const { safe, reason } = await moderateComment(text);
    if (!safe) {
      toast.error(`Comment blocked: ${reason}. Only positive comments allowed! 💛`);
      return;
    }

    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { text, author: 'You', postedAt: 'just now' }],
    }));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    toast.success('Comment posted! 💛');
  };

  return (
    <div className="community-page">
      <div className="container">
        {/* Header */}
        <div className="community-header">
          <div>
            <h1>Community 🌍</h1>
            <p>Read and celebrate amazing writing from young writers like you.</p>
          </div>
          <div className="community-rules-badge">
            🛡️ Positive comments only · Age-safe feed
          </div>
        </div>

        {/* Filters */}
        <div className="community-filters">
          <div className="filter-group">
            {AGE_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`filter-btn ${ageFilter === f.id ? 'active' : ''}`}
                onClick={() => setAgeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {FORMAT_FILTERS.map((f) => (
              <button
                key={f.id}
                className={`filter-btn ${formatFilter === f.id ? 'active' : ''}`}
                onClick={() => setFormatFilter(f.id)}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="community-feed">
          {filtered.length === 0 ? (
            <div className="community-empty">
              <span>🌱</span>
              <p>No pieces yet in this category. Be the first to share!</p>
            </div>
          ) : (
            filtered.map((post) => {
              const fmt = FORMATS.find((f) => f.id === post.format);
              const fmtColors = FORMAT_COLORS[post.format] || FORMAT_COLORS.story;
              const postComments = comments[post.id] || [];
              const isExpanded = expandedPost === post.id;

              return (
                <article key={post.id} className="feed-card card animate-fade-in">
                  {/* Header */}
                  <div className="feed-card-header">
                    <div className="feed-author">
                      <div
                        className="avatar avatar-md"
                        style={{ background: fmtColors.bg }}
                      >
                        {post.author.avatar}
                      </div>
                      <div>
                        <strong className="feed-author-name">{post.author.name}</strong>
                        <div className="feed-meta">
                          <span
                            className="feed-format-badge"
                            style={{ background: fmtColors.bg }}
                          >
                            {fmt?.emoji} {fmt?.label}
                          </span>
                          <span className="text-xs text-muted">{post.postedAt}</span>
                        </div>
                      </div>
                    </div>
                    {post.badge && (
                      <span className="badge badge-secondary">{post.badge}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="feed-content">
                    <h2 className="feed-title">{post.title}</h2>
                    <p className={`feed-excerpt ${isExpanded ? 'expanded' : ''}`}>
                      {isExpanded ? post.excerpt : post.excerpt?.slice(0, 200) + (post.excerpt?.length > 200 ? '...' : '')}
                    </p>
                    {post.excerpt?.length > 200 && (
                      <button
                        className="feed-read-more"
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="feed-footer">
                    <div className="feed-reactions">
                      <button
                        className={`reaction-btn ${post.liked ? 'liked' : ''}`}
                        onClick={() => handleReaction(post.id)}
                      >
                        <FiHeart
                          size={18}
                          fill={post.liked ? 'currentColor' : 'none'}
                        />
                        <span>{post.hearts}</span>
                      </button>
                      <button
                        className="reaction-btn"
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      >
                        <FiMessageCircle size={18} />
                        <span>{(post.comments || 0) + postComments.length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments */}
                  {isExpanded && (
                    <div className="feed-comments animate-fade-in">
                      {postComments.map((c, i) => (
                        <div key={i} className="comment-item">
                          <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                            {c.author[0]}
                          </div>
                          <div className="comment-content">
                            <strong>{c.author}</strong>
                            <span className="text-muted text-xs">{c.postedAt}</span>
                            <p>{c.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="comment-input-row">
                        <div className="avatar avatar-sm" style={{ background: 'var(--gradient-cool)' }}>
                          Y
                        </div>
                        <div className="comment-input-wrap">
                          <input
                            className="input comment-input"
                            type="text"
                            placeholder="Write something kind... 💛"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button
                            className="btn btn-primary btn-icon btn-sm"
                            onClick={() => handleComment(post.id)}
                          >
                            <FiSend size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="comment-rules-note">
                        💛 Only positive, encouraging comments are allowed here.
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
