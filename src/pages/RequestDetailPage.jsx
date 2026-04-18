import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { collection, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/ui/Avatar';
import { generateAISummary } from '../lib/groq';
import { Sparkles, CheckCircle, Trash2, MessageCircle, User, Star, Check, MessageSquare } from 'lucide-react';
import RatingModal from '../components/modals/RatingModal';

const RequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedHelper, setSelectedHelper] = useState(null);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const docRef = doc(db, 'requests', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setRequest(data);
        
        // Fetch AI summary
        setAiLoading(true);
        const summary = await generateAISummary(data.description);
        setAiSummary(summary?.summary || '');
        setAiLoading(false);
      } else {
        navigate('/explore');
      }
    } catch (err) {
      console.error('Error fetching request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = async () => {
    if (!user || !request) return;
    
    setActionLoading(true);
    try {
      const requestRef = doc(db, 'requests', id);
      
      // Add helper to request with pending status
      const helperData = {
        uid: user.uid,
        name: userData?.displayName || user.displayName,
        skills: userData?.skills || [],
        trustScore: userData?.trustScore || 50,
        status: 'pending', // pending, accepted, rejected
        offeredAt: serverTimestamp()
      };
      
      await updateDoc(requestRef, {
        helpers: arrayUnion(helperData),
        helperCount: increment(1)
      });

      // Create notification for request author
      await addDoc(collection(db, 'notifications'), {
        toUid: request.authorId,
        fromUid: user.uid,
        fromName: userData?.displayName || user.displayName,
        type: 'new_helper',
        requestId: id,
        requestTitle: request.title,
        read: false,
        createdAt: serverTimestamp()
      });

      // Show browser notification to seeker (if online)
      // This will be handled by the notifications system

      fetchRequest();
    } catch (err) {
      console.error('Error offering help:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptHelper = async (helperUid) => {
    if (!user || !request || !isAuthor) return;
    
    setActionLoading(true);
    try {
      // Update helper status to accepted
      const updatedHelpers = request.helpers.map(h => 
        h.uid === helperUid ? { ...h, status: 'accepted' } : h
      );
      
      await updateDoc(doc(db, 'requests', id), {
        helpers: updatedHelpers,
        acceptedHelperId: helperUid,
        status: 'in_progress'
      });

      // Create conversation between seeker and helper
      const conversationId = [user.uid, helperUid].sort().join('_');
      await setDoc(doc(db, 'conversations', conversationId), {
        participants: [user.uid, helperUid],
        requestId: id,
        requestTitle: request.title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: {
          text: `Help request accepted for "${request.title}"`,
          senderId: user.uid,
          createdAt: serverTimestamp()
        }
      });

      // Notify helper
      await addDoc(collection(db, 'notifications'), {
        toUid: helperUid,
        fromUid: user.uid,
        fromName: userData?.displayName || user.displayName,
        type: 'help_accepted',
        requestId: id,
        requestTitle: request.title,
        read: false,
        createdAt: serverTimestamp()
      });

      fetchRequest();
    } catch (err) {
      console.error('Error accepting helper:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectHelper = async (helperUid) => {
    if (!user || !request || !isAuthor) return;
    
    setActionLoading(true);
    try {
      // Update helper status to rejected
      const updatedHelpers = request.helpers.map(h => 
        h.uid === helperUid ? { ...h, status: 'rejected' } : h
      );
      
      await updateDoc(doc(db, 'requests', id), {
        helpers: updatedHelpers
      });

      fetchRequest();
    } catch (err) {
      console.error('Error rejecting helper:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = (helperUid) => {
    const conversationId = [user.uid, helperUid].sort().join('_');
    navigate(`/messages/${conversationId}`);
  };

  const handleMarkSolved = async () => {
    if (!user || !request) return;
    
    setActionLoading(true);
    try {
      const requestRef = doc(db, 'requests', id);
      
      // Mark as solved
      await updateDoc(requestRef, {
        status: 'solved',
        solvedAt: serverTimestamp()
      });

      // Update all helpers' trust scores and contributions
      for (const helper of request.helpers || []) {
        const userRef = doc(db, 'users', helper.uid);
        await updateDoc(userRef, {
          trustScore: increment(10),
          contributions: increment(1)
        });

        // Notify helpers
        await addDoc(collection(db, 'notifications'), {
          toUid: helper.uid,
          fromUid: user.uid,
          fromName: userData?.displayName || user.displayName,
          type: 'request_solved',
          requestId: id,
          requestTitle: request.title,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      fetchRequest();
    } catch (err) {
      console.error('Error marking solved:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !request || request.authorId !== user.uid) return;
    
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      // Soft delete - mark as deleted
      await updateDoc(doc(db, 'requests', id), {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
      navigate('/explore');
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const isAuthor = user?.uid === request?.authorId;
  const hasHelped = request?.helpers?.some(h => h.uid === user?.uid);
  const isSolved = request?.status === 'solved';
  const isHelperUser = userData?.role === 'helper' || userData?.role === 'both';
  const isSeekerUser = userData?.role === 'seeker' || userData?.role === 'both';
  
  const acceptedHelper = request?.helpers?.find(h => h.status === 'accepted');
  const isAcceptedHelper = acceptedHelper?.uid === user?.uid;
  const hasAcceptedHelper = !!acceptedHelper;

  const openRatingModal = (helper) => {
    setSelectedHelper(helper);
    setRatingModalOpen(true);
  };

  const handleRateHelper = async ({ rating, feedback }) => {
    if (!selectedHelper || !request) return;
    
    try {
      // Add rating to helper's profile
      const helperRef = doc(db, 'users', selectedHelper.uid);
      const helperSnap = await getDoc(helperRef);
      
      if (helperSnap.exists()) {
        const helperData = helperSnap.data();
        const currentRating = helperData.rating || 0;
        const currentCount = helperData.ratingCount || 0;
        
        // Calculate new average rating
        const newRating = ((currentRating * currentCount) + rating) / (currentCount + 1);
        
        await updateDoc(helperRef, {
          rating: Math.round(newRating * 10) / 10,
          ratingCount: increment(1)
        });
      }

      // Store rating in request
      await updateDoc(doc(db, 'requests', id), {
        [`ratings.${selectedHelper.uid}`]: {
          rating,
          feedback,
          fromUid: user.uid,
          fromName: userData?.displayName || user.displayName,
          createdAt: serverTimestamp()
        }
      });

      // Notify helper
      await addDoc(collection(db, 'notifications'), {
        toUid: selectedHelper.uid,
        fromUid: user.uid,
        fromName: userData?.displayName || user.displayName,
        type: 'new_rating',
        requestId: id,
        requestTitle: request.title,
        rating: rating,
        read: false,
        createdAt: serverTimestamp()
      });

      fetchRequest();
    } catch (err) {
      console.error('Error rating helper:', err);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const classes = {
      'High': 'badge-high',
      'Medium': 'badge-medium',
      'Low': 'badge-low'
    };
    return classes[urgency] || 'badge-low';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div className="page-container" style={{ textAlign: 'center', padding: '48px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span className={`badge ${getUrgencyBadge(request.urgency)}`}>
              {request.urgency}
            </span>
            <span className={`badge ${request.status === 'solved' ? 'badge-solved' : 'badge-open'}`}>
              {request.status === 'solved' ? 'Solved' : 'Open'}
            </span>
            <span className="badge badge-tag">{request.category}</span>
          </div>
          <h1 className="hero-title" style={{ marginBottom: '12px' }}>
            {request.title}
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: '700px' }}>
            {request.description}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60% 35%', gap: '5%', marginTop: '32px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* AI Summary Card */}
            <div className="white-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={16} color="white" />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--teal)' }}>
                  HelpHub AI
                </span>
              </div>

              {aiLoading ? (
                <div className="skeleton" style={{ height: '60px' }} />
              ) : (
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {aiSummary}
                </p>
              )}

              {request.tags && request.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {request.tags.map((tag, idx) => (
                    <span key={idx} className="badge badge-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div className="white-card" style={{ padding: '28px' }}>
              <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>
                ACTIONS
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isAuthor && request.status === 'open' && !hasHelped && (
                  <button 
                    className="btn-primary"
                    onClick={handleHelp}
                    disabled={actionLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <MessageCircle size={18} />
                    {actionLoading ? 'Processing...' : 'I can help'}
                  </button>
                )}

                {!isAuthor && hasHelped && (
                  <div style={{ 
                    padding: '16px', 
                    background: 'var(--badge-solved-bg)', 
                    borderRadius: '12px',
                    color: 'var(--badge-solved-text)',
                    textAlign: 'center'
                  }}>
                    <CheckCircle size={20} style={{ marginBottom: '8px' }} />
                    <p style={{ fontWeight: 600 }}>You're helping with this request!</p>
                  </div>
                )}

                {isAuthor && request.status === 'open' && request.helpers?.length > 0 && (
                  <button 
                    className="btn-outline"
                    onClick={handleMarkSolved}
                    disabled={actionLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={18} />
                    Mark as solved
                  </button>
                )}

                {isAuthor && (
                  <button 
                    className="btn-outline"
                    onClick={handleDelete}
                    style={{ 
                      color: 'var(--badge-high-text)', 
                      borderColor: 'var(--badge-high-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={18} />
                    Delete request
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Requester Card */}
            <div className="white-card" style={{ padding: '28px' }}>
              <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>
                REQUESTER
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar name={request.authorName} size={56} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{request.authorName}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {request.authorLocation}
                  </p>
                  <span className="badge badge-teal" style={{ marginTop: '8px', fontSize: '11px' }}>
                    Seeker
                  </span>
                </div>
              </div>
            </div>

            {/* Helpers Card */}
            <div className="white-card" style={{ padding: '28px' }}>
              <span className="card-label" style={{ display: 'block', marginBottom: '16px' }}>
                HELPERS
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {hasAcceptedHelper 
                  ? '✅ Helper assigned - You can now chat!' 
                  : 'People ready to support'}
              </p>

              {request.helpers?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {request.helpers.map((helper, idx) => {
                    const hasRated = request.ratings?.[helper.uid];
                    const isPending = helper.status === 'pending';
                    const isAccepted = helper.status === 'accepted';
                    const isRejected = helper.status === 'rejected';
                    
                    return (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '12px',
                          padding: '16px',
                          background: isAccepted ? 'var(--teal-light)' : 'var(--surface2)',
                          borderRadius: '12px',
                          border: isAccepted ? '1px solid var(--teal)' : '1px solid var(--border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={helper.name} size={44} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p style={{ fontSize: '15px', fontWeight: 700 }}>{helper.name}</p>
                              {isAccepted && (
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: 'var(--teal)', 
                                  fontWeight: 600 
                                }}>
                                  ✓ ACCEPTED
                                </span>
                              )}
                              {isRejected && (
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: '#ef4444', 
                                  fontWeight: 600 
                                }}>
                                  ✗ REJECTED
                                </span>
                              )}
                              {isPending && (
                                <span style={{ 
                                  fontSize: '11px', 
                                  color: 'var(--text-muted)', 
                                  fontWeight: 600 
                                }}>
                                  ⏳ PENDING
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {helper.skills?.slice(0, 3).join(', ')}
                            </p>
                            {hasRated && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    fill={i < hasRated.rating ? '#fbbf24' : 'none'}
                                    color={i < hasRated.rating ? '#fbbf24' : 'var(--border-md)'}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="badge badge-teal" style={{ fontSize: '11px' }}>
                            Trust {helper.trustScore}%
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* Seeker Actions */}
                          {isAuthor && isPending && !hasAcceptedHelper && (
                            <>
                              <button
                                onClick={() => handleAcceptHelper(helper.uid)}
                                disabled={actionLoading}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'var(--teal)',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={14} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectHelper(helper.uid)}
                                disabled={actionLoading}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-md)',
                                  background: 'white',
                                  color: 'var(--text-secondary)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Message Button - For accepted helper or seeker */}
                          {isAccepted && (
                            <button
                              onClick={() => handleStartChat(helper.uid)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'white',
                                color: 'var(--teal)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <MessageSquare size={14} />
                              Message
                            </button>
                          )}

                          {/* Rate Button */}
                          {isSolved && isAuthor && !hasRated && (
                            <button
                              onClick={() => openRatingModal(helper)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--teal)',
                                background: 'var(--teal-light)',
                                color: 'var(--teal)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Rate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>
                  Be the first to help!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSubmit={handleRateHelper}
        helperName={selectedHelper?.name}
      />
    </div>
  );
};

export default RequestDetailPage;
