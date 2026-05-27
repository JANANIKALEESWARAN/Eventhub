import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Bell, Heart, MessageSquare, Calendar, UserPlus, Star, ChevronRight, Clock, ArrowLeft } from 'lucide-react';
import { userAPI } from '../api/api';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await userAPI.getNotifications();
        console.log('Fetched notifications:', res.data);
        setNotifications(res.data);
        // Mark all notifications as read automatically when viewing the page
        await userAPI.markAllNotificationsRead();
      } catch (err) {
        console.error('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await userAPI.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {}
  };

  const getNotificationDetails = (n) => {
    switch (n.type) {
      case 'connection_request':
        return { text: `${n.sender?.name || 'Someone'} wants to connect with you`, icon: <UserPlus color="#3b82f6" /> };
      case 'new_follower':
        return { text: `${n.sender?.name || 'Someone'} followed your profile`, icon: <Star color="#8b5cf6" /> };
      case 'connection_accepted':
        return { text: `${n.sender?.name || 'Someone'} accepted your connection request`, icon: <UserPlus color="#10b981" /> };
      case 'connection_rejected':
        return { text: `${n.sender?.name || 'Someone'} request is ignored`, icon: <Bell color="#94a3b8" /> };
      case 'event_announcement':
        return { text: n.message || `${n.sender?.name || 'Coordinator'} sent you an event update`, icon: <Calendar color="#f59e0b" />, event: n.event };
      default:
        return { text: 'You have a new update', icon: <Bell color="#64748b" /> };
    }
  };

  const handleNotificationClick = (n) => {
    // Navigate based on notification type
    if (n.type === 'event_announcement') {
      navigate('/events');
    } else if (['connection_request', 'connection_accepted', 'connection_rejected', 'new_follower'].includes(n.type)) {
      navigate('/networking');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', maxWidth: '800px', paddingBottom: '100px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontWeight: 800, margin: 0 }}>Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllRead}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading notifications...</div>
        ) : (
          <div className="premium-card" style={{ overflow: 'hidden' }}>
            {notifications.length > 0 ? notifications.map((n, i) => {
              const details = getNotificationDetails(n);
              return (
                <div key={n._id} style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  gap: '1.2rem', 
                  alignItems: 'center', 
                  borderBottom: i === notifications.length - 1 ? 'none' : '1px solid var(--border-color)',
                  background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }} className="notif-item" onClick={() => handleNotificationClick(n)}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '14px', 
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-soft)'
                  }}>
                    {details.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: n.isRead ? 500 : 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {details.text}
                    </p>
                    {details.event && (
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                        Event: {n.event?.title || 'Event'}
                      </p>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                      <Clock size={12} /> {formatTime(n.createdAt)}
                    </span>
                  </div>
                  {!n.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }} />}
                  <ChevronRight size={18} color="#cbd5e1" />
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
                <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                <p>No notifications yet. Stay tuned!</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        .notif-item:hover {
          background: #f8fafc !important;
          transform: translateX(5px);
        }
      `}</style>
    </div>
  );
};

export default Notifications;
