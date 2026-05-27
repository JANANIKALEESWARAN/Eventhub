import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { 
  Settings as SettingsIcon, ChevronRight, User, Lock, Bell, Eye, 
  HelpCircle, Info, LogOut, Shield, Search, ArrowLeft,
  Smartphone, Share2, Ban, History, Bookmark, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api/api';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAPI.getProfile();
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/welcome';
  };

  const togglePrivacy = async () => {
    try {
      const newStatus = !profile.isPrivate;
      const res = await userAPI.updateProfile({ isPrivate: newStatus });
      setProfile(prev => ({ ...prev, isPrivate: newStatus }));
      // Update local storage user if needed
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.isPrivate = newStatus;
      localStorage.setItem('user', JSON.stringify(storedUser));
    } catch (err) {
      console.error("Failed to update privacy", err);
    }
  };

  const settingsGroups = [
    {
      title: "Your account",
      meta: "Meta",
      items: [
        { id: 'account', icon: <User size={20} />, label: "Accounts Center", sub: "Password, security, personal details, ad preferences", color: "#3b82f6", action: () => navigate('/profile') },
      ]
    },
    {
      title: "How you use EventHub",
      items: [
        { id: 'saved', icon: <Bookmark size={20} />, label: "Saved", action: () => navigate('/saved') },
        { id: 'archive', icon: <History size={20} />, label: "Archive", action: () => navigate('/archive') },
        { id: 'activity', icon: <Smartphone size={20} />, label: "Your activity", action: () => navigate('/activity') },
        { id: 'notifications', icon: <Bell size={20} />, label: "Notifications", action: () => navigate('/notifications') },
        { id: 'time', icon: <History size={20} />, label: "Time management", action: () => navigate('/time-management') },
      ]
    },
    {
      title: "Who can see your content",
      items: [
        { 
          id: 'privacy', 
          icon: <Lock size={20} />, 
          label: "Account privacy", 
          value: profile?.isPrivate ? "Private" : "Public",
          action: togglePrivacy 
        },
        { id: 'close-friends', icon: <Share2 size={20} />, label: "Close Friends", value: profile?.closeFriends?.length || "0", action: () => setViewModal('closeFriends') },
        { id: 'blocked', icon: <Ban size={20} />, label: "Blocked", value: profile?.blockedUsers?.length || "0", action: () => setViewModal('blockedUsers') },
      ]
    },
    {
      title: "More info and support",
      items: [
        { id: 'help', icon: <HelpCircle size={20} />, label: "Help", action: () => navigate('/help') },
        { id: 'status', icon: <Shield size={20} />, label: "Account Status", action: () => navigate('/account-status') },
        { id: 'about', icon: <Info size={20} />, label: "About", action: () => navigate('/about') },
      ]
    },
    {
      title: "Login",
      items: [
        { id: 'add-account', label: "Add account", action: () => navigate('/auth/user'), color: "#3b82f6" },
        { id: 'logout', label: "Log out", action: handleLogout, color: "#ef4444" },
      ]
    }
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
      <div className="loader"></div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="settings-page-wrapper" style={{ paddingTop: '90px', paddingBottom: '50px' }}>
        <div className="settings-container" style={{ maxWidth: '600px', margin: '0 auto', background: 'white', minHeight: 'calc(100vh - 140px)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
          
          {/* Settings Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem' }}>Settings and activity</h2>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '1rem 1.5rem' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Search size={18} color="#64748b" />
              <input type="text" placeholder="Search" style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }} />
            </div>
          </div>

          {/* Settings List */}
          <div className="settings-list">
            {settingsGroups.map((group, gIdx) => (
              <div key={gIdx} style={{ marginBottom: '1rem' }}>
                <div style={{ padding: '1rem 1.5rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{group.title}</span>
                  {group.meta && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3b82f6' }}>{group.meta}</span>}
                </div>
                
                {group.items.map((item, iIdx) => (
                  <div 
                    key={item.id} 
                    onClick={item.action || (() => {})}
                    className="settings-item"
                    style={{ 
                      padding: '1rem 1.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {item.icon && <span style={{ color: 'var(--text-primary)' }}>{item.icon}</span>}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: item.color || 'var(--text-primary)' }}>{item.label}</span>
                        {item.sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{item.sub}</span>}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.value && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.value}</span>}
                      {!item.action && <ChevronRight size={18} color="#cbd5e1" />}
                    </div>
                  </div>
                ))}
                {gIdx < settingsGroups.length - 1 && <div style={{ height: '8px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />}
              </div>
            ))}
          </div>

        </div>
      </div>

      {viewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', animation: 'slideUp 0.3s ease', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
                {viewModal === 'blockedUsers' ? 'Blocked Users' : 'Close Friends'}
              </h2>
              <button onClick={() => setViewModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!profile?.[viewModal]?.length ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</p>
              ) : (
                profile?.[viewModal]?.map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${u._id}`)}>
                      {u.avatar ? (
                        <img src={`http://${window.location.hostname}:5000/${u.avatar.startsWith('uploads') ? '' : 'uploads/'}${u.avatar.replace(/\\/g, '/')}`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {u.name[0]}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                    <button 
                      onClick={async () => {
                        if (viewModal === 'blockedUsers') {
                          await userAPI.toggleBlockUser(u._id);
                          setProfile(prev => ({ ...prev, blockedUsers: prev.blockedUsers.filter(user => user._id !== u._id) }));
                        } else {
                          await userAPI.toggleCloseFriend(u._id);
                          setProfile(prev => ({ ...prev, closeFriends: prev.closeFriends.filter(user => user._id !== u._id) }));
                        }
                      }}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: '#e2e8f0', color: '#1e293b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .settings-item:hover { background: #f8fafc; }
        .settings-item:active { background: #f1f5f9; }
        @media (max-width: 640px) {
          .settings-container { border-radius: 0; margin: 0; min-height: 100vh; }
          .settings-page-wrapper { padding-top: 70px; }
        }
      `}</style>
    </div>
  );
};

export default Settings;
