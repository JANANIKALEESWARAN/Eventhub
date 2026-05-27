import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Settings, Users, Bell, FileText, Shield, MessageSquare, Trash2, Pin, VolumeX, ArrowLeft, Pencil } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';

const EventManagement = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('participants');
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [toggles, setToggles] = useState({
    aiBot: true,
    discoverable: true,
    autoApprove: false
  });
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const handleDelete = async () => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      onCancel: closeDialog,
      onConfirm: async () => {
        try {
          await eventAPI.deleteEvent(id);
          setDialogConfig({ 
            isOpen: true, 
            type: 'alert', 
            title: 'Success', 
            message: 'Event deleted successfully!', 
            position: 'top',
            onConfirm: () => navigate('/coordinator') 
          });
        } catch (error) {
          closeDialog();
          setTimeout(() => setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to delete event', onConfirm: closeDialog }), 300);
        }
      }
    });
  };

  const handleRemoveParticipant = async (participantId) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Remove Participant',
      message: 'Are you sure you want to remove this participant?',
      confirmText: 'Remove',
      onCancel: closeDialog,
      onConfirm: async () => {
        try {
          await eventAPI.removeParticipant(id, participantId);
          setParticipants(prev => prev.filter(p => p._id !== participantId));
          setDialogConfig({ 
            isOpen: true, 
            type: 'alert', 
            title: 'Success', 
            message: 'Participant removed successfully!', 
            position: 'top',
            onConfirm: closeDialog 
          });
        } catch (error) {
          closeDialog();
          setTimeout(() => setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to remove participant', onConfirm: closeDialog }), 300);
        }
      }
    });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Please enter a message', onConfirm: closeDialog });
      return;
    }
    setSendingBroadcast(true);
    try {
      await eventAPI.notifyParticipants(id, broadcastMessage);
      setBroadcastMessage('');
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Broadcast sent successfully!', position: 'top', onConfirm: closeDialog });
    } catch (error) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: error.response?.data?.message || 'Failed to send broadcast', onConfirm: closeDialog });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventRes = await eventAPI.getEventById(id);
        setEvent(eventRes.data);
        const partRes = await eventAPI.getParticipants(id);
        setParticipants(partRes.data);
      } catch (error) {
        console.error('Failed to fetch event management data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Initializing management console...</div>;
  if (!event) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Event not found.</div>;

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Navbar />
      <div className="container manage-event-container" style={{ paddingTop: '100px', paddingBottom: '40px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <button onClick={() => navigate('/coordinator')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="manage-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem', width: '100%' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.2rem, 5vw, 2.2rem)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{event.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.85rem' }} className="hidden-mobile">Event Management & Administration Console</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
            <button onClick={() => navigate(`/edit-event/${id}`)} className="btn-icon-premium" title="Edit Event">
              <Pencil size={20} />
            </button>
            <button onClick={handleDelete} className="btn-icon-premium delete-btn" title="Delete Event">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="manage-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', width: '100%' }}>
          <main style={{ minWidth: 0, width: '100%' }}>
            <div className="premium-card manage-card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
              <div className="manage-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', flexWrap: 'nowrap', width: '100%' }}>
                <ManageTab label="Participants" active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} icon={<Users size={18} />} />
                <ManageTab label="Announcements" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Bell size={18} />} />
              </div>

              <div style={{ padding: '1.5rem', width: '100%' }} className="tab-content">
                {activeTab === 'participants' && <ParticipantsList participants={participants} onRemove={handleRemoveParticipant} navigate={navigate} />}
                {activeTab === 'announcements' && <AnnouncementsSection eventId={id} onSend={handleSendBroadcast} message={broadcastMessage} setMessage={setBroadcastMessage} sending={sendingBroadcast} />}
              </div>
            </div>
          </main>

          <aside className="manage-sidebar" style={{ minWidth: 0 }}>
            <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h4 style={{ marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 800 }}>Real-time Stats</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <StatRow label="Joined" value={participants.length} />
                <StatRow label="Capacity" value={event.registrationLimit || 'Unlimited'} />
                <StatRow label="Type" value={event.type.toUpperCase()} />
                <StatRow label="Status" value={event.isApproved ? 'LIVE' : 'PENDING'} color={event.isApproved ? '#10b981' : '#f59e0b'} />
              </div>
            </div>

            <div className="premium-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h4 style={{ marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 800 }}>Quick Controls</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <SafetyToggle label="Enable AI Bot" enabled={toggles.aiBot} onToggle={() => handleToggle('aiBot')} />
                <SafetyToggle label="Discoverable" enabled={toggles.discoverable} onToggle={() => handleToggle('discoverable')} />
                <SafetyToggle label="Auto-Approve" enabled={toggles.autoApprove} onToggle={() => handleToggle('autoApprove')} />
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .btn-icon-premium {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon-premium:hover {
          background: #f8fafc;
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .btn-icon-premium.delete-btn {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fee2e2;
        }
        .btn-icon-premium.delete-btn:hover {
          background: #fee2e2;
          border-color: #ef4444;
        }
        
        @media (max-width: 900px) {
          .manage-grid { grid-template-columns: 1fr !important; }
          .manage-sidebar { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .manage-sidebar > div { margin-bottom: 0 !important; }
        }
        
        @media (max-width: 640px) {
          .manage-event-container { padding-left: 1rem; padding-right: 1rem; }
          .manage-header { margin-bottom: 1.5rem !important; }
          .manage-sidebar { grid-template-columns: 1fr; }
          .manage-tabs button { padding: 0.8rem 0.5rem !important; font-size: 0.8rem !important; min-width: 100px; }
          .tab-content { padding: 1rem !important; }
          .hidden-mobile { display: none !important; }
        }
      `}} />
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

const ManageTab = ({ label, active, onClick, icon }) => (
  <button onClick={onClick} style={{ 
    flex: 1, padding: '1.2rem 1rem', background: 'none', border: 'none', 
    borderBottom: active ? '3px solid var(--primary-color)' : '3px solid transparent',
    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  }}>
    {icon} <span>{label}</span>
  </button>
);

const ParticipantsList = ({ participants, onRemove, navigate }) => (
  <div>
    {participants.length === 0 ? (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No participants registered for this event yet.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {participants.map(p => (
          <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div 
              style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0, paddingRight: '1rem', cursor: 'pointer', flex: 1 }}
              onClick={() => navigate(`/profile/${p._id}`)}
              title="View Profile"
            >
              <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--primary-color)' }}>{p.name}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</span>
            </div>
            <button onClick={() => onRemove(p._id)} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '8px', flexShrink: 0, transition: 'all 0.2s' }}>Remove</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const AnnouncementsSection = ({ onSend, message, setMessage, sending }) => (
  <div>
    <textarea
      placeholder="Compose a new broadcast message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', marginBottom: '1rem', fontSize: '0.95rem', resize: 'vertical' }}
    />
    <button onClick={onSend} disabled={sending} className="btn-premium btn-premium-primary" style={{ opacity: sending ? 0.5 : 1, cursor: sending ? 'not-allowed' : 'pointer', width: '100%' }}>
      {sending ? 'Sending...' : 'Send Broadcast'}
    </button>

    <div style={{ marginTop: '2.5rem' }}>
      <h4 style={{ marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: 700 }}>Broadcast History</h4>
      <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#f8fafc', borderRadius: '15px', border: '1px dashed #cbd5e1', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        No broadcast history available.
      </div>
    </div>
  </div>
);

const ChatModeration = ({ setDialogConfig, closeDialog }) => {
  const [announcementOnly, setAnnouncementOnly] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleDeleteMessage = (id) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmText: 'Delete',
      onCancel: closeDialog,
      onConfirm: () => {
        setMessages(prev => prev.filter(m => m.id !== id));
        closeDialog();
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: announcementOnly ? 'var(--primary-light)' : '#f1f5f9', borderRadius: '12px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <Shield size={24} color={announcementOnly ? 'var(--primary-color)' : '#64748b'} />
        <div style={{ flex: 1 }}>
          <h5 style={{ margin: 0, color: announcementOnly ? 'var(--primary-color)' : '#64748b', fontWeight: 800, fontSize: '0.95rem' }}>Announcement-Only Mode</h5>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: announcementOnly ? 'var(--primary-color)' : '#64748b', opacity: 0.8 }}>Only coordinators can post in the event feed while this is active.</p>
        </div>
        <button onClick={() => setAnnouncementOnly(!announcementOnly)} className="btn-premium" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', background: announcementOnly ? 'var(--primary-color)' : 'white', color: announcementOnly ? 'white' : 'var(--text-primary)', borderRadius: '8px' }}>
          {announcementOnly ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div>
        <h5 style={{ marginBottom: '1.25rem', fontWeight: 800, fontSize: '0.95rem' }}>Recent Activity Log</h5>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '2rem' }}>No recent activity to show.</p>
        ) : messages.map(msg => (
          <div key={msg.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{msg.user}</p>
              <p style={{ margin: '0.1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{msg.text}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteMessage(msg.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</span>
  </div>
);

const SafetyToggle = ({ label, enabled, onToggle }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
    <div onClick={onToggle} style={{ width: '40px', height: '22px', background: enabled ? 'var(--primary-color)' : '#e2e8f0', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
      <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: enabled ? '21px' : '3px', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
    </div>
  </div>
);

export default EventManagement;
