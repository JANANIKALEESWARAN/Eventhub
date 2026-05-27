import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import { Camera, FileText, CalendarDays, BarChart3, Sparkles, Clock, Zap, TrendingUp, Users2, BookOpen, Shuffle, Plus, Trash2, ChevronLeft, ChevronRight, Heart, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { postAPI, feedAPI, storyAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';

const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

// ─── Map a raw DB post → FastAPI /rank-feed schema ───────────────────────────
const toMLPost = (post) => {
  const ageHrs = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
  return {
    id: post._id,
    likes: post.likes?.length ?? 0,
    comments: post.comments?.length ?? 0,
    shares: 0,
    hours: parseFloat(ageHrs.toFixed(2)),
    category: (post.tags?.[0] ?? post.type ?? 'general').toLowerCase(),
    hashtags: (post.tags ?? []).map(t => t.toLowerCase()),
  };
};

// ─── Score badge colour helper ────────────────────────────────────────────────
const scoreColor = (score) => {
  if (score >= 0.6) return { bg: '#dcfce7', color: '#166534' };
  if (score >= 0.3) return { bg: '#fef9c3', color: '#854d0e' };
  return { bg: '#f1f5f9', color: '#64748b' };
};

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://${SERVER_IP}:5000/${path.startsWith('uploads') ? '' : 'uploads/'}${path.replace(/\\/g, '/')}`;
  };
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('text'); // text | media | event | poll | article
  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [eventData, setEventData] = useState({ title: '', date: '', location: '' });
  const [rawPosts, setRawPosts] = useState([]);
  const [rankedIds, setRankedIds] = useState([]);   // [{id, scores}]
  const [feedMode, setFeedMode] = useState('smart');
  const [mlOnline, setMlOnline] = useState(null); // null | true | false
  const [mlLoading, setMlLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [seenStories, setSeenStories] = useState(() => {
    return JSON.parse(localStorage.getItem('seenStories') || '[]');
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        return JSON.parse(stored);
      }
      return { role: 'guest' };
    } catch (e) { return { role: 'guest' }; }
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        setCurrentUser(JSON.parse(stored));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [storyReplyText, setStoryReplyText] = useState('');
  const [showStoryDetails, setShowStoryDetails] = useState(false);
  const storyInputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // ── Mark as seen ──
  const markAsSeen = (storyId) => {
    if (!seenStories.includes(storyId)) {
      const updated = [...seenStories, storyId];
      setSeenStories(updated);
      localStorage.setItem('seenStories', JSON.stringify(updated));
    }
  };

  const handleDeleteStory = async (storyId) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Story',
      message: 'Are you sure you want to delete this story?',
      confirmText: 'Delete',
      onCancel: closeDialog,
      onConfirm: async () => {
        try {
          await storyAPI.deleteStory(storyId);
          setSelectedStory(null);
          fetchStories();
          setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Story deleted successfully', position: 'top', onConfirm: closeDialog });
        } catch (err) {
          setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to delete story', position: 'top', onConfirm: closeDialog });
        }
      }
    });
  };

  const handleLikeStory = async (storyId) => {
    try {
      const res = await storyAPI.likeStory(storyId);
      // Update the local stories
      setStories(prev => prev.map(s => s._id === storyId ? { ...s, likes: res.data } : s));

      if (selectedStory) {
        setSelectedStory(prev => prev.map(s => s._id === storyId ? { ...s, likes: res.data } : s));
      }
    } catch (err) {
      console.error('Failed to like story', err);
    }
  };

  const handleCommentStory = async (storyId) => {
    if (!storyReplyText.trim()) return;
    try {
      const res = await storyAPI.commentStory(storyId, storyReplyText);
      const updatedComments = res.data;

      // Update global stories array
      setStories(prev => prev.map(s => s._id === storyId ? { ...s, comments: updatedComments } : s));

      // Update currently viewed story group in modal
      if (selectedStory) {
        setSelectedStory(prev => prev.map(s => s._id === storyId ? { ...s, comments: updatedComments } : s));
      }

      setStoryReplyText('');
      showToast('Comment added to story details!');
    } catch (err) {
      console.error('Comment error:', err);
      showToast('Failed to add comment', 'error');
    }
  };

  const handleReplyStory = async (storyId) => {
    if (!storyReplyText.trim()) return;
    try {
      await storyAPI.replyToStory(storyId, storyReplyText);
      setStoryReplyText('');
      showToast('Message sent to creator!');
    } catch (err) {
      showToast('Failed to send message', 'error');
    }
  };

  // ── Process Stories ──
  const myStories = stories.filter(s => s.user?._id === currentUser._id || s.user === currentUser._id);
  const otherStoriesRaw = stories.filter(s => s.user?._id !== currentUser._id && s.user !== currentUser._id);

  // Group by user for the horizontal bar
  const groupedOtherStories = [];
  const userMap = new Map();

  otherStoriesRaw.forEach(s => {
    const userId = s.user?._id || s.user;
    if (!userMap.has(userId)) {
      userMap.set(userId, []);
      groupedOtherStories.push({ userId, stories: userMap.get(userId) });
    }
    userMap.get(userId).push(s);
  });

  // Sort grouped stories: users with unseen stories come first
  groupedOtherStories.sort((a, b) => {
    const aHasUnseen = a.stories.some(s => !seenStories.includes(s._id));
    const bHasUnseen = b.stories.some(s => !seenStories.includes(s._id));
    if (aHasUnseen && !bHasUnseen) return -1;
    if (!aHasUnseen && bHasUnseen) return 1;
    return 0;
  });

  // ── Story Progress Timer ──────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (selectedStory) {
      const currentStory = selectedStory[activeStoryIndex];
      // For images, use a timer. Videos use onEnded.
      if (currentStory.type === 'image') {
        timer = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              if (activeStoryIndex < selectedStory.length - 1) {
                setActiveStoryIndex(idx => idx + 1);
                markAsSeen(selectedStory[activeStoryIndex + 1]._id);
                return 0;
              } else {
                setSelectedStory(null);
                return 0;
              }
            }
            return prev + 1;
          });
        }, 50); // ~5 seconds per image (50ms * 100)
      } else {
        // For videos, we just update progress visually or hide it
        setProgress(0);
      }
    }
    return () => clearInterval(timer);
  }, [selectedStory, activeStoryIndex]);

  useEffect(() => {
    setProgress(0);
  }, [activeStoryIndex, selectedStory]);

  // ── Fetch stories ──────────────────────────────────────────────────────────
  const fetchStories = useCallback(async () => {
    try {
      const res = await storyAPI.getStories();
      setStories(res.data);
    } catch (err) {
      console.error('Failed to fetch stories', err);
    }
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await storyAPI.createStory(formData);
      fetchStories();
      showToast('Story uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error.response?.data?.message || error.message;
      showToast(`Upload failed: ${msg}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const checkMLStatus = async () => {
    try {
      await feedAPI.checkHealth();
      setMlOnline(true);
    } catch (err) {
      setMlOnline(false);
    }
  };

  // ── Fetch posts from MongoDB ──────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    try {
      const res = await postAPI.getPosts();
      console.log('DEBUG: Full API response for posts:', res.data);
      setRawPosts(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch posts', err);
      return [];
    }
  }, []);

  // ── Call FastAPI ranking service ──────────────────────────────────────────
  const rankPosts = useCallback(async (posts) => {
    if (!posts.length) return;
    setMlLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const interests = stored.interests ?? ['tech', 'ai', 'events'];
      const ranked = await feedAPI.rankFeed({ interests }, posts.map(toMLPost));
      setRankedIds(ranked);
      setMlOnline(true);
    } catch (err) {
      console.warn('ML service offline – falling back to chronological order', err);
      setMlOnline(false);
      setFeedMode('recent');
    } finally {
      setMlLoading(false);
    }
  }, []);

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPosts().then(posts => rankPosts(posts));
    fetchStories();
    const interval = setInterval(checkMLStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchPosts, rankPosts, fetchStories]);

  // ── Compute displayed feed ────────────────────────────────────────────────
  const postMap = Object.fromEntries(rawPosts.map(p => [p._id, p]));
  const scoreMap = Object.fromEntries(rankedIds.map(r => [r.id, r.scores]));

  const displayedPosts = (() => {
    if (feedMode === 'smart' && rankedIds.length) {
      const ranked = rankedIds.map(r => postMap[r.id]).filter(Boolean);
      if (ranked.length > 0) return ranked;
    }
    return rawPosts;
  })();

  const handlePost = async () => {
    if (!postText.trim() && !selectedFile) return;

    setUploading(true);
    try {
      const hashtags = postText.match(/#[\w\u0080-\uFFFF]+/g)?.map(tag => tag.slice(1)) || [];
      
      // Auto-generation logic: Extract keywords even without #
      const commonKeywords = ['hiring', 'job', 'student', 'developer', 'intern', 'opportunity', 'career', 'tech', 'innovation', 'project'];
      const autoKeywords = commonKeywords.filter(kw => 
        new RegExp(`\\b${kw}\\b`, 'i').test(postText)
      );
      
      const extractedTags = [...new Set([...hashtags, ...autoKeywords])];

      let data;
      if (selectedFile || modalMode === 'media') {
        data = new FormData();
        data.append('content', postText);
        data.append('type', 'media');
        data.append('tags', JSON.stringify(extractedTags));
        if (selectedFile) data.append('media', selectedFile);
      } else {
        data = {
          content: postText,
          type: modalMode,
          tags: extractedTags
        };
        if (modalMode === 'poll') data.pollOptions = pollOptions;
        if (modalMode === 'event') data.eventData = eventData;
      }

      const res = await postAPI.createPost(data);
      const updated = [res.data, ...rawPosts];
      setRawPosts(updated);

      // Reset
      setPostText('');
      setSelectedFile(null);
      setPollOptions(['', '']);
      setEventData({ title: '', date: '', location: '' });
      setModalMode('text');
      setShowModal(false);
      rankPosts(updated);
    } catch (err) {
      console.error('Failed to create post', err);
      showToast('Failed to create post: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container home-grid">
        <Sidebar role="user" />

        <main>
          {/* ── Stories Bar ── */}
          <div className="premium-card" style={{
            marginBottom: '2rem',
            padding: '1.25rem',
            overflowX: 'auto',
            display: 'flex',
            gap: '1.25rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            alignItems: 'center'
          }}>
            {/* Your Story Rectangle */}
            <div style={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
              <div
                onClick={() => {
                  if (myStories.length > 0) {
                    setSelectedStory(myStories);
                    setActiveStoryIndex(0);
                    markAsSeen(myStories[0]._id);
                  } else {
                    fileInputRef.current.click();
                  }
                }}
                style={{
                  width: '72px', height: '72px', borderRadius: '18px',
                  padding: '2.5px',
                  background: myStories.length > 0 && myStories.some(s => !seenStories.includes(s._id))
                    ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'
                    : '#e2e8f0',
                  position: 'relative'
                }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '15px', background: 'white', padding: '2px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '13px', overflow: 'hidden', background: 'var(--primary-light)' }}>
                    {myStories.length > 0 ? (
                      myStories[0].type === 'video' ?
                        <video src={myStories[0].content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                        <img src={myStories[0].content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-color)', overflow: 'hidden' }}>
                        {currentUser.avatar ? (
                          <img src={getAvatarUrl(currentUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : currentUser.name?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {/* Plus Icon Overlay */}
                <div
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                  style={{
                    position: 'absolute', bottom: '-4px', right: '-4px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--primary-color)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <Plus size={14} strokeWidth={3} />
                </div>
              </div>
              <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Your story</p>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*" />
            </div>

            {/* Others Stories (Rectangles) */}
            {groupedOtherStories.map((group) => {
              const firstStory = group.stories[0];
              const isAllSeen = group.stories.every(s => seenStories.includes(s._id));
              return (
                <div key={group.userId} onClick={() => {
                  setSelectedStory(group.stories);
                  setActiveStoryIndex(0);
                  markAsSeen(firstStory._id);
                }} style={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '18px',
                    padding: '2.5px',
                    background: isAllSeen ? '#e2e8f0' : 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)'
                  }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '15px', background: 'white', padding: '2px' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '13px', overflow: 'hidden' }}>
                        {firstStory.type === 'video' ? (
                          <video src={firstStory.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={firstStory.content} alt={firstStory.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', fontWeight: 600, color: isAllSeen ? '#94a3b8' : '#334155', maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firstStory.user?.name?.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Advanced Story Viewer Modal ── */}
          {selectedStory && selectedStory.length > 0 && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              {/* Progress Bars */}
              <div style={{ position: 'absolute', top: '15px', left: '10px', right: '10px', display: 'flex', gap: '4px', zIndex: 10001 }}>
                {selectedStory.map((s, idx) => (
                  <div key={s._id} style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: 'white',
                      width: idx < activeStoryIndex ? '100%' : (idx === activeStoryIndex ? `${progress}%` : '0%')
                    }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10001 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-color)', overflow: 'hidden' }}>
                    {selectedStory[activeStoryIndex].user?.avatar ? (
                      <img src={getAvatarUrl(selectedStory[activeStoryIndex].user.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : selectedStory[activeStoryIndex].user?.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{selectedStory[activeStoryIndex].user?.name}</p>
                    <p style={{ fontSize: '0.7rem', margin: 0, opacity: 0.8 }}>{new Date(selectedStory[activeStoryIndex].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  {(selectedStory[activeStoryIndex].user?._id === currentUser._id || selectedStory[activeStoryIndex].user === currentUser._id) && (
                    <Trash2
                      size={20}
                      onClick={(e) => { e.stopPropagation(); handleDeleteStory(selectedStory[activeStoryIndex]._id); }}
                      style={{ cursor: 'pointer', opacity: 0.8 }}
                    />
                  )}
                  <button
                    onClick={() => setSelectedStory(null)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                  >×</button>
                </div>
              </div>

              {/* Content Container (Story + Interaction) */}
              <div style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', height: '90vh', background: '#000', borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>

                {/* Story Media Area */}
                <div style={{ flex: 1, position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedStory[activeStoryIndex].type === 'video' ? (
                    <video
                      key={selectedStory[activeStoryIndex]._id}
                      src={selectedStory[activeStoryIndex].content?.startsWith('http') ? selectedStory[activeStoryIndex].content : `http://${SERVER_IP}:5000/uploads/${selectedStory[activeStoryIndex].content?.replace(/^uploads\//, '').replace(/^uploads\\/, '')}`}
                      autoPlay
                      onEnded={() => {
                        if (activeStoryIndex < selectedStory.length - 1) {
                          setActiveStoryIndex(activeStoryIndex + 1);
                          markAsSeen(selectedStory[activeStoryIndex + 1]._id);
                        } else {
                          setSelectedStory(null);
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <img
                      key={selectedStory[activeStoryIndex]._id}
                      src={selectedStory[activeStoryIndex].content?.startsWith('http') ? selectedStory[activeStoryIndex].content : `http://${SERVER_IP}:5000/uploads/${selectedStory[activeStoryIndex].content?.replace(/^uploads\//, '').replace(/^uploads\\/, '')}`}
                      alt="Story"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}

                  {/* Navigation Overlays */}
                  <div
                    onClick={() => {
                      if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
                    }}
                    style={{ position: 'absolute', left: 0, top: 0, width: '40%', height: '100%', cursor: 'pointer' }}
                  />
                  <div
                    onClick={() => {
                      if (activeStoryIndex < selectedStory.length - 1) {
                        setActiveStoryIndex(activeStoryIndex + 1);
                        markAsSeen(selectedStory[activeStoryIndex + 1]._id);
                      } else {
                        setSelectedStory(null);
                      }
                    }}
                    style={{ position: 'absolute', right: 0, top: 0, width: '40%', height: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Interaction Bar (NOW PLACED UNDER STORY) */}
                <div style={{
                  padding: '15px 20px',
                  background: '#000',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {/* Stats for Owner */}
                  {(selectedStory[activeStoryIndex].user?._id === currentUser._id || selectedStory[activeStoryIndex].user === currentUser._id) && (
                    <div
                      onClick={() => setShowStoryDetails(!showStoryDetails)}
                      style={{ display: 'flex', gap: '15px', color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', paddingBottom: '5px', opacity: 0.9 }}
                    >
                      <span>{selectedStory[activeStoryIndex].likes?.length || 0} Likes</span>
                      <span>{selectedStory[activeStoryIndex].comments?.length || 0} Comments</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>View Details</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        ref={storyInputRef}
                        type="text"
                        placeholder="Send a message..."
                        value={storyReplyText}
                        onChange={(e) => setStoryReplyText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%', padding: '10px 40px 10px 15px',
                          background: 'rgba(255,255,255,0.1)', border: 'none',
                          borderRadius: '20px', color: 'white', outline: 'none', fontSize: '0.85rem'
                        }}
                      />
                      <Send
                        size={18}
                        color="white"
                        onClick={(e) => { e.stopPropagation(); handleReplyStory(selectedStory[activeStoryIndex]._id); }}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', opacity: storyReplyText.trim() ? 1 : 0.5 }}
                        title="Send Private Message"
                      />
                    </div>

                    <Heart
                      size={26}
                      onClick={(e) => { e.stopPropagation(); handleLikeStory(selectedStory[activeStoryIndex]._id); }}
                      fill={selectedStory[activeStoryIndex].likes?.some(l => (l.user?._id || l.user || l) === currentUser._id) ? "#ff3040" : "transparent"}
                      color={selectedStory[activeStoryIndex].likes?.some(l => (l.user?._id || l.user || l) === currentUser._id) ? "#ff3040" : "white"}
                      style={{ cursor: 'pointer' }}
                    />

                    <MessageCircle
                      size={26}
                      color="white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (storyReplyText.trim()) {
                          handleCommentStory(selectedStory[activeStoryIndex]._id);
                        } else {
                          storyInputRef.current?.focus();
                        }
                      }}
                      style={{ cursor: 'pointer', opacity: storyReplyText.trim() ? 1 : 0.7 }}
                      title="Post Comment (Visible in Details)"
                    />
                  </div>
                </div>

                {/* Details Overlay (Owner Only) */}
                {showStoryDetails && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'white', zIndex: 10005, padding: '60px 20px 20px',
                    display: 'flex', flexDirection: 'column', color: '#333'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0 }}>Story Activity</h3>
                      <button onClick={() => setShowStoryDetails(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {/* Likes List */}
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#0a66c2', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                          Likes ({selectedStory[activeStoryIndex].likes?.length || 0})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          {selectedStory[activeStoryIndex].likes?.map((like, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                                {like.user?.avatar ? (
                                  <img src={getAvatarUrl(like.user.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#666' }}>
                                    {like.user?.name?.[0] || 'U'}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{like.user?.name || 'Anonymous'}</span>
                            </div>
                          ))}
                          {(!selectedStory[activeStoryIndex].likes || selectedStory[activeStoryIndex].likes.length === 0) && (
                            <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No likes yet</p>
                          )}
                        </div>
                      </div>

                      {/* Comments List */}
                      <div>
                        <h4 style={{ color: '#0a66c2', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                          Comments ({selectedStory[activeStoryIndex].comments?.length || 0})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {selectedStory[activeStoryIndex].comments?.map((comment, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.8rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                                {comment.user?.avatar ? (
                                  <img src={getAvatarUrl(comment.user.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#666' }}>
                                    {comment.user?.name?.[0] || 'U'}
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.1rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comment.user?.name || 'User'}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: '1.4' }}>{comment.text}</p>
                              </div>
                            </div>
                          ))}
                          {(!selectedStory[activeStoryIndex].comments || selectedStory[activeStoryIndex].comments.length === 0) && (
                            <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No comments yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prev/Next Buttons for Desktop */}
              <div style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translateY(-50%)', display: activeStoryIndex > 0 ? 'block' : 'none' }}>
                <ChevronLeft size={40} color="white" onClick={(e) => { e.stopPropagation(); setActiveStoryIndex(activeStoryIndex - 1); }} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', display: activeStoryIndex < selectedStory.length - 1 ? 'block' : 'none' }}>
                <ChevronRight size={40} color="white" onClick={(e) => { e.stopPropagation(); setActiveStoryIndex(activeStoryIndex + 1); markAsSeen(selectedStory[activeStoryIndex + 1]._id); }} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          )}

          {/* ── Create Post ── */}
          <div className="premium-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                {currentUser.avatar ? (
                  <img src={getAvatarUrl(currentUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : currentUser.name?.substring(0, 2).toUpperCase()}
              </div>
              <div
                onClick={() => { setModalMode('text'); setShowModal(true); }}
                style={{ flex: 1, padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 500, background: '#f8fafc' }}
              >
                What's on your mind, {currentUser.name?.split(' ')[0]}?
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', padding: '1rem 0 0', marginTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="create-post-opt" onClick={() => { setModalMode('media'); setShowModal(true); }} style={{ padding: '0.4rem', justifyContent: 'center' }}><Camera size={18} color="#3b82f6" /> <span style={{ fontSize: '0.75rem' }}>Media</span></button>
              <button className="create-post-opt" onClick={() => { setModalMode('article'); setShowModal(true); }} style={{ padding: '0.4rem', justifyContent: 'center' }}><FileText size={18} color="#10b981" /> <span style={{ fontSize: '0.75rem' }}>Article</span></button>
              <button className="create-post-opt" onClick={() => { setModalMode('poll'); setShowModal(true); }} style={{ padding: '0.4rem', justifyContent: 'center' }}><BarChart3 size={18} color="#8b5cf6" /> <span style={{ fontSize: '0.75rem' }}>Poll</span></button>
            </div>
          </div>

          {/* ── Feed Header + Toggle ── */}
          <div style={{ margin: '0 1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Your Feed</h3>
              {mlOnline === true && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#dcfce7', color: '#166534' }}>● AI Active</span>}
              {mlOnline === false && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#fef9c3', color: '#854d0e' }}>● ML Offline</span>}
              {mlOnline === null && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#f1f5f9', color: '#64748b' }}>Ranking…</span>}
            </div>

            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              <ToggleBtn active={feedMode === 'smart'} onClick={() => setFeedMode('smart')} disabled={!mlOnline} icon={<Sparkles size={13} />} label="Smart" />
              <ToggleBtn active={feedMode === 'recent'} onClick={() => setFeedMode('recent')} icon={<Clock size={13} />} label="Recent" />
            </div>
          </div>

          {/* ── Ranking Banner ── */}
          {mlLoading && (
            <div style={{ margin: '0 1rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #c7d2fe' }}>
              <Zap size={15} color="var(--primary-color)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>Running 5 ranking algorithms…</span>
            </div>
          )}

          {/* ── Posts ── */}
          {displayedPosts.map((post, idx) => {
            const scores = scoreMap[post._id];
            return (
              <div key={post._id} style={{ marginBottom: '1.5rem' }}>

                <div style={feedMode === 'smart' && scores ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}}>
                  <PostCard
                    id={post._id}
                    author={post.author?.name || 'Unknown User'}
                    authorAvatar={post.author?.avatar}
                    role={post.author?.bio || post.author?.role || 'User'}
                    content={post.content}
                    tags={post.tags}
                    media={post.media}
                    pollOptions={post.pollOptions}
                    eventData={post.eventData}
                    type={post.type}
                    authorId={post.author?._id}
                    likes={post.likes}
                    comments={post.comments}
                    repostCount={post.repostCount}
                    repostedFrom={post.repostedFrom}
                    isEvent={post.type === 'event'}
                    createdAt={post.createdAt}
                  />
                </div>
              </div>
            );
          })}

          {displayedPosts.length === 0 && !mlLoading && (
            <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>No posts yet. Be the first to share something!</p>
            </div>
          )}

        </main>

        {/* ── Enhanced Post Modal ── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div className="premium-card" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', animation: 'slideUp 0.3s ease', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, overflow: 'hidden' }}>
                    {currentUser.avatar ? (
                      <img src={getAvatarUrl(currentUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentUser.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                      {modalMode === 'media' && 'Share Media'}
                      {modalMode === 'event' && 'Host an Event'}
                      {modalMode === 'poll' && 'Create a Poll'}
                      {modalMode === 'article' && 'Write an Article'}
                      {modalMode === 'text' && 'Create a Post'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Visible to your entire network</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              {/* Dynamic Content */}
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {(modalMode === 'text' || modalMode === 'media' || modalMode === 'article') && (
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={modalMode === 'article' ? "Start your article..." : "What's on your mind?"}
                    style={{ width: '100%', minHeight: modalMode === 'article' ? '250px' : '120px', border: 'none', outline: 'none', fontSize: '1.1rem', resize: 'none', padding: '0', boxSizing: 'border-box', background: 'transparent' }}
                  />
                )}

                {modalMode === 'media' && (
                  <div style={{ marginTop: '1rem', border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', background: '#f8fafc' }}>
                    {selectedFile ? (
                      <div style={{ position: 'relative' }}>
                        {selectedFile.type.startsWith('video') ?
                          <video src={URL.createObjectURL(selectedFile)} style={{ width: '100%', borderRadius: '8px' }} /> :
                          <img src={URL.createObjectURL(selectedFile)} style={{ width: '100%', borderRadius: '8px' }} />
                        }
                        <button onClick={() => setSelectedFile(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>&times;</button>
                      </div>
                    ) : (
                      <div onClick={() => document.getElementById('post-media-input').click()} style={{ cursor: 'pointer' }}>
                        <Camera size={40} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>Click to upload photos or videos</p>
                        <input id="post-media-input" type="file" hidden onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*,video/*" />
                      </div>
                    )}
                  </div>
                )}

                {modalMode === 'poll' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      value={postText} onChange={(e) => setPostText(e.target.value)}
                      placeholder="Ask a question..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem' }}
                    />
                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx} value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                      />
                    ))}
                    <button onClick={() => setPollOptions([...pollOptions, ''])} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>+ Add option</button>
                  </div>
                )}

                {modalMode === 'event' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      value={eventData.title} onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                      placeholder="Event Title"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input
                        type="datetime-local"
                        value={eventData.date} onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                      />
                      <input
                        value={eventData.location} onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                        placeholder="Location"
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                      />
                    </div>
                    <textarea
                      value={postText} onChange={(e) => setPostText(e.target.value)}
                      placeholder="Event Description"
                      style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setModalMode('media')} style={{ background: modalMode === 'media' ? '#eff6ff' : 'none', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Camera size={20} color="#3b82f6" /></button>
                  <button onClick={() => setModalMode('event')} style={{ background: modalMode === 'event' ? '#fffbeb' : 'none', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><CalendarDays size={20} color="#f59e0b" /></button>
                  <button onClick={() => setModalMode('poll')} style={{ background: modalMode === 'poll' ? '#f5f3ff' : 'none', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><BarChart3 size={20} color="#8b5cf6" /></button>
                </div>
                <button
                  onClick={handlePost}
                  disabled={!postText.trim() && !selectedFile}
                  className="btn-premium btn-premium-primary"
                  style={{ opacity: (postText.trim() || selectedFile) ? 1 : 0.5, padding: '0.6rem 2rem' }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar removed */}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .create-post-opt {
          background: none; border: none;
          display: flex; align-items: center; gap: 0.6rem;
          color: var(--text-secondary); font-weight: 600;
          font-size: 0.9rem; cursor: pointer;
          padding: 0.5rem 0.8rem; border-radius: 8px;
          transition: var(--transition);
        }
        .create-post-opt:hover { background: #f1f5f9; color: var(--primary-color); }
      `}} />
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 11000,
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideInDown 0.3s ease-out'
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const ToggleBtn = ({ active, onClick, disabled, icon, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.4rem 0.75rem', borderRadius: '6px', border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: active ? 'white' : 'transparent',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
      fontWeight: active ? 700 : 500, fontSize: '0.8rem',
      transition: 'var(--transition)',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {icon} {label}
  </button>
);

const ScorePill = ({ icon, label, value }) => {
  const style = scoreColor(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 600, ...style }}>
      {icon} {label} {(value * 100).toFixed(0)}%
    </span>
  );
};

const AlgoRow = ({ icon, label, desc }) => (
  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
    <div style={{ marginTop: '1px', flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  </div>
);

const StoryItem = ({ name, image, isUser }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flexShrink: 0, cursor: 'pointer' }}>
    <div style={{ width: '60px', height: '60px', borderRadius: '12px', padding: '2px', border: isUser ? '1px dashed var(--border-color)' : '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', background: 'var(--primary-light)' }}>
        {(image)
          ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.9rem' }}>JK</div>
        }
      </div>
    </div>
    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
  </div>
);

export default Home;
