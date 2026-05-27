import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Palette, Share2, Upload, Target, CheckCircle, ArrowLeft } from 'lucide-react';
import { postAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await postAPI.createPost({ content, type: 'text' });
      alert('Post published successfully!');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ fontWeight: 800, margin: 0 }}>Create Post</h1>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="btn-premium btn-premium-primary" style={{ padding: '0.6rem 2rem' }}>
            {loading ? 'Posting...' : 'Post Now'}
          </button>
        </div>

        <div className="premium-card" style={{ padding: '2rem' }}>
          {/* User Info */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {user.name?.[0] || 'U'}
            </div>
            <div>
              <h4 style={{ margin: 0 }}>{user.name || 'User'}</h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <select style={{ border: 'none', fontSize: '0.8rem', color: 'var(--text-secondary)', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  <option>Public</option>
                  <option>Connections Only</option>
                  <option>Coordinators</option>
                </select>
              </div>
            </div>
          </div>

          <textarea 
            placeholder="Share your thoughts, articles, or event updates..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: '200px', border: 'none', outline: 'none', fontSize: '1.2rem', resize: 'none', fontFamily: 'inherit' }}
          ></textarea>

          {/* Media Preview Box */}
          <div style={{ width: '100%', height: '200px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: '#64748b', cursor: 'pointer', margin: '1rem 0' }}>
            <Upload size={32} />
            <span style={{ fontWeight: 600 }}>Drag and drop media or click to upload</span>
          </div>

          {/* Tagging */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <PostOption icon={<Palette size={20} color="#3b82f6" />} label="Template" />
              <PostOption icon={<Target size={20} color="#10b981" />} label="Tag Topic" />
              <PostOption icon={<CheckCircle size={20} color="#f59e0b" />} label="Add Skill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostOption = ({ icon, label }) => (
  <button style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
    {icon}
    <span>{label}</span>
  </button>
);

export default CreatePost;
