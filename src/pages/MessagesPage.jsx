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

        <div style={{ display: 'grid', gridTemplateColumns: '55% 40%', gap: '5%', marginTop: '32px' }}>
          {/* Left - Conversation Stream */}
          <div className="white-card" style={{ padding: '28px' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              CONVERSATION STREAM
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              Recent messages
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : conversations.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>
                No conversations yet. Start by sending a message!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {conversations.map((convo, idx) => {
                  const otherUser = getOtherParticipant(convo);
                  return (
                    <div 
                      key={convo.id}
                      style={{
                        padding: '16px 0',
                        borderBottom: idx < conversations.length - 1 ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={otherUser.displayName} size={36} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600 }}>
                            {convo.lastMessage?.slice(0, 60)}{convo.lastMessage?.length > 60 ? '...' : ''}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            With {otherUser.displayName}
                          </p>
                        </div>
                        <span className="badge badge-teal" style={{ fontSize: '11px' }}>
                          {formatTime(convo.updatedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right - Send Message */}
          <div className="white-card" style={{ padding: '28px', height: 'fit-content' }}>
            <span className="card-label" style={{ display: 'block', marginBottom: '4px' }}>
              SEND MESSAGE
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              Start a conversation
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                To
              </label>
              <select 
                className="select-field"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.location || 'Remote'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: 'var(--text-secondary)'
              }}>
                Message
              </label>
              <textarea
                className="textarea-field"
                placeholder="Share support details, ask for files, or coordinate timing..."
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            <button 
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleSendMessage}
              disabled={!selectedUser || !messageText.trim() || sending}
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
