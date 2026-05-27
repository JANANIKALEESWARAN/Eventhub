import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, MessageSquare, Compass, Briefcase } from 'lucide-react';
import { eventAPI, userAPI, chatAPI } from '../api/api';

const MobileTabBar = () => {
  const { pathname } = useLocation();

  // Get current user role
  let user = { role: 'guest' };
  try {
    const stored = localStorage.getItem('user');
    if (stored) user = JSON.parse(stored);
  } catch (e) { }

  // Notification counts
  const [badges, setBadges] = React.useState({
    '/events': 0,
    '/networking': 0,
    '/messages': 0,
    '/jobs': 0
  });

  const eventBadgeKey = `lastSeenEventsAt_${user?._id || 'guest'}`;

  // Fetch Event Notifications
  React.useEffect(() => {
    const fetchEventCount = async () => {
      try {
        if (pathname === '/events') return;
        const res = await eventAPI.getEvents();
        const lastSeenStr = localStorage.getItem(eventBadgeKey);
        let newEventsCount = 0;

        if (lastSeenStr) {
          const lastSeen = new Date(lastSeenStr);
          newEventsCount = res.data.filter(event => new Date(event.createdAt) > lastSeen).length;
        } else {
          newEventsCount = res.data.filter(event => new Date(event.date) >= new Date().setHours(0, 0, 0, 0)).length;
        }
        setBadges(prev => ({ ...prev, '/events': newEventsCount }));
      } catch (err) { }
    };

    if (user.role === 'user') {
      fetchEventCount();
      const interval = setInterval(fetchEventCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role, pathname, eventBadgeKey]);

  // Fetch Networking Notifications
  React.useEffect(() => {
    const fetchNetworkingCount = async () => {
      try {
        if (pathname === '/networking') return;
        const res = await userAPI.getNetworkingNotificationsCount();
        setBadges(prev => ({ ...prev, '/networking': res.data.count }));
      } catch (err) { }
    };

    const fetchMessageCount = async () => {
      try {
        if (pathname === '/messages') return;
        const res = await chatAPI.getUnreadCount();
        setBadges(prev => ({ ...prev, '/messages': res?.data?.count || 0 }));
      } catch (err) { }
    };

    if (user.role === 'user') {
      fetchNetworkingCount();
      fetchMessageCount();
      const interval = setInterval(() => {
        fetchNetworkingCount();
        fetchMessageCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role, pathname]);

  // Clear badges on visit
  React.useEffect(() => {
    if (pathname === '/events') {
      localStorage.setItem(eventBadgeKey, new Date().toISOString());
      setBadges(prev => ({ ...prev, '/events': 0 }));
    }
    if (pathname === '/networking') {
      const clearNetworking = async () => {
        try {
          await userAPI.markNetworkingNotificationsRead();
          setBadges(prev => ({ ...prev, '/networking': 0 }));
        } catch (err) { }
      };
      clearNetworking();
    }
    if (pathname === '/messages') {
      setBadges(prev => ({ ...prev, '/messages': 0 }));
    }
  }, [pathname, eventBadgeKey]);

  // Clear badge when a tab is clicked
  const clearBadge = (path) => {
    setBadges(prev => ({
      ...prev,
      [path]: 0
    }));
    if (path === '/events') {
      localStorage.setItem(eventBadgeKey, new Date().toISOString());
    }
  };

  // Hide for non-participants (Coordinators/Admins) and public pages
  const isPublicPage = ['/welcome', '/auth/user', '/auth/coordinator', '/auth/admin'].includes(pathname);
  const isParticipant = user.role === 'user';

  if (!isParticipant || isPublicPage) return null;

  const tabs = [
    { to: '/', icon: <Home size={22} />, label: 'Home' },
    { to: '/events', icon: <Calendar size={22} />, label: 'Events' },
    { to: '/networking', icon: <Compass size={22} />, label: 'Networks' },
    { to: '/jobs', icon: <Briefcase size={22} />, label: 'Jobs' },
    { to: '/messages', icon: <MessageSquare size={22} />, label: 'Messages' },
  ];

  return (
    <nav className="mobile-tabbar">
      {tabs.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          onClick={() => clearBadge(tab.to)}
          className={pathname === tab.to ? 'active' : ''}
          style={{
            color: pathname === tab.to ? 'var(--primary-color)' : 'var(--text-secondary)',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative' }}>
            {tab.icon}
            {badges[tab.to] > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '12px',
                border: '2px solid white',
                minWidth: '16px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {badges[tab.to]}
              </span>
            )}
          </div>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default MobileTabBar;
