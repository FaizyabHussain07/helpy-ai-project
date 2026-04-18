import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Avatar from '../components/ui/Avatar';
import { Send, ArrowLeft, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const { user, userData } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [requestInfo, setRequestInfo] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to conversations
    const convosQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(convosQuery, async (snapshot) => {
      const convos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convos);
      setLoading(false);
      
      // Fetch user data for all conversation participants
      const userIds = new Set();
      convos.forEach(convo => {
        convo.participants?.forEach(pid => {
          if (pid !== user.uid) userIds.add(pid);
        });
      });
      
      // Fetch user details
      const usersData = {};
      for (const uid of userIds) {
        if (!users[uid]) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            usersData[uid] = userDoc.data();
          }
        }
      }
      if (Object.keys(usersData).length > 0) {
        setUsers(prev => ({ ...prev, ...usersData }));
      }
      
      // If URL has conversation ID, select it
      if (urlConversationId && !activeConversation) {
        const targetConvo = convos.find(c => c.id === urlConversationId);
        if (targetConvo) {
          selectConversation(targetConvo);
        }
      }
    });

    return () => unsubscribe();
  }, [user, urlConversationId]);

  const selectConversation = async (convo) => {
    setActiveConversation(convo);
    
    // Get other participant
    const otherId = convo.participants?.find(id => id !== user?.uid);
    if (otherId) {
      if (!users[otherId]) {
        const userDoc = await getDoc(doc(db, 'users', otherId));
        if (userDoc.exists()) {
          setUsers(prev => ({ ...prev, [otherId]: userDoc.data() }));
          setOtherUser(userDoc.data());
        }
      } else {
        setOtherUser(users[otherId]);
      }
    }
    
    // Get request info if available
    if (convo.requestId) {
      const requestDoc = await getDoc(doc(db, 'requests', convo.requestId));
      if (requestDoc.exists()) {
        setRequestInfo(requestDoc.data());
      }
    }
    
    // Subscribe to messages
    subscribeToMessages(convo.id);
  };

  const subscribeToMessages = (convoId) => {
    const messagesQuery = query(
      collection(db, 'conversations', convoId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });
  };

  const getConvoId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !activeConversation) return;

    setSending(true);
    const text = messageText.trim();
    setMessageText(''); // Clear immediately for better UX
    
    try {
      const convoId = activeConversation.id;
      const convoRef = collection(db, 'conversations', convoId, 'messages');
      
      // Add message
      await addDoc(convoRef, {
        senderId: user.uid,
        senderName: userData?.displayName || user.displayName,
        text: text,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update conversation metadata
      await updateDoc(doc(db, 'conversations', convoId), {
        lastMessage: {
          text: text,
          senderId: user.uid,
          senderName: userData?.displayName || user.displayName,
          createdAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Create notification for other user
      const otherId = activeConversation.participants?.find(id => id !== user?.uid);
      if (otherId) {
        await addDoc(collection(db, 'notifications'), {
          toUid: otherId,
          fromUid: user.uid,
          fromName: userData?.displayName || user.displayName,
          type: 'new_message',
          conversationId: convoId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (convo) => {
    const otherId = convo.participants?.find(id => id !== user?.uid);
    return users[otherId] || { displayName: 'Unknown', id: otherId };
  };

  const getLastMessagePreview = (convo) => {
    const lastMsg = convo.lastMessage;
    if (!lastMsg) return 'No messages yet';
    
    const isMyMessage = lastMsg.senderId === user?.uid;
    const prefix = isMyMessage ? 'You: ' : '';
    const text = lastMsg.text || '';
    return prefix + (text.length > 30 ? text.substring(0, 30) + '...' : text);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div className="page-container">
        {/* Hero Card */}
        <div className="hero-card">
          <span className="eyebrow eyebrow-muted" style={{ display: 'block', marginBottom: '12px' }}>
            INTERACTION / MESSAGING
          </span>
          <h1 className="hero-title" style={{ marginBottom: '8px' }}>
            Keep support moving through direct communication.
          </h1>
          <p className="hero-subtitle">
            Basic messaging gives helpers and requesters a clear follow-up path.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '35% 62%', gap: '3%', marginTop: '32px', minHeight: '600px' }}>
          {/* Left - Conversation List */}
          <div className="white-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                Messages
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : conversations.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
                  No conversations yet. Accept a helper to start chatting!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {conversations.map((convo) => {
                    const otherUser = getOtherParticipant(convo);
                    const isActive = activeConversation?.id === convo.id;
                    return (
                      <div 
                        key={convo.id}
                        onClick={() => selectConversation(convo)}
                        style={{
                          padding: '16px 20px',
                          cursor: 'pointer',
                          background: isActive ? 'var(--teal-light)' : 'white',
                          borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={otherUser.displayName} size={44} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {otherUser.displayName}
                            </p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getLastMessagePreview(convo)}
                            </p>
                            {convo.requestTitle && (
                              <p style={{ fontSize: '11px', color: 'var(--teal)', marginTop: '2px' }}>
                                Re: {convo.requestTitle.slice(0, 30)}{convo.requestTitle.length > 30 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {convo.lastMessage?.createdAt ? formatTime(convo.lastMessage.createdAt) : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right - Chat Window */}
          <div className="white-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => setActiveConversation(null)}
                      style={{ display: 'none' }} // Hidden on desktop, shown on mobile
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <Avatar name={otherUser?.displayName} size={40} />
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 700 }}>{otherUser?.displayName}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {otherUser?.role === 'helper' ? 'Helper' : otherUser?.role === 'seeker' ? 'Seeker' : 'Member'}
                      </p>
                    </div>
                  </div>
                  {requestInfo && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>About request:</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal)' }}>
                        {requestInfo.title?.slice(0, 25)}{requestInfo.title?.length > 25 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId === user?.uid;
                      const showDate = idx === 0 || 
                        formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt);
                      
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div style={{ textAlign: 'center', margin: '16px 0' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface2)', padding: '4px 12px', borderRadius: '12px' }}>
                                {formatDate(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ 
                              maxWidth: '70%', 
                              padding: '12px 16px', 
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isMe ? 'var(--teal)' : 'var(--surface2)',
                              color: isMe ? 'white' : 'var(--text-primary)'
                            }}>
                              <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{msg.text}</p>
                              <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '24px',
                      border: '1px solid var(--border-md)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: 'none',
                      background: messageText.trim() ? 'var(--teal)' : 'var(--border)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: messageText.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '48px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Send size={32} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
