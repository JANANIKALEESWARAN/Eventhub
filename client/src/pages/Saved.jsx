import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { postAPI } from '../api/api';
import { ArrowLeft, Grid, Bookmark, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Saved = () => {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // 'grid' or 'list'

  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await postAPI.getSavedPosts();
        setSavedPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch saved posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/');
    return `http://${SERVER_IP}:5000/uploads/${cleanPath}`;
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', paddingBottom: '50px', maxWidth: '935px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ margin: 0, fontWeight: 800 }}>Saved</h2>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setView('grid')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: view === 'grid' ? 'var(--primary-color)' : '#cbd5e1' }}>
              <Grid size={20} />
            </button>
            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: view === 'list' ? 'var(--primary-color)' : '#cbd5e1' }}>
              <Layout size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ margin: '0 auto' }}></div>
          </div>
        ) : savedPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Bookmark size={40} color="#cbd5e1" />
            </div>
            <h3 style={{ fontWeight: 800 }}>Save Photos and Videos</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0.5rem auto' }}>When you save photos and videos, they'll appear here. Only you can see what you've saved.</p>
          </div>
        ) : (
          <div style={{ 
            display: view === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: 'repeat(3, 1fr)',
            flexDirection: 'column',
            gap: view === 'grid' ? '1.5rem' : '2rem',
            padding: '0 1rem'
          }}>
            {savedPosts.map(post => (
              <div 
                key={post._id} 
                onClick={() => navigate(`/profile/${post.author?._id}`)}
                style={{ 
                  aspectRatio: view === 'grid' ? '1/1' : 'auto',
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-soft)',
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                {post.media && post.media.length > 0 ? (
                  <img src={getMediaUrl(post.media[0])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="saved content" />
                ) : (
                  <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {post.content}
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f1f5f9' }}>
                        {post.author?.avatar && <img src={getMediaUrl(post.author.avatar)} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{post.author?.name}</span>
                    </div>
                  </div>
                )}
                {view === 'grid' && post.media && post.media.length > 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <Bookmark fill="white" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Saved;
