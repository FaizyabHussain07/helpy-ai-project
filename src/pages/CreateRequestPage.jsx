import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { 
  categorizeRequest, 
  suggestTags, 
  rewriteDescription 
} from '../lib/groq';
import { Sparkles, X, Loader2 } from 'lucide-react';

const CreateRequestPage = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [urgency, setUrgency] = useState('Medium');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // AI suggestions state
  const [aiCategory, setAiCategory] = useState(null);
  const [aiUrgency, setAiUrgency] = useState(null);
  const [aiTags, setAiTags] = useState([]);
  const [aiRewritten, setAiRewritten] = useState('');
  const [aiLoading, setAiLoading] = useState({
    category: false,
    tags: false,
    rewrite: false
  });

  // Debounced AI calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchCategorySuggestion = useCallback(
    debounce(async (titleText) => {
      if (!titleText?.trim()) return;
      setAiLoading(prev => ({ ...prev, category: true }));
      const result = await categorizeRequest(titleText);
      if (result?.category) {
        setAiCategory(result.category);
        // Set urgency based on title keywords
        const lower = titleText.toLowerCase();
        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency')) {
          setAiUrgency('High');
        } else if (lower.includes('help') || lower.includes('need')) {
          setAiUrgency('Medium');
        } else {
          setAiUrgency('Low');
        }
      }
      setAiLoading(prev => ({ ...prev, category: false }));
    }, 800),
    []
  );

  const fetchTagsSuggestion = useCallback(
    debounce(async (descText) => {
      if (!descText?.trim() || descText.length < 20) return;
      setAiLoading(prev => ({ ...prev, tags: true }));
      const result = await suggestTags(descText);
      if (result?.tags) {
        setAiTags(result.tags);
      }
      setAiLoading(prev => ({ ...prev, tags: false }));
    }, 800),
    []
  );

  const fetchRewriteSuggestion = useCallback(
    debounce(async (descText) => {
      if (!descText?.trim() || descText.length < 30) return;
      setAiLoading(prev => ({ ...prev, rewrite: true }));
      const result = await rewriteDescription(descText);
      if (result?.rewritten) {
        setAiRewritten(result.rewritten);
      }
      setAiLoading(prev => ({ ...prev, rewrite: false }));
    }, 1000),
    []
  );

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    fetchCategorySuggestion(value);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    fetchTagsSuggestion(value);
    fetchRewriteSuggestion(value);
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const applyAiSuggestions = () => {
    if (aiCategory) setCategory(aiCategory);
    if (aiTags.length > 0) setTags(aiTags);
    if (aiRewritten) setDescription(aiRewritten);
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) return;

    setPublishLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        tags,
        status: 'open',
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName || 'Anonymous',
        authorAvatar: userData?.photoURL || user.photoURL,
        authorLocation: userData?.location || 'Remote',
        helpers: [],
        helperCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      navigate('/explore');
    } catch (err) {
      console.error('Error publishing request:', err);
      alert('Failed to publish request. Please try again.');
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            CREATE REQUEST
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            Turn a rough problem into a clear help request.
          </h1>
          <p className="hero-subtitle">
            Use built-in AI suggestions for category, urgency, tags, and a stronger description rewrite.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60% 35%', gap: '5%', marginTop: '32px' }}>
          {/* Left - Form */}
          <div className="white-card" style={{ padding: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="What do you need help with?"
                value={title}
                onChange={handleTitleChange}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Description
              </label>
              <textarea
                className="textarea-field"
                placeholder="Explain the challenge, your current progress, and what specific help you need..."
                rows={6}
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Tags
              </label>
              <div className="chip-container" style={{ marginBottom: '8px' }}>
                {tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                    <button className="chip-remove" onClick={() => removeTag(tag)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="chip-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput.trim());
                    }
                  }}
                  placeholder={tags.length === 0 ? "Add tags and press Enter..." : ""}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  Category
                </label>
                <select 
                  className="select-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Web Development</option>
                  <option>Design</option>
                  <option>Career</option>
                  <option>Study</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-secondary)'
                }}>
                  Urgency
                </label>
                <select 
                  className="select-field"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-outline"
                onClick={applyAiSuggestions}
                disabled={!aiCategory && aiTags.length === 0 && !aiRewritten}
              >
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                Apply AI suggestions
              </button>
              <button 
                className="btn-primary"
                onClick={handlePublish}
                disabled={!title.trim() || !description.trim() || publishLoading}
              >
                {publishLoading ? 'Publishing...' : 'Publish request'}
              </button>
            </div>
          </div>

          {/* Right - AI Assistant */}
          <div className="white-card" style={{ padding: '28px', height: 'fit-content' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              AI ASSISTANT
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
              Smart request guidance
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Suggested Category */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  SUGGESTED CATEGORY
                </label>
                <div style={{ 
                  fontSize: '14px', 
                  color: aiCategory ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {aiLoading.category && <Loader2 size={14} className="spinner" />}
                  {aiCategory || (title ? 'Analyzing...' : 'Start typing title...')}
                </div>
              </div>

              {/* Detected Urgency */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  DETECTED URGENCY
                </label>
                <div style={{ 
                  fontSize: '14px', 
                  color: aiUrgency ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {aiLoading.category && <Loader2 size={14} className="spinner" />}
                  {aiUrgency && (
                    <span className={`badge badge-${aiUrgency.toLowerCase()}`} style={{ fontSize: '11px' }}>
                      {aiUrgency}
                    </span>
                  )}
                  {!aiUrgency && (title ? 'Analyzing...' : 'Start typing title...')}
                </div>
              </div>

              {/* Suggested Tags */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  SUGGESTED TAGS
                </label>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '6px',
                  minHeight: '28px'
                }}>
                  {aiLoading.tags && <Loader2 size={14} className="spinner" />}
                  {aiTags.length > 0 ? aiTags.map((tag, idx) => (
                    <span key={idx} className="badge badge-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>
                      {tag}
                    </span>
                  )) : (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {description.length > 20 ? 'Analyzing...' : 'Describe your request...'}
                    </span>
                  )}
                </div>
              </div>

              {/* Rewrite Suggestion */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em'
                }}>
                  REWRITE SUGGESTION
                </label>
                <div style={{ 
                  fontSize: '14px', 
                  color: aiRewritten ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontStyle: aiRewritten ? 'normal' : 'italic',
                  lineHeight: 1.5,
                  padding: '12px',
                  background: aiRewritten ? 'var(--teal-light)' : 'transparent',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  {aiLoading.rewrite && <Loader2 size={14} className="spinner" style={{ marginTop: '4px' }} />}
                  {aiRewritten || (description.length > 30 ? 'Rewriting...' : 'Start describing...')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
