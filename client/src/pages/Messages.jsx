import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { 
  Send, Image as ImageIcon, Paperclip, Smile, MoreVertical, Search, CheckCheck, 
  Users, ArrowLeft, Clock, MessageSquare, Trash2, Edit2, X, File as FileIcon, Ban
} from 'lucide-react';
import { userAPI, chatAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../components/CustomDialog';

const Messages = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showOptions, setShowOptions] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  
  const showToast = (title, message) => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      position: 'top',
      onConfirm: closeDialog
    });
  };

  const handleDeleteChat = () => {
    if (selectedChat === null || !chatList[selectedChat]) return;
    const targetUser = chatList[selectedChat].user;
    setShowChatMenu(false);
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Chat',
      message: `Delete all messages with ${targetUser.name}? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onCancel: closeDialog,
      onConfirm: async () => {
        closeDialog();
        try {
          await chatAPI.deleteChat(targetUser._id);
          setChatList(prev => prev.filter((_, idx) => idx !== selectedChat));
          setMessages([]);
          setSelectedChat(null);
          showToast('Done', 'Chat deleted successfully.');
        } catch (err) {
          showToast('Error', 'Failed to delete chat.');
        }
      }
    });
  };

  // For media URLs
  const SERVER_IP_MSG = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;
  const MEDIA_BASE = `http://${SERVER_IP_MSG}:5000`;
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${MEDIA_BASE}/${path.startsWith('uploads') ? '' : 'uploads/'}${path.replace(/\\/g, '/')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatList = async (autoSelectId = null) => {
    try {
      const response = await chatAPI.getChatList();
      setChatList(response.data);
      
      if (autoSelectId) {
        const index = response.data.findIndex(c => c.user._id === autoSelectId);
        if (index !== -1) setSelectedChat(index);
      }
    } catch (error) {
      console.error('Failed to fetch chat list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    fetchChatList(userId);
  }, []);

  useEffect(() => {
    if (selectedChat !== null && chatList[selectedChat]) {
      const fetchMessages = async () => {
        try {
          const response = await chatAPI.getMessages(chatList[selectedChat].user._id);
          setMessages(response.data);
          
          if (chatList[selectedChat].unreadCount > 0) {
            await chatAPI.markAsRead(chatList[selectedChat].user._id);
            const updatedList = [...chatList];
            updatedList[selectedChat].unreadCount = 0;
            setChatList(updatedList);
          }
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      };
      fetchMessages();
      scrollToBottom();
      
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChat, chatList.length]);

  useEffect(() => {
    const closeMenu = (e) => {
      if (!e.target.closest('.chat-menu-container') && showChatMenu) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [showChatMenu]);

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    prevMessageCountRef.current = 0;
  }, [selectedChat]);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current || messages.length === 0) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || selectedChat === null || !chatList[selectedChat]) return;
    try {
      const recipientId = chatList[selectedChat].user._id;
      const res = await chatAPI.sendMessage(recipientId, messageText);
      setMessages([...messages, res.data]);
      setMessageText('');
      fetchChatList();
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || selectedChat === null || !chatList[selectedChat]) return;
    
    const recipientId = chatList[selectedChat].user._id;
    const formData = new FormData();
    formData.append('recipientId', recipientId);
    formData.append('media', file);
    formData.append('text', ''); // Optional caption

    try {
      const res = await chatAPI.sendMessage(recipientId, formData);
      setMessages([...messages, res.data]);
      fetchChatList();
    } catch (error) {
      console.error('Failed to upload file', error);
      showToast('Error', 'Failed to upload file. Please try again.');
    }
  };

  const handleEditMessage = async () => {
    if (!editText.trim() || !editingMessage) return;
    try {
      await chatAPI.editMessage(editingMessage, editText);
      setMessages(messages.map(m => m._id === editingMessage ? { ...m, text: editText } : m));
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to edit message', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatAPI.deleteMessage(messageId);
      setMessages(messages.filter(m => m._id !== messageId));
      setShowOptions(null);
    } catch (error) {
      console.error('Failed to delete message', error);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getChatLabel = (dateStr) => {
    if (!dateStr) return 'No messages yet';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return formatTime(dateStr);
    return date.toLocaleDateString();
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading your conversations...</div>;

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : { _id: null, name: 'Guest' };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload}
        accept="image/*,video/*,.pdf,.doc,.docx"
      />

      <div className="messages-page-wrapper">
        <div className="messages-main-container">
          {chatList.length > 0 ? (
            <div className="messages-layout-grid" style={{ gridTemplateColumns: selectedChat !== null ? '380px 1fr' : '1fr' }}>
              
              <div className={`chat-list-pane ${selectedChat !== null ? 'hide-on-mobile' : ''}`}>
                <div className="chat-list-header">
                  <div className="header-top-row">
                    <button onClick={() => navigate(-1)} className="back-icon-btn">
                      <ArrowLeft size={26} strokeWidth={2.5} />
                    </button>
                    <h1>Messages</h1>
                  </div>
                  <div className="search-bar-wrapper">
                    <Search size={20} color="#94a3b8" />
                    <input type="text" placeholder="Search chats..." />
                  </div>
                </div>
                
                <div className="chat-items-scroll">
                  {chatList.map((chat, idx) => (
                    <div 
                      key={chat.user._id} 
                      onClick={() => setSelectedChat(idx)}
                      className={`chat-item-row ${selectedChat === idx ? 'active' : ''}`}
                    >
                      <div className="avatar-box" style={{ position: 'relative' }}>
                        {chat.user.avatar ? (
                          <img src={getAvatarUrl(chat.user.avatar)} alt="avatar" />
                        ) : (
                          <span>{chat.user.name[0]}</span>
                        )}
                        {chat.isBlockedByMe && (
                          <div className="blocked-badge" title="You have blocked this user">
                            <Ban size={10} color="white" />
                          </div>
                        )}
                      </div>
                      <div className="item-content">
                        <div className="content-top">
                          <h4>{chat.user.name}</h4>
                          <span className="time-stamp">{getChatLabel(chat.latestMessageTime)}</span>
                        </div>
                        <p className={`message-preview ${chat.unreadCount > 0 ? 'unread' : ''}`}>
                          {chat.latestMessage || 'Start a conversation'}
                        </p>
                      </div>
                      {chat.unreadCount > 0 && <div className="unread-dot">{chat.unreadCount}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {selectedChat !== null ? (
                <div className="chat-window-pane">
                  <div className="chat-header-bar">
                    <div className="header-left">
                      <button onClick={() => setSelectedChat(null)} className="mobile-only-btn">
                        <ArrowLeft size={22} strokeWidth={2.5} />
                      </button>
                      <div 
                        className="header-avatar" 
                        style={{ overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${chatList[selectedChat].user._id}`)}
                      >
                        {chatList[selectedChat].user.avatar ? (
                          <img src={getAvatarUrl(chatList[selectedChat].user.avatar)} alt="header-avatar" />
                        ) : chatList[selectedChat].user.name[0]}
                      </div>
                      <div 
                        className="header-info" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${chatList[selectedChat].user._id}`)}
                      >
                        <h4>
                          {chatList[selectedChat].user.name}
                          {chatList[selectedChat].isBlockedByMe && (
                            <span className="blocked-header-badge" title="You have blocked this user">
                              <Ban size={13} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                              Blocked
                            </span>
                          )}
                        </h4>
                        <span className="status-indicator">
                          {chatList[selectedChat].isBlockedByMe ? 'You blocked this user' : 'Active now'}
                        </span>
                      </div>
                    </div>
                    <div className="chat-menu-container" style={{ position: 'relative' }}>
                      <MoreVertical 
                        size={20} 
                        color="#64748b" 
                        cursor="pointer" 
                        onClick={() => setShowChatMenu(!showChatMenu)}
                      />
                      {showChatMenu && (
                        <div className="chat-action-menu">
                          <button onClick={async () => {
                            try {
                              await userAPI.toggleBlockUser(chatList[selectedChat].user._id);
                              showToast('Success', 'User Blocked/Unblocked successfully!');
                            } catch(err){
                              showToast('Error', 'Failed to block user.');
                            }
                            setShowChatMenu(false);
                          }}>Block</button>
                          
                          <button onClick={async () => {
                            try {
                              await userAPI.toggleCloseFriend(chatList[selectedChat].user._id);
                              showToast('Success', 'Close Friend status toggled!');
                            } catch(err){
                              showToast('Error', 'Failed to toggle close friend.');
                            }
                            setShowChatMenu(false);
                          }}>Toggle Close Friend</button>
                          
                          <button className="danger" onClick={handleDeleteChat}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="messages-scroll-area">
                    {(!messages || messages.length === 0) ? (
                      <div className="empty-chat-welcome">
                        <div className="welcome-icon"><MessageSquare size={32} color="var(--primary-color)" /></div>
                        <p>Say hi to {chatList[selectedChat].user.name}!</p>
                      </div>
                    ) : messages.map((m, i) => {
                      const showDateSeparator = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                      
                      return (
                        <React.Fragment key={m._id}>
                          {showDateSeparator && (
                            <div className="date-separator">
                              <span>{getDateLabel(m.createdAt)}</span>
                            </div>
                          )}
                          <div className={`message-wrapper ${m.sender === currentUser?._id ? 'sent' : 'received'}`}>
                            <div 
                              className="msg-bubble"
                              onMouseEnter={() => m.sender === currentUser?._id && setShowOptions(m._id)}
                              onMouseLeave={() => setShowOptions(null)}
                            >
                              {m.mediaUrl && (
                                <div className="message-media" style={{ marginBottom: m.text ? '0.8rem' : 0 }}>
                                  {m.mediaType === 'image' && (
                                    <img src={`${MEDIA_BASE}${m.mediaUrl}`} alt="media" style={{ maxWidth: '100%', borderRadius: '12px', display: 'block' }} />
                                  )}
                                  {m.mediaType === 'video' && (
                                    <video src={`${MEDIA_BASE}${m.mediaUrl}`} controls style={{ maxWidth: '100%', borderRadius: '12px' }} />
                                  )}
                                  {m.mediaType === 'document' && (
                                    <a href={`${MEDIA_BASE}${m.mediaUrl}`} target="_blank" rel="noreferrer" className="doc-link">
                                      <FileIcon size={20} />
                                      <span>Download Document</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {editingMessage === m._id ? (
                                <div className="edit-box">
                                  <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                                  <div className="edit-actions">
                                    <X size={18} onClick={() => setEditingMessage(null)} />
                                    <CheckCheck size={18} onClick={handleEditMessage} />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {m.text}
                                  {m.sender === currentUser?._id && showOptions === m._id && (
                                    <div className="msg-options">
                                      <Edit2 size={14} onClick={() => { setEditingMessage(m._id); setEditText(m.text); }} />
                                      <Trash2 size={14} onClick={() => handleDeleteMessage(m._id)} />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <span className="msg-time">
                              {formatTime(m.createdAt)}
                              {m.sender === currentUser?._id && <CheckCheck size={14} style={{ opacity: m.isRead ? 1 : 0.5 }} />}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-area">
                    <div className="input-extras">
                      <Paperclip size={22} onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }} />
                      <ImageIcon size={22} onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }} />
                    </div>
                    <div className="input-field-wrapper">
                       <input 
                        type="text" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type something..."
                      />
                    </div>
                    <button onClick={handleSendMessage} className="send-circle-btn">
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="desktop-only-placeholder">
                   <div className="placeholder-icon"><MessageSquare size={40} color="var(--primary-color)" style={{ opacity: 0.3 }} /></div>
                   <h3>Your Conversations</h3>
                   <p>Select a chat to view the message history.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon-circle"><Users size={50} color="var(--primary-color)" /></div>
              <h2>Connect & Chat</h2>
              <p>You haven't started any conversations yet. Connect with professionals to start networking.</p>
              <button onClick={() => navigate('/networking')} className="btn-premium btn-premium-primary">
                Find Connections
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .messages-page-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 70px);
          padding-top: 70px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .messages-main-container {
          flex: 1;
          max-width: 1200px;
          width: 95%;
          margin: 15px auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          border: 1px solid var(--border-color);
          display: flex;
        }
        .messages-layout-grid {
          display: grid;
          width: 100%;
          height: 100%;
        }
        
        .chat-list-pane { display: flex; flex-direction: column; background: white; border-right: 1px solid var(--border-color); height: 100%; }
        .chat-list-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border-color); }
        .header-top-row { display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.5rem; }
        .header-top-row h1 { margin: 0; font-weight: 800; font-size: 1.8rem; letter-spacing: -0.5px; }
        .back-icon-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: var(--text-primary); }
        .search-bar-wrapper { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem 1.2rem; border-radius: 15px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .search-bar-wrapper input { background: none; border: none; outline: none; width: 100%; font-size: 1rem; color: var(--text-primary); }

        .chat-items-scroll { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
        .chat-item-row { padding: 1.2rem 2rem; display: flex; gap: 1.2rem; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f1f5f9; position: relative; }
        .chat-item-row:hover { background: #f8fafc; }
        .chat-item-row.active { background: #eef2ff; }
        .avatar-box { width: 56px; height: 56px; border-radius: 18px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #4f46e5; flex-shrink: 0; font-size: 1.2rem; }
        .avatar-box img { width: 100%; height: 100%; border-radius: 18px; object-fit: cover; }
        .item-content { flex: 1; overflow: hidden; }
        .content-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
        .content-top h4 { margin: 0; font-weight: 700; font-size: 1.05rem; }
        .time-stamp { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        .message-preview { margin: 0; font-size: 0.9rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .message-preview.unread { font-weight: 600; color: var(--text-primary); }
        .unread-dot { background: #4f46e5; color: white; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; box-shadow: 0 4px 10px rgba(79,70,229,0.2); align-self: center; }

        .chat-window-pane { display: flex; flex-direction: column; background: white; height: 100%; overflow: hidden; }
        .chat-header-bar { flex-shrink: 0; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: white; z-index: 10; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .header-avatar { width: 42px; height: 42px; border-radius: 12px; background: #eef2ff; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #4f46e5; }
        .header-avatar img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
        .header-info h4 { margin: 0; font-size: 1.05rem; }
        .status-indicator { font-size: 0.75rem; color: #10b981; font-weight: 600; }
        
        .messages-scroll-area { flex: 1; padding: 1rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; background: #f8fafc; }
        .message-wrapper { max-width: 75%; display: flex; flex-direction: column; }
        .message-wrapper.sent { align-self: flex-end; align-items: flex-end; }
        .message-wrapper.received { align-self: flex-start; }
        .msg-bubble { padding: 0.8rem 1.1rem; border-radius: 20px 20px 20px 5px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.03); font-size: 0.95rem; line-height: 1.5; position: relative; word-break: break-word; color: #1e293b; }
        .sent .msg-bubble { background: #4f46e5; color: white; border-radius: 20px 20px 5px 20px; }
        .msg-time { font-size: 0.7rem; color: #94a3b8; margin-top: 0.3rem; display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
        
        .date-separator {
          display: flex;
          justify-content: center;
          margin: 1.5rem 0;
          position: relative;
        }
        .date-separator span {
          background: #e2e8f0;
          color: #475569;
          padding: 0.4rem 1rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .chat-input-area { flex-shrink: 0; padding: 0.8rem 1.2rem; border-top: 1px solid var(--border-color); display: flex; gap: 0.8rem; align-items: center; background: white; z-index: 100; margin-bottom: 0; }
        .input-extras { display: flex; gap: 0.5rem; color: #94a3b8; }
        .input-field-wrapper { flex: 1; }
        .chat-input-area input { width: 100%; padding: 0.75rem 1.2rem; border-radius: 50px; border: 1px solid #e2e8f0; outline: none; background: #f8fafc; font-size: 0.95rem; }
        .send-circle-btn { width: 44px; height: 44px; border-radius: 50%; background: #4f46e5; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px rgba(79,70,229,0.2); }

        .desktop-only-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; color: #94a3b8; }
        .empty-state-card { padding: 6rem 2rem; text-align: center; width: 100%; }
        .mobile-only-btn { display: none; background: none; border: none; cursor: pointer; color: var(--text-primary); }

        .doc-link { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; background: #f1f5f9; border-radius: 12px; text-decoration: none; color: #1e293b; font-weight: 600; font-size: 0.9rem; }
        .doc-link:hover { background: #e2e8f0; }
        
        .chat-action-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: #1e293b;
          border-radius: 12px;
          padding: 0.5rem 0;
          min-width: 180px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          z-index: 500;
          display: flex;
          flex-direction: column;
        }
        .chat-action-menu button {
          background: none;
          border: none;
          text-align: left;
          padding: 0.8rem 1.2rem;
          color: white;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .chat-action-menu button:hover {
          background: rgba(255,255,255,0.1);
        }
        .chat-action-menu button.danger {
          color: #ef4444;
        }

        .blocked-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        .blocked-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #fee2e2;
          color: #ef4444;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          margin-left: 6px;
          vertical-align: middle;
        }
        .chat-header-bar .status-indicator {
          color: inherit;
        }
        .chat-header-bar .status-indicator[data-blocked='true'] {
          color: #ef4444;
        }

        @media (max-width: 991px) {
          .messages-page-wrapper { height: calc(100vh - 70px); padding-top: 70px; }
          .messages-main-container { width: 100%; margin: 0; border-radius: 0; border: none; height: 100%; }
          .messages-layout-grid { grid-template-columns: 1fr !important; }
          .hide-on-mobile { display: none !important; }
          .mobile-only-btn { display: flex; }
          .desktop-only-placeholder { display: none !important; }
          .message-wrapper { max-width: 85%; }
          .chat-list-header { padding: 1.2rem; }
          .chat-item-row { padding: 1.2rem; }

          /* Chat list view: leave room for MobileTabBar */
          .chat-list-pane { padding-bottom: 75px; }

          /* Chat window: take full height, no tab bar space needed */
          .chat-window-pane {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1100;
            height: 100vh;
            height: 100dvh;
            background: white;
          }
          .chat-header-bar {
            position: sticky;
            top: 0;
            z-index: 10;
            background: white;
          }
          .messages-scroll-area {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .chat-input-area {
            position: sticky;
            bottom: 0;
            padding: 0.6rem 1rem !important;
            background: white;
            z-index: 100;
            border-top: 1px solid #e2e8f0;
          }
        }
      `}</style>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

export default Messages;
