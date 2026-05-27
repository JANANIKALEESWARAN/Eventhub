import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ role }) => {
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        return JSON.parse(stored);
      }
      return { role: 'guest' };
    } catch (e) { return { role: 'guest' }; }
  });
  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;
  const bannerUrl = "/C:/Users/JANANI.K/.gemini/antigravity/brain/9b1ba3fd-a796-479f-aa66-9f636976434c/event_hero_banner_1777282546351.png";

  React.useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('user');
      if (stored && stored !== 'undefined' && stored !== 'null') {
        setCurrentUser(JSON.parse(stored));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <aside className="sidebar-hidden" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
      <div className="premium-card" style={{ padding: 0 }}>
        <div style={{ 
          height: '100px', 
          background: `url(${bannerUrl}) center/cover no-repeat`,
          borderBottom: '1px solid var(--border-color)'
        }}></div>
        <div style={{ padding: '0 1.5rem 1.5rem', textAlign: 'center', marginTop: '-45px' }}>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              background: 'white', 
              margin: '0 auto 1.2rem', 
              padding: '4px',
              boxShadow: 'var(--shadow-soft)'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, #f0f4f8, #cbd5e1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: 'var(--primary-color)',
                fontSize: '1.5rem',
                border: '2px solid white',
                overflow: 'hidden'
              }}>
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar.startsWith('http') ? currentUser.avatar : `http://${SERVER_IP}:5000/${currentUser.avatar.startsWith('uploads') ? '' : 'uploads/'}${currentUser.avatar.replace(/\\/g, '/')}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : getInitials(currentUser.name)}
              </div>
            </div>
          </Link>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{currentUser.name || 'User Name'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.3rem' }}>{currentUser.role === 'admin' ? 'System Administrator' : (currentUser.role === 'coordinator' ? 'Event Coordinator' : 'Member')}</p>
          
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem', textAlign: 'left' }}>
            <div className="stat-row">
              <span className="stat-label">Profile visitors</span>
              <span className="stat-value">1,420</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Impression of posts</span>
              <span className="stat-value">8.4k</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.6rem;
          font-size: 0.85rem;
        }
        .stat-label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        .stat-value {
          color: var(--primary-color);
          font-weight: 700;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
