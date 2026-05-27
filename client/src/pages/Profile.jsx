import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Settings, Calendar, Award, Briefcase, Grid, CheckCircle, Play, BarChart3, FileText, UserPlus, MessageSquare, ShieldCheck, ArrowLeft, Camera } from 'lucide-react';
import { userAPI, postAPI } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import CustomDialog from '../components/CustomDialog';
import ImageEditorModal from '../components/ImageEditorModal';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ 
    name: '', bio: '', skills: '', location: '', education: '', phone: '',
    github: '', linkedin: '', twitter: '', website: ''
  });
  const avatarInputRef = React.useRef(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [isAvatarViewOpen, setIsAvatarViewOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

  const isOwnProfile = !id;
  const isCoordinator = currentUser?.role === 'coordinator';
  const canEdit = isOwnProfile && !isCoordinator;

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch both profiles if viewing someone else, or just one if own
      const [mainRes, meRes] = await Promise.all([
        isOwnProfile ? userAPI.getProfile() : userAPI.getUserById(id),
        userAPI.getProfile() // Always get current user to check connection status
      ]);

      const mainProfileData = mainRes.data;
      setCurrentUser(meRes.data);
      
      setProfile(mainProfileData);
      setEditData({
        name: mainProfileData.name,
        bio: mainProfileData.bio || '',
        skills: mainProfileData.skills?.join(', ') || '',
        location: mainProfileData.location || '',
        education: mainProfileData.education || '',
        phone: mainProfileData.phone || '',
        github: mainProfileData.socialLinks?.github || '',
        linkedin: mainProfileData.socialLinks?.linkedin || '',
        twitter: mainProfileData.socialLinks?.twitter || '',
        website: mainProfileData.socialLinks?.website || ''
      });
      
      try {
        const postsRes = await (isOwnProfile ? postAPI.getUserPosts() : postAPI.getUserPostsById(id));
        setProfile(prev => ({ ...prev, posts: postsRes.data }));
      } catch (postErr) {
        console.error('Failed to fetch posts:', postErr);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        name: editData.name,
        bio: editData.bio,
        location: editData.location,
        education: editData.education,
        phone: editData.phone,
        skills: editData.skills.split(',').map(s => s.trim()).filter(Boolean),
        socialLinks: {
          github: editData.github,
          linkedin: editData.linkedin,
          twitter: editData.twitter,
          website: editData.website
        }
      };
      const res = await userAPI.updateProfile(formattedData);
      const updatedUser = res.data;
      setProfile(prev => ({ ...prev, ...updatedUser }));
      
      // Update global user state if it's own profile
      if (isOwnProfile) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const newUser = { ...stored, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
        window.dispatchEvent(new Event('storage'));
      }
      
      setIsEditModalOpen(false);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Profile updated successfully!', position: 'top', onConfirm: closeDialog });
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Update Profile failed', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleFollow = async () => {
    try {
      await userAPI.followUser(id);
      fetchProfileData();
    } catch (err) { setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Follow failed', onConfirm: closeDialog }); }
  };

  const handleConnect = async () => {
    try {
      await userAPI.connectUser(id);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Connection request sent!', position: 'top', onConfirm: closeDialog });
      fetchProfileData();
    } catch (err) { setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: err.response?.data?.message || 'Connection failed', position: 'top', onConfirm: closeDialog }); }
  };
  
  const handleAvatarClick = () => {
    if (profile?.avatar) setIsAvatarViewOpen(true);
  };

  const handleEditAvatarClick = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedAvatarFile(file);
    // Reset input so selecting the same file again triggers onChange
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleAvatarSave = async (editedFile) => {
    setSelectedAvatarFile(null); // Close modal
    if (!editedFile) return;

    const formData = new FormData();
    formData.append('avatar', editedFile);

    try {
      setLoading(true);
      const res = await userAPI.updateAvatar(formData);
      const newAvatar = res.data.avatar;
      setProfile(prev => ({ ...prev, avatar: newAvatar }));
      
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.avatar = newAvatar;
      localStorage.setItem('user', JSON.stringify(stored));
      
      window.dispatchEvent(new Event('storage'));
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Profile photo updated!', position: 'top', onConfirm: closeDialog });
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to update photo', position: 'top', onConfirm: closeDialog });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--primary-color)', fontWeight: 600 }}>Loading Profile...</div>;
  if (!profile) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>User not found.</div>;

  const isFollowing = currentUser?.following?.some(f => f._id === profile._id);
  const isConnected = currentUser?.connections?.some(c => c._id === profile._id);
  const hasSentRequest = currentUser?.connectionRequests?.some(r => r.user?._id === profile._id);

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container home-grid">
        {/* Back Button */}
        <div style={{ marginBottom: '1rem', gridColumn: '1 / -1' }}>
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const returnTab = params.get('returnTab');
              if (returnTab) {
                navigate(`/coordinator?tab=${returnTab}`);
              } else {
                navigate(-1);
              }
            }}
            style={{
              background: 'white', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem', padding: '0.5rem 1rem',
              borderRadius: '10px', transition: 'var(--transition)',
              boxShadow: 'var(--shadow-soft)'
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="premium-card profile-header-card" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', gap: '3rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div 
              onClick={handleAvatarClick}
              style={{ 
                width: '150px', height: '150px', borderRadius: '50%', 
                background: 'linear-gradient(45deg, #f0f4f8, #cbd5e1)', 
                border: '5px solid white', boxShadow: 'var(--shadow-soft)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)',
                cursor: profile.avatar ? 'pointer' : 'default',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {profile.avatar ? (
                <img 
                  src={profile.avatar.startsWith('http') ? profile.avatar : `http://${SERVER_IP}:5000/${profile.avatar.startsWith('uploads') ? '' : 'uploads/'}${profile.avatar.replace(/\\/g, '/')}`} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                />
              ) : profile.name?.[0]}
            </div>
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            
            {profile.role === 'coordinator' && (
              <div title="Verified Organizer" style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary-color)', color: 'white', padding: '0.4rem', borderRadius: '50%', border: '3px solid white' }}>
                <CheckCircle size={20} />
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }} className="profile-info-content">
            <div className="profile-name-row" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h1 style={{ margin: 0, fontWeight: 800 }}>{profile.name}</h1>
              
              {isOwnProfile ? (
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button 
                    onClick={() => canEdit && setIsEditModalOpen(true)}
                    className="btn-premium" 
                    style={{ background: '#f1f5f9', padding: '0.5rem 1.2rem', fontSize: '0.85rem', cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.5 }}
                    disabled={!canEdit}
                  >
                    {canEdit ? 'Edit Profile' : 'View Only'}
                  </button>
                  {isOwnProfile && (
                    <button 
                      onClick={() => navigate('/settings')}
                      className="btn-premium" 
                      style={{ background: '#f1f5f9', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Settings size={20} />
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  {profile.role !== 'coordinator' ? (
                    <>
                      <button 
                        onClick={handleFollow}
                        className="btn-premium" 
                        style={{ 
                          padding: '0.5rem 1.2rem', fontSize: '0.85rem',
                          background: isFollowing ? 'var(--primary-color)' : 'white',
                          color: isFollowing ? 'white' : 'inherit',
                          border: isFollowing ? 'none' : '1px solid var(--border-color)'
                        }}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>

                      {!isConnected && !hasSentRequest && (
                        <button 
                          onClick={handleConnect}
                          className="btn-premium btn-premium-primary" 
                          style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
                        >
                          Connect
                        </button>
                      )}
                      {hasSentRequest && (
                        <button className="btn-premium" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', background: '#f1f5f9', border: 'none', color: '#64748b' }} disabled>
                          Requested
                        </button>
                      )}
                      {isConnected && (
                        <button 
                          onClick={() => navigate(`/messages?user=${profile._id}`)}
                          className="btn-premium" 
                          style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }}
                        >
                          <MessageSquare size={16} /> Message
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '8px', fontWeight: 700 }}>
                      Official Coordinator
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{profile.role === 'coordinator' ? 'Event Coordinator' : 'Community Member'}</p>
            {profile.bio && <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', maxWidth: '600px', lineHeight: 1.6 }}>{profile.bio}</p>}
            
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }} className="profile-stats-row">
              <Stat label="Posts" value={profile.posts?.length || 0} />
              <Stat label="Events Joined" value={profile.joinedEvents?.length || 0} />
              <Stat label="Reputation" value={profile.reputation || '0'} />
              {profile.role === 'coordinator' && <Stat label="Created Events" value={profile.createdEvents?.length || 0} color="var(--primary-color)" />}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div className="premium-card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', animation: 'slideUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 800, margin: 0 }}>Edit Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
              </div>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div 
                    onClick={handleEditAvatarClick}
                    style={{ 
                      width: '100px', height: '100px', borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #f0f4f8, #cbd5e1)', 
                      border: '3px solid white', boxShadow: 'var(--shadow-soft)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar.startsWith('http') ? profile.avatar : `http://${SERVER_IP}:5000/${profile.avatar.startsWith('uploads') ? '' : 'uploads/'}${profile.avatar.replace(/\\/g, '/')}`} 
                        style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                      />
                    ) : profile.name?.[0]}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' }} className="avatar-hover">
                      <Camera color="white" size={24} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Full Name</label>
                    <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Location</label>
                    <input value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="e.g. New York, USA" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} placeholder="Tell us about yourself..." style={{ width: '100%', height: '80px', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Education</label>
                    <input value={editData.education} onChange={e => setEditData({...editData, education: e.target.value})} placeholder="e.g. MIT, Computer Science" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Phone</label>
                    <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="+1 234 567 890" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Skills (comma separated)</label>
                  <input value={editData.skills} onChange={e => setEditData({...editData, skills: e.target.value})} placeholder="React, Design, Marketing..." style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} />
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Social Links</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input value={editData.github} onChange={e => setEditData({...editData, github: e.target.value})} placeholder="Github URL" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
                    <input value={editData.linkedin} onChange={e => setEditData({...editData, linkedin: e.target.value})} placeholder="LinkedIn URL" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
                    <input value={editData.twitter} onChange={e => setEditData({...editData, twitter: e.target.value})} placeholder="Twitter URL" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
                    <input value={editData.website} onChange={e => setEditData({...editData, website: e.target.value})} placeholder="Portfolio Website" style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <button type="submit" className="btn-premium btn-premium-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', padding: '0.8rem' }}>
                  Save Profile
                </button>
              </form>
            </div>
          </div>
        )}

        <main>
          <div className="premium-card">
            <div className="profile-tabs-scroll" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <Tab label="Posts" active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
              <Tab label="Events" active={activeTab === 'past-events'} onClick={() => setActiveTab('past-events')} />
              <Tab label="Profile" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} />
            </div>
            <div style={{ padding: '2rem' }} className="profile-tab-content">
              {activeTab === 'posts' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {profile.posts && profile.posts.length > 0 ? (
                    profile.posts.map((post, idx) => {
                      const mediaPath = post.media && post.media[0];
                      const SERVER_IP_P = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname;
                      const cleanPath = mediaPath?.replace(/^uploads\//, '').replace(/^uploads\\/, '');
                      const src = mediaPath ? `http://${SERVER_IP_P}:5000/uploads/${cleanPath}` : null;
                      
                      return (
                        <GridImage 
                          key={post._id} 
                          src={src} 
                          type={post.type}
                          content={post.content}
                        />
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <Grid size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                      <p>No posts yet. Share something with your community!</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'portfolio' && (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                  <div className="premium-card profile-info-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--primary-color)', opacity: 0.03, borderRadius: '0 0 0 100%' }} />
                    
                    <div className="portfolio-content-flex" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{profile.name}</h2>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📍 {profile.location}</span>}
                            {profile.education && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🎓 {profile.education}</span>}
                          </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1rem', color: 'var(--primary-color)', marginBottom: '0.6rem' }}>About Me</h4>
                          <p style={{ lineHeight: 1.6, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{profile.bio || "No bio added yet."}</p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1rem', color: 'var(--primary-color)', marginBottom: '0.6rem' }}>Skills & Expertise</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {profile.skills?.length > 0 ? profile.skills.map(skill => (
                              <span key={skill} style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{skill}</span>
                            )) : <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No skills added yet.</p>}
                          </div>
                        </div>
                      </div>

                      <div className="portfolio-sidebar" style={{ width: '220px', paddingLeft: '2rem', borderLeft: '1px solid var(--border-color)' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1rem', color: 'var(--primary-color)', marginBottom: '0.8rem' }}>Contact Info</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                              <span style={{ fontSize: '1rem' }}>📧</span> {profile.email}
                            </div>
                            {profile.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                                <span style={{ fontSize: '1rem' }}>📞</span> {profile.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.1rem', color: 'var(--primary-color)', marginBottom: '0.8rem' }}>Social Presence</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {profile.socialLinks?.github && <SocialLink icon="🐙" label="GitHub" url={profile.socialLinks.github} />}
                            {profile.socialLinks?.linkedin && <SocialLink icon="💼" label="LinkedIn" url={profile.socialLinks.linkedin} />}
                            {profile.socialLinks?.twitter && <SocialLink icon="🐦" label="Twitter" url={profile.socialLinks.twitter} />}
                            {profile.socialLinks?.website && <SocialLink icon="🌐" label="Website" url={profile.socialLinks.website} />}
                            {!profile.socialLinks?.github && !profile.socialLinks?.linkedin && !profile.socialLinks?.twitter && !profile.socialLinks?.website && (
                              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No links added.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'past-events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {profile.joinedEvents && profile.joinedEvents.length > 0 ? (
                    profile.joinedEvents.map(event => (
                      <div key={event._id} className="premium-card" style={{ padding: '1.2rem', border: '1px solid var(--border-color)', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800 }}>{event.title}</h4>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            {new Date(event.date).toLocaleDateString()} • {event.location}
                          </p>
                        </div>
                        <div style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {event.status?.toUpperCase() || 'ENROLLED'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                      <p>No joined events found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside>
          <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>Skills & Endorsements</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['React', 'Node.js', 'Express', 'MongoDB', 'UI/UX Design', 'Event Planning'].map(skill => (
                <span key={skill} style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{skill}</span>
              ))}
            </div>
          </div>

          <div className="premium-card" style={{ padding: '1.5rem', background: '#f8fafc', border: '1px dashed var(--border-color)' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--primary-color)" /> Reputation Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <ReputationItem label="Event Participation" value="95%" />
              <ReputationItem label="Community Help" value="88%" />
              <ReputationItem label="Content Quality" value="92%" />
            </div>
          </div>
        </aside>
      </div>
      <CustomDialog {...dialogConfig} />
      {isAvatarViewOpen && profile?.avatar && (
        <div 
          onClick={() => setIsAvatarViewOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'pointer' }}
        >
          <img 
            src={profile.avatar.startsWith('http') ? profile.avatar : `http://${SERVER_IP}:5000/${profile.avatar.startsWith('uploads') ? '' : 'uploads/'}${profile.avatar.replace(/\\/g, '/')}`} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            onClick={() => setIsAvatarViewOpen(false)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
      )}
      {selectedAvatarFile && (
        <ImageEditorModal
          file={selectedAvatarFile}
          onClose={() => setSelectedAvatarFile(null)}
          onSave={handleAvatarSave}
        />
      )}
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
  </div>
);

const formatUrl = (url) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const SocialLink = ({ icon, label, url }) => (
  <a href={formatUrl(url)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: 'none', transition: 'var(--transition)' }} className="social-link-item">
    <span style={{ fontSize: '1.2rem' }}>{icon}</span> {label}
  </a>
);

const Tab = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    style={{ 
      flex: 1, 
      padding: '1.2rem', 
      background: 'none', 
      border: 'none', 
      borderBottom: active ? '3px solid var(--primary-color)' : '3px solid transparent',
      color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
      fontWeight: active ? 800 : 600,
      cursor: 'pointer',
      transition: 'all 0.3s'
    }}
  >
    {label}
  </button>
);

const ReputationItem = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{value}</span>
  </div>
);

const PastEventCard = ({ title, participants, rating }) => (
  <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
    <h4 style={{ margin: 0 }}>{title}</h4>
    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
      <span>👥 {participants} participants</span>
      <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>★ {rating}</span>
    </div>
  </div>
);

const ExperienceItem = ({ title, company, period }) => (
  <div style={{ display: 'flex', gap: '1rem' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Briefcase size={24} color="var(--primary-color)" />
    </div>
    <div>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{company} • {period}</p>
    </div>
  </div>
);

const GridImage = ({ src, type, content }) => (
  <div style={{ 
    aspectRatio: '1/1', 
    borderRadius: '8px', 
    overflow: 'hidden', 
    cursor: 'pointer',
    position: 'relative',
    background: '#f8fafc',
    border: '1px solid #f1f5f9'
  }}>
    {src ? (
      <>
        {type === 'video' || src.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '2px' }}>
              <Play size={12} color="white" fill="white" />
            </div>
          </div>
        ) : (
          <img src={src} alt="grid post" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
        )}
      </>
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.8rem', textAlign: 'center' }}>
        {type === 'poll' && <BarChart3 size={20} color="var(--primary-color)" style={{ marginBottom: '0.4rem' }} />}
        {type === 'article' && <FileText size={20} color="#10b981" style={{ marginBottom: '0.4rem' }} />}
        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#64748b', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {content}
        </p>
      </div>
    )}
  </div>
);

const styles = `
  @media (max-width: 768px) {
    .portfolio-content-flex { flex-direction: column !important; gap: 1.5rem !important; }
    .portfolio-sidebar { width: 100% !important; padding-left: 0 !important; border-left: none !important; border-top: 1px solid var(--border-color) !important; padding-top: 1.5rem !important; }
    .avatar-hover { opacity: 1 !important; background: rgba(0,0,0,0.2) !important; }
    .profile-info-card { padding: 1.5rem !important; }
  }
  .avatar-hover:hover { opacity: 1 !important; }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}

export default Profile;
