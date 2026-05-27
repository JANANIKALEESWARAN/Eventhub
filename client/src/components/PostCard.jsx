import React, { useState } from 'react';
import { Bookmark, Heart, MessageCircle, Share2, MoreHorizontal, Globe, Flag, Edit2, Trash2, Pencil, X, Check, Save, Send, Repeat } from 'lucide-react';
import { postAPI, reportAPI, userAPI } from '../api/api';
import CustomDialog from './CustomDialog';

const PostCard = ({ id, author, authorId, authorAvatar, role, content, tags, image, media, isEvent, eventTitle, eventDate, eventLocation, translatedContent, pollOptions: initialPoll, type, likes: initialLikes = [], comments: initialComments = [], repostCount: initialReposts = 0, repostedFrom, createdAt }) => {
  const [isTranslated, setIsTranslated] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [reposts, setReposts] = useState(initialReposts);
  const [pollOptions, setPollOptions] = useState(initialPoll || []);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [isSaved, setIsSaved] = useState(() => {
    if (!currentUser.savedPosts) return false;
    return currentUser.savedPosts.some(postId => 
      (typeof postId === 'object' ? postId._id : postId).toString() === id?.toString()
    );
  });

  const handleSave = async () => {
    try {
      const res = await postAPI.savePost(id);
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.savedPosts = res.data;
      localStorage.setItem('user', JSON.stringify(stored));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const [commentText, setCommentText] = useState('');

  const closeDialog = () => setDialogConfig({ ...dialogConfig, isOpen: false });

  const isLiking = likes.some(like => {
    const likeId = like?.user?._id || like?.user || (typeof like === 'object' ? like._id : like);
    return likeId === currentUser._id;
  });
  const isOwner = authorId === currentUser._id || currentUser.role === 'admin';

  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;
  const MEDIA_URL = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^uploads\//, '').replace(/^uploads\\/, '');
    return `http://${SERVER_IP}:5000/uploads/${cleanPath}`;
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://${SERVER_IP}:5000/${path.startsWith('uploads') ? '' : 'uploads/'}${path.replace(/\\/g, '/')}`;
  };

  const displayMedia = image || (media && media.length > 0 ? media[0] : null);

  const handleLike = async () => {
    try {
      const res = await postAPI.likePost(id);
      setLikes(res.data);
      if (!isLiking) {
        setShowHeartOverlay(true);
        setTimeout(() => setShowHeartOverlay(false), 1000);
      }
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await postAPI.commentPost(id, commentText);
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Comment failed', onConfirm: closeDialog });
    }
  };

  const handleVote = async (idx) => {
    try {
      const res = await postAPI.votePoll(id, idx);
      setPollOptions(res.data);
    } catch (err) {
      alert('Voting failed');
    }
  };

  const handleEdit = async () => {
    try {
      let payload;
      if (editMediaFile) {
        payload = new FormData();
        payload.append('content', editContent);
        payload.append('media', editMediaFile);
      } else {
        payload = { content: editContent };
      }
      
      await postAPI.updatePost(id, payload);
      setIsEditing(false);
      setShowMenu(false);
      setDialogConfig({ 
        isOpen: true, 
        type: 'alert', 
        title: 'Success', 
        message: 'Post edited successfully!', 
        position: 'top',
        onConfirm: () => window.location.reload() 
      });
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Edit failed', onConfirm: closeDialog });
    }
  };

  const handleMediaChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditMediaFile(e.target.files[0]);
      setEditMediaPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleDelete = async () => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post?',
      confirmText: 'Delete',
      onCancel: closeDialog,
      onConfirm: async () => {
        try {
          await postAPI.deletePost(id);
          setDialogConfig({ 
            isOpen: true, 
            type: 'alert', 
            title: 'Success', 
            message: 'Post deleted successfully!', 
            position: 'top',
            onConfirm: () => window.location.reload() 
          });
        } catch (err) {
          closeDialog();
          setTimeout(() => setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Delete failed', onConfirm: closeDialog }), 300);
        }
      }
    });
  };

  const totalVotes = pollOptions.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
  const userVotedIdx = pollOptions.findIndex(opt => opt.votes?.includes(currentUser._id));

  const handleReport = async () => {
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Report Post',
      message: 'Please enter the reason for reporting this post:',
      onCancel: closeDialog,
      onConfirm: async (reason) => {
        if (!reason) {
          closeDialog();
          return;
        }
        try {
          await reportAPI.createReport({
            targetType: 'Post',
            targetId: id,
            reason: reason,
            details: 'User reported from home feed'
          });
          closeDialog();
          setTimeout(() => setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Report submitted successfully.', position: 'top', onConfirm: closeDialog }), 300);
        } catch (error) {
          closeDialog();
          setTimeout(() => setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to submit report', position: 'top', onConfirm: closeDialog }), 300);
        }
      }
    });
  };

  const handleDoubleTap = (e) => {
    if (e.detail === 2) {
      handleLike();
    }
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "Just now";
  };

  const handleRepost = async () => {
    try {
      const res = await postAPI.repostPost(id);
      setReposts(res.data.repostCount);
      setDialogConfig({
        isOpen: true,
        type: 'alert',
        title: 'Success',
        message: 'Post reposted successfully!',
        onConfirm: () => {
          closeDialog();
          window.location.reload();
        }
      });
    } catch (err) {
      console.error('Repost failed', err);
      setDialogConfig({
        isOpen: true,
        type: 'alert',
        title: 'Error',
        message: 'Failed to repost. Please try again.',
        onConfirm: closeDialog
      });
    }
  };

  const handleSend = () => {
    const postUrl = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(postUrl);
    alert('Post link copied to clipboard!');
  };

  return (
    <div className="premium-card" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1rem' }}>
      {repostedFrom && (
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc' }}>
          <Repeat size={14} color="#666" />
          <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{author} reposted this</span>
        </div>
      )}
      <div style={{ padding: '0.75rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {(repostedFrom?.author?.avatar || authorAvatar) ? (
                <img 
                  src={getAvatarUrl(repostedFrom?.author?.avatar || authorAvatar)} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (repostedFrom?.author?.name?.[0] || author?.[0] || 'U')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>{repostedFrom?.author?.name || author}</h4>
                {currentUser.following?.includes(authorId) && (
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>• Following</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', lineHeight: '1.2' }}>{role}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>{getTimeAgo(createdAt)}</span>
                <Globe size={12} color="#666" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', alignItems: 'center' }}>
            <button 
              onClick={handleSave}
              style={{ background: 'none', border: 'none', color: isSaved ? '#0a66c2' : '#666', cursor: 'pointer', padding: '4px' }}
              title={isSaved ? "Unsave post" : "Save post"}
            >
              <Bookmark size={20} fill={isSaved ? '#0a66c2' : 'none'} />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, width: '180px', overflow: 'hidden' }}>
                {isOwner ? (
                  <>
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#444', textAlign: 'left' }}>
                      <Pencil size={16} /> Edit Post
                    </button>
                    <button onClick={handleDelete} style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444', textAlign: 'left' }}>
                      <Trash2 size={16} /> Delete Post
                    </button>
                  </>
                ) : (
                  <button onClick={handleReport} style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444', textAlign: 'left' }}>
                    <Flag size={16} /> Report Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ marginBottom: '0.75rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #0a66c2', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsEditing(false)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid #666', background: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEdit} style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', background: '#0a66c2', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.9rem', color: '#1a1a1a', margin: '0 0 0.5rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {(isTranslated ? translatedContent : content).split(/(\s+)/).map((part, i) => 
                  part.startsWith('#') ? <span key={i} style={{ color: '#0a66c2', fontWeight: 600, cursor: 'pointer' }}>{part}</span> : part
                )}
              </p>
              {translatedContent && (
                <button onClick={() => setIsTranslated(!isTranslated)} style={{ background: 'none', border: 'none', color: '#0a66c2', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  {isTranslated ? 'See original' : 'See translation'}
                </button>
              )}
              {tags && Array.isArray(tags) && tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} style={{ color: '#0a66c2', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>#{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Media */}
      {displayMedia && (
        <div 
          onClick={handleDoubleTap}
          style={{ width: '100%', background: '#f3f6f8', overflow: 'hidden', cursor: 'pointer' }}
        >
          {displayMedia.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || displayMedia.includes('video') ? (
            <video src={MEDIA_URL(displayMedia)} controls style={{ width: '100%', maxHeight: '500px', display: 'block' }} />
          ) : (
            <img src={MEDIA_URL(displayMedia)} alt="Post" style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'cover', display: 'block' }} />
          )}
        </div>
      )}

      {/* Event Card */}
      {(isEvent || type === 'event') && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f9fafb' }}>
            <span style={{ color: '#0a66c2', fontSize: '0.75rem', fontWeight: 700 }}>EVENT</span>
            <h4 style={{ margin: '0.25rem 0', fontSize: '1rem', fontWeight: 700 }}>{eventTitle}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{eventDate} • {eventLocation}</p>
            <button style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', borderRadius: '20px', border: '1px solid #0a66c2', color: '#0a66c2', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>View Event</button>
          </div>
        </div>
      )}

      {/* Poll */}
      {type === 'poll' && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pollOptions.map((opt, idx) => {
              const voteCount = opt.votes?.length || 0;
              const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
              const hasVoted = userVotedIdx !== -1;
              return (
                <div 
                  key={idx} 
                  onClick={() => !hasVoted && handleVote(idx)}
                  style={{ 
                    padding: '0.6rem 1rem', borderRadius: '4px', border: '1px solid #0a66c2', 
                    cursor: hasVoted ? 'default' : 'pointer', position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: hasVoted ? `${percent}%` : '0%', background: 'rgba(10, 102, 194, 0.1)', transition: 'width 0.5s' }} />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>{opt.text}</span>
                    {hasVoted && <span>{percent}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex' }}>
            <div style={{ background: '#ef4444', borderRadius: '50%', padding: '2px' }}><Heart size={10} color="white" fill="white" /></div>
          </div>
          <span onClick={() => setShowLikers(!showLikers)} style={{ fontSize: '0.75rem', color: '#666', cursor: 'pointer' }}>{likes.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#666' }}>
          <span onClick={() => setShowComments(!showComments)} style={{ cursor: 'pointer' }}>{comments.length} comments</span>
          <span>{reposts} reposts</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '4px 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
        <ActionButton icon={<Heart size={20} fill={isLiking ? '#ef4444' : 'none'} color={isLiking ? '#ef4444' : '#666'} />} label="Like" active={isLiking} activeColor="#ef4444" onClick={handleLike} />
        <ActionButton icon={<MessageCircle size={20} color="#666" />} label="Comment" onClick={() => setShowComments(!showComments)} />
        <ActionButton icon={<Repeat size={20} color="#666" />} label="Repost" onClick={handleRepost} />
        <ActionButton icon={<Send size={20} color="#666" />} label="Send" onClick={handleSend} />
      </div>

      {/* Likers/Comments lists stay simplified but functional */}
      {showComments && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
               {currentUser.avatar ? <img src={getAvatarUrl(currentUser.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#ccc' }} />}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #ccc', fontSize: '0.85rem', outline: 'none' }} 
              />
              <button 
                onClick={handleComment}
                disabled={!commentText.trim()}
                style={{ 
                  background: '#0a66c2', color: 'white', border: 'none', borderRadius: '50%', 
                  width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  opacity: commentText.trim() ? 1 : 0.5, flexShrink: 0
                }}
              >
                <Send size={16} style={{ marginLeft: '-2px' }} />
              </button>
            </div>
          </div>
          {comments.map((c, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}>
                 <img src={c.user?.avatar ? MEDIA_URL(c.user.avatar) : ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ background: '#eee', padding: '0.5rem 0.75rem', borderRadius: '8px', flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>{c.user?.name}</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <CustomDialog {...dialogConfig} />

      {/* Reactions Modal */}
      {showLikers && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowLikers(false)}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '8px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Reactions</h3>
              <button onClick={() => setShowLikers(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 0', color: '#057642', borderBottom: '2px solid #057642', fontWeight: 600, fontSize: '0.9rem' }}>
                All {likes.length}
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem 0' }}>
              {likes.map((like, idx) => {
                const user = like.user;
                return (
                  <div key={idx} style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: idx < likes.length - 1 ? '1px solid #f3f6f8' : 'none' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden' }}>
                        {user?.avatar ? (
                          <img src={getAvatarUrl(user.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (user?.name ? user.name[0] : 'U')}
                      </div>
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#ef4444', borderRadius: '50%', padding: '2px', border: '2px solid white' }}>
                        <Heart size={10} color="white" fill="white" />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{user?.name || 'User'}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', lineHeight: '1.2' }}>{user?.bio || user?.role || 'Member'}</p>
                    </div>
                    {user?._id !== currentUser._id && (
                      <button 
                        onClick={async () => {
                          const isConnected = currentUser.connections?.some(id => (id._id || id) === user?._id);
                          const isFollowing = currentUser.following?.some(id => (id._id || id) === user?._id);
                          const isPending = pendingRequests.includes(user?._id);

                          if (isConnected || isFollowing || isPending) return;
                          
                          try {
                            await userAPI.connectUser(user?._id);
                            setPendingRequests(prev => [...prev, user?._id]);
                            alert('Connection request sent!');
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{ 
                          padding: '0.4rem 1rem', 
                          borderRadius: '20px', 
                          border: '1px solid #0a66c2', 
                          color: (currentUser.connections?.some(id => (id._id || id) === user?._id) || currentUser.following?.some(id => (id._id || id) === user?._id) || pendingRequests.includes(user?._id)) ? 'white' : '#0a66c2', 
                          background: (currentUser.connections?.some(id => (id._id || id) === user?._id) || currentUser.following?.some(id => (id._id || id) === user?._id) || pendingRequests.includes(user?._id)) ? '#0a66c2' : 'white', 
                          fontWeight: 600, 
                          fontSize: '0.85rem', 
                          cursor: 'pointer',
                          opacity: pendingRequests.includes(user?._id) ? 0.7 : 1
                        }}
                      >
                        {currentUser.connections?.some(id => (id._id || id) === user?._id) ? 'Connected' : 
                         currentUser.following?.some(id => (id._id || id) === user?._id) ? 'Following' : 
                         pendingRequests.includes(user?._id) ? 'Pending' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const ActionButton = ({ icon, label, onClick, active, activeColor = '#0a66c2' }) => (
  <button 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', 
      padding: '0.75rem 0.5rem', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s',
      color: active ? activeColor : '#666', fontWeight: 600, fontSize: '0.9rem'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f6f8'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default PostCard;
