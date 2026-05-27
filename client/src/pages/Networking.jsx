import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { UserPlus, MessageSquare, Globe, Search, Filter, ShieldCheck, Star, Users, UserCheck, Clock } from 'lucide-react';
import { userAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';
import CustomDialog from '../components/CustomDialog';

const Networking = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Suggestions');
  const [suggestedUsers, setSuggestedUsers] = useState({ suggested: [], all: [] });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  
  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

  const fetchNetworkData = async () => {
    try {
      const [sugRes, profRes] = await Promise.all([
        userAPI.getSuggestedUsers(),
        userAPI.getProfile()
      ]);
      setSuggestedUsers(sugRes.data);
      setProfile(profRes.data);
    } catch (error) {
      console.error('Failed to fetch networking data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const handleFollow = async (id) => {
    try {
      await userAPI.followUser(id);
      fetchNetworkData(); // Refresh
    } catch (err) {
      alert('Follow failed');
    }
  };

  const handleConnect = async (id) => {
    try {
      await userAPI.connectUser(id);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Connection request sent!', position: 'top', onConfirm: closeDialog });
      fetchNetworkData();
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: err.response?.data?.message || 'Connection failed', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleRequest = async (requestId, status) => {
    console.log(`FRONTEND DEBUG: Handling request [${requestId}] with status [${status}]`);
    try {
      await userAPI.handleConnectionRequest(requestId, status);
      setDialogConfig({ 
        isOpen: true, 
        type: 'alert', 
        title: 'Success', 
        message: status === 'accepted' ? 'Connection accepted successfully!' : 'Connection request ignored.', 
        position: 'top',
        onConfirm: () => {
          closeDialog();
          fetchNetworkData();
        } 
      });
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Action failed', onConfirm: closeDialog });
    }
  };

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Finding professionals...</div>;

  const renderUserCard = (user, type = 'suggestion') => {
    const isFollowing = profile?.following?.some(f => f._id === user._id);
    const isConnected = profile?.connections?.some(c => c._id === user._id);
    const hasSentRequest = profile?.connectionRequests?.some(r => r.user?._id === user._id);

    return (
      <div key={user._id} className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div 
          onClick={() => navigate(`/profile/${user._id}`)}
          style={{ position: 'relative', marginBottom: '1rem', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', 
            background: 'linear-gradient(135deg, var(--primary-light), #cbd5e1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)'
          }}>
            {user.avatar ? (
              <img 
                src={user.avatar.startsWith('http') ? user.avatar : `http://${SERVER_IP}:5000/${user.avatar.startsWith('uploads') ? '' : 'uploads/'}${user.avatar.replace(/\\/g, '/')}`} 
                style={{width: '100%', height: '100%', borderRadius: '24px', objectFit: 'cover'}} 
              />
            ) : user.name[0]}
          </div>
          {user.role === 'coordinator' && (
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--primary-color)', color: 'white', padding: '3px', borderRadius: '50%', border: '2px solid white' }}>
              <ShieldCheck size={14} />
            </div>
          )}
        </div>

        <h4 
          onClick={() => navigate(`/profile/${user._id}`)}
          style={{ margin: 0, fontWeight: 800, cursor: 'pointer' }}
        >
          {user.name}
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{user.role === 'coordinator' ? 'Event Coordinator' : 'Member'}</p>
        
        {user.role !== 'coordinator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <button 
              onClick={() => handleFollow(user._id)}
              className="btn-premium" 
              style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: isFollowing ? 'var(--primary-color)' : 'white', color: isFollowing ? 'white' : 'inherit', border: isFollowing ? 'none' : '1px solid var(--border-color)' }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            
            {!isConnected && !hasSentRequest && (
              <button 
                onClick={() => handleConnect(user._id)}
                className="btn-premium btn-premium-primary" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Connect
              </button>
            )}
            {hasSentRequest && (
              <button className="btn-premium" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#f1f5f9', border: 'none', color: '#64748b' }} disabled>
                Requested
              </button>
            )}
            {isConnected && (
              <button className="btn-premium" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: '#ecfdf5', border: 'none', color: '#059669' }} disabled>
                Connected
              </button>
            )}
          </div>
          
          {isConnected && (
            <button 
              onClick={() => navigate(`/messages?user=${user._id}`)}
              className="btn-premium" 
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', background: 'white' }}
            >
              <MessageSquare size={14} /> Message
            </button>
          )}
        </div>
      )}
    </div>
    );
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontWeight: 900, fontSize: '2.2rem', marginBottom: '0.5rem' }}>Network Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Expand your professional circle and stay updated with your connections.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {['Suggestions', 'My Network', 'Requests'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                background: 'none', border: 'none', padding: '0.5rem 1.5rem', 
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : 'none'
              }}
            >
              {tab} {tab === 'Requests' && profile?.connectionRequests?.length > 0 && `(${profile.connectionRequests.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'Suggestions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {suggestedUsers.suggested?.length > 0 && (
              <section>
                <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)', fontWeight: 800 }}>
                  <Star size={20} fill="var(--primary-color)" /> Suggested for You
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {suggestedUsers.suggested.map(u => renderUserCard(u))}
                </div>
              </section>
            )}

            <section>
              <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800 }}>
                <Globe size={20} /> All Profiles
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {suggestedUsers.all?.length > 0 ? suggestedUsers.all.map(u => renderUserCard(u)) : <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'My Network' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={20} /> Connections ({profile?.connections?.length || 0})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {profile?.connections?.length > 0 ? [...profile.connections].reverse().map(u => renderUserCard(u, 'connection')) : <p style={{ color: 'var(--text-secondary)' }}>No connections yet.</p>}
              </div>
            </section>
            <section>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Following ({profile?.following?.length || 0})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {profile?.following?.length > 0 ? [...profile.following].reverse().map(u => renderUserCard(u, 'following')) : <p style={{ color: 'var(--text-secondary)' }}>Not following anyone yet.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profile?.connectionRequests?.length > 0 ? [...profile.connectionRequests].reverse().map(req => (
              <div key={req._id} className="premium-card" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-color)', overflow: 'hidden' }}>
                    {req.user?.avatar ? (
                      <img 
                        src={req.user.avatar.startsWith('http') ? req.user.avatar : `http://${SERVER_IP}:5000/${req.user.avatar.startsWith('uploads') ? '' : 'uploads/'}${req.user.avatar.replace(/\\/g, '/')}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : req.user?.name[0]}
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{req.user?.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wants to connect with you</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleRequest(req._id, 'accepted')} className="btn-premium btn-premium-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Accept</button>
                  <button onClick={() => handleRequest(req._id, 'rejected')} className="btn-premium" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'white', border: '1px solid var(--border-color)' }}>Ignore</button>
                </div>
              </div>
            )) : <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No pending connection requests.</p>
              </div>}
          </div>
        )}
      </div>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

export default Networking;
