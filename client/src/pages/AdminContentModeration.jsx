import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Flag, Trash2, ShieldCheck, UserX, MoreHorizontal } from 'lucide-react';
import { postAPI, reportAPI, userAPI } from '../api/api';

const AdminContentModeration = () => {
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, reportsRes] = await Promise.all([
          postAPI.getPosts(),
          reportAPI.getReports()
        ]);
        setPosts(postsRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error('Failed to fetch content moderation data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleKeepPost = async (postId) => {
    try {
      const postReports = reports.filter(r => r.targetId === postId && r.status === 'pending');
      await Promise.all(postReports.map(r => reportAPI.updateReportStatus(r._id, 'dismissed')));
      alert('Post reports dismissed');
      const reportsRes = await reportAPI.getReports();
      setReports(reportsRes.data);
    } catch (error) {
      alert('Failed to dismiss reports');
    }
  };

  const handleRemoveContent = async (postId) => {
    if (window.confirm('Are you sure you want to remove this post?')) {
      try {
        await postAPI.deleteModeratedPost(postId);
        alert('Post removed successfully');
        const postsRes = await postAPI.getPosts();
        setPosts(postsRes.data);
      } catch (error) {
        alert('Failed to remove post');
      }
    }
  };

  const handleBanUser = async (userId) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      try {
        await userAPI.deleteUser(userId);
        alert('User suspended successfully');
        const postsRes = await postAPI.getPosts();
        setPosts(postsRes.data);
      } catch (error) {
        alert('Failed to suspend user');
      }
    }
  };

  if (loading) return <AdminLayout><div style={{ padding: '2rem', textAlign: 'center' }}>Loading content for moderation...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="container" style={{ padding: 0 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 800 }}>Content Moderation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review all posts across the platform.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No posts found in the database.</div>
          ) : (
            posts.map(post => (
              <FlaggedPost 
                key={post._id}
                author={post.author?.name || 'Unknown'} 
                content={post.content} 
                flags={reports.filter(r => r.targetId === post._id).length} 
                type={post.type || 'Post'}
                onKeep={() => handleKeepPost(post._id)}
                onRemove={() => handleRemoveContent(post._id)}
                onBan={() => handleBanUser(post.author?._id)}
              />
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const FlaggedPost = ({ author, content, flags, type, onKeep, onRemove, onBan }) => (
  <div className="premium-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9' }}></div>
        <div>
          <h5 style={{ margin: 0 }}>{author}</h5>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Flagged as {type}</span>
        </div>
      </div>
      <div className="badge" style={{ background: '#fee2e2', color: '#ef4444' }}>{flags} Reports</div>
    </div>
    
    <div className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.2rem' }}>
      <p style={{ margin: 0, fontSize: '0.95rem' }}>{content}</p>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={onKeep} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} /> Keep Post
        </button>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={18} /> Remove Content
        </button>
      </div>
      <button onClick={onBan} style={{ background: 'none', border: 'none', color: '#991b1b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserX size={18} /> Ban User
      </button>
    </div>
  </div>
);

export default AdminContentModeration;
