import React, { useState, useEffect } from 'react';
import { Home, Calendar, Users, Briefcase, Bell, MessageSquare, Search, LogOut, LayoutDashboard, Shield, Compass, Play, MoreVertical } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { userAPI, chatAPI } from '../api/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [networkBadge, setNetworkBadge] = useState(0);
  const [notifBadge, setNotifBadge] = useState(0);
  const [messageBadge, setMessageBadge] = useState(0);

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        return JSON.parse(storedUser);
      }
      return { role: 'guest' };
    } catch (e) {
      return { role: 'guest' };
    }
  });

  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

  useEffect(() => {
    console.log("Navbar mounted");
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        setUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Initial profile sync to ensure localStorage is up to date
    const syncProfile = async () => {
      try {
        if (user && user.role !== 'guest') {
          const res = await userAPI.getProfile();
          const freshData = res.data;
          // Maintain compatibility by not overwriting token if it's there
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const updated = { ...stored, ...freshData };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        }
      } catch (err) {
        console.error("Failed to sync profile", err);
      }
    };
    
    syncProfile();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Networking count
        if (location.pathname === '/networking') {
          setNetworkBadge(0);
        } else {
          const netRes = await userAPI.getNetworkingNotificationsCount();
          setNetworkBadge(netRes.data.count);
        }

        // General notifications count
        if (location.pathname === '/notifications') {
          setNotifBadge(0);
        } else {
          const notifRes = await userAPI.getNotifications();
          const unreadCount = notifRes.data.filter(n => !n.isRead).length;
          setNotifBadge(unreadCount);
        }

        // Chat unread count
        if (location.pathname === '/messages') {
          setMessageBadge(0);
        } else {
          const chatRes = await chatAPI.getUnreadCount();
          setMessageBadge(chatRes?.data?.count || 0);
        }
      } catch (e) {}
    };

    if (user.role === 'user') {
      fetchCounts();
      const interval = setInterval(fetchCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/welcome');
  };

  return (
    <>
      <nav className="desktop-navbar" style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 1000,
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        height: 'var(--nav-height)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', width: '100%' }}>
          {/* Left: Logo + Drawer Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>

            <Link to="/" style={{ textDecoration: 'none' }}>
              <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', margin: 0, fontWeight: 800, lineHeight: 1 }}>EventHub</h2>
            </Link>
          </div>

          {/* Center: Search (Desktop Only) */}
          <div className="hidden-mobile" style={{
            background: '#f1f5f9',
            padding: '0.6rem 1.2rem',
            borderRadius: '50px',
            width: '320px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            border: '1px solid #e2e8f0'
          }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', width: '100%' }}
            />
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Nav Icons (Desktop/Tablet Only) */}
            <div className="hidden-mobile" style={{ display: 'flex', gap: '2rem', marginRight: '1rem' }}>
              <NavLink icon={<Home size={20} />} label="Home" to="/" active={location.pathname === '/'} />
              <NavLink icon={<Compass size={20} />} label="Networks" to="/networking" active={location.pathname === '/networking'} badge={networkBadge} />
              <NavLink icon={<MessageSquare size={20} />} label="Messages" to="/messages" active={location.pathname === '/messages'} badge={messageBadge} />
            </div>

            {/* Global Icons (Mobile + Desktop) */}
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <Link to="/notifications" className="nav-icon-btn">
                <Bell size={22} />
                {notifBadge > 0 && <span className="notif-badge">{notifBadge}</span>}
              </Link>
              <div className="hidden-mobile" style={{ display: 'flex', gap: '0.8rem' }}>
                <Link to="/messages" className="nav-icon-btn">
                  <MessageSquare size={22} />
                  {messageBadge > 0 && <span className="notif-badge">{messageBadge}</span>}
                </Link>
              </div>
              
              {/* Removed handleLogout button as per request to move to settings */}

              {user.role !== 'guest' && (
                <Link to="/profile">
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--primary-light)', color: 'var(--primary-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden', border: '1px solid var(--border-color)'
                  }}>
                    {user.avatar ? (
                      <img 
                        src={user.avatar.startsWith('http') ? user.avatar : `http://${SERVER_IP}:5000/${user.avatar.startsWith('uploads') ? '' : 'uploads/'}${user.avatar.replace(/\\/g, '/')}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (user.name?.[0] || 'U')}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Side Drawer ── */}
      {isDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
          <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ 
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '280px', 
            background: 'var(--bg-color)', boxShadow: '5px 0 15px rgba(0,0,0,0.1)',
            padding: '1.5rem', overflowY: 'auto', animation: 'slideInLeft 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--primary-color)' }}>EventHub</h3>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            {/* The Sidebar content goes here */}
            <div className="mobile-drawer-content">
              <Sidebar role={user.role} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .nav-icon-btn { 
          background: none; 
          border: none; 
          color: #64748b; 
          cursor: pointer; 
          position: relative; 
          display: flex; 
          align-items: center; 
          transition: var(--transition);
        }
        .nav-icon-btn:hover {
          color: var(--primary-color);
        }
        .notif-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          font-size: 0.6rem;
          padding: 1px 4px;
          border-radius: 10px;
          border: 2px solid white;
        }
        .mobile-only-flex { display: none; }
        @media (max-width: 768px) {
          .mobile-only-flex { display: flex; }
          .mobile-drawer-content aside { display: block !important; position: static !important; width: 100% !important; }
        }
      `}</style>
    </>
  );
};

const NavLink = ({ icon, label, to, active, badge }) => (
  <Link to={to} style={{
    textDecoration: 'none',
    color: active ? 'var(--primary-color)' : '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    position: 'relative',
    transition: 'var(--transition)'
  }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-8px',
          background: '#ef4444',
          color: 'white',
          fontSize: '0.6rem',
          padding: '1px 4px',
          borderRadius: '10px',
          border: '2px solid white',
          fontWeight: 900
        }}>
          {badge}
        </span>
      )}
    </div>
    <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
  </Link>
);

export default Navbar;
