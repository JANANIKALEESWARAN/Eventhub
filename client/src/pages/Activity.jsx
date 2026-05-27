import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userAPI, postAPI } from '../api/api';
import { ArrowLeft, Heart, MessageCircle, UserCheck, CalendarDays, Smartphone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getIcon = (type) => {
  switch (type) {
    case 'like':    return <Heart size={18} color="#ef4444" fill="#ef4444" />;
    case 'comment': return <MessageCircle size={18} color="#10b981" />;
    case 'follow':  return <UserCheck size={18} color="#3b82f6" />;
    case 'connection': return <UserCheck size={18} color="#10b981" />;
    case 'event':   return <CalendarDays size={18} color="#6366f1" />;
    case 'post':    return <Smartphone size={18} color="#3b82f6" />;
    default:        return <Smartphone size={18} color="#94a3b8" />;
  }
};

const formatTimeAgo = (dateInput) => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
};

const Activity = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Activity mounted");
    const fetchData = async () => {
      try {
        const [postRes, interRes] = await Promise.all([
          postAPI.getUserPosts(),
          postAPI.getUserInteractions()
        ]);
        setPosts(postRes.data);
        setInteractions(interRes.data);
      } catch (err) {
        console.error('Failed to fetch activity data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build activities list — all dates come from real DB timestamps
  const activities = [
    // Your own posts (createdAt is always accurate)
    ...posts.map(post => ({
      id: `post-${post._id}`,
      type: 'post',
      text: `You shared a new ${post.type} post`,
      date: new Date(post.createdAt),
      link: '/profile'
    })),
    // All interactions from backend (likes, comments, follows, connections, events)
    // These all have accurate real-time timestamps
    ...interactions.map(inter => ({
      ...inter,
      date: new Date(inter.date)
    }))
  ];

  // Sort by newest
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', paddingBottom: '50px', maxWidth: '600px', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800, flex: 1 }}>Your activity</h2>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: 'var(--primary-color)', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ margin: '0 auto' }}></div>
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Smartphone size={40} color="#cbd5e1" />
            </div>
            <h3 style={{ fontWeight: 800 }}>No Activity Yet</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0.5rem auto' }}>Interact with the platform to see your activity here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            {activities.map((act) => (
              <div 
                key={act.id} 
                onClick={() => act.link && navigate(act.link)}
                className="activity-item"
                style={{ 
                  padding: '1.2rem 1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getIcon(act.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{act.text}</p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {formatTimeAgo(act.date)}
                  </span>
                </div>
                <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`
        .activity-item { transition: all 0.2s ease; }
        .activity-item:hover { background: #f8fafc; transform: translateX(4px); }
        .activity-item:active { background: #f1f5f9; transform: scale(0.98); }
      `}</style>
    </div>
  );
};

export default Activity;
