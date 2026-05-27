import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Calendar, MapPin, Users, Share2, Heart, MessageSquare, Megaphone, Info, Flag, ArrowLeft, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, reportAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isLiked, setIsLiked] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));
  const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // Add timestamp to prevent caching
        const response = await eventAPI.getEventById(`${id}?t=${Date.now()}`);
        setEvent(response.data);
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && response.data.participants?.some(p => (p._id || p) === user._id)) {
          setIsJoined(true);
        }
      } catch (error) {
        console.error('Failed to fetch event details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRefresh = async () => {
    try {
      const response = await eventAPI.getEventById(`${id}?t=${Date.now()}`);
      setEvent(response.data);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Refreshed', message: 'Event details updated!', position: 'top', onConfirm: closeDialog });
    } catch (err) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to refresh details', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleJoin = async () => {
    try {
      await eventAPI.enrollEvent(id);
      setIsJoined(true);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Enrolled successfully!', position: 'top', onConfirm: closeDialog });
      // Refresh event data to update participant count
      const response = await eventAPI.getEventById(id);
      setEvent(response.data);
    } catch (error) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: error.response?.data?.message || 'Failed to enroll', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setDialogConfig({ isOpen: true, type: 'alert', title: 'Link Copied', message: 'Event link copied to clipboard!', position: 'top', onConfirm: closeDialog });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleReport = async () => {
    setDialogConfig({
      isOpen: true,
      type: 'prompt',
      title: 'Report Event',
      message: 'Please enter the reason for reporting this event:',
      onCancel: closeDialog,
      onConfirm: async (reason) => {
        if (!reason) return;
        try {
          await reportAPI.createReport({
            targetType: 'Event',
            targetId: id,
            reason: reason,
            details: 'User reported from event detail page'
          });
          setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Report submitted successfully. Our moderators will review it.', position: 'top', onConfirm: closeDialog });
        } catch (error) {
          setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to submit report', position: 'top', onConfirm: closeDialog });
        }
      }
    });
  };

  const [isFullScreen, setIsFullScreen] = useState(false);

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading event...</div>;
  if (!event) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Event not found.</div>;

  const coverImageUrl = event.coverMedia ? (event.coverMedia.startsWith('http') ? event.coverMedia : `http://${SERVER_IP}:5000/uploads/${event.coverMedia.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/')}`) : null;

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '80px' }}>
      <Navbar />
      
      {/* Full Screen Image Modal */}
      {isFullScreen && coverImageUrl && (
        <div 
          onClick={() => setIsFullScreen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.95)', 
            zIndex: 3000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={coverImageUrl} 
            alt="Full Screen" 
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
          />
          <button 
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setIsFullScreen(false)}
          >×</button>
        </div>
      )}

      <div className="container" style={{ paddingTop: '100px' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Back to Events
        </button>

        {/* Cover Image & Primary Info */}
        <div 
          onClick={() => coverImageUrl && setIsFullScreen(true)}
          style={{ 
            width: '100%', 
            background: '#e2e8f0', 
            borderRadius: 'var(--radius-lg)', 
            overflow: 'hidden', 
            marginBottom: '2rem', 
            boxShadow: 'var(--shadow-soft)',
            cursor: coverImageUrl ? 'zoom-in' : 'default',
            position: 'relative'
          }}
        >
          {coverImageUrl ? (
            <>
              <img 
                src={coverImageUrl} 
                alt="Event Cover" 
                style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)' }}>
                <Info size={14} /> Click to enlarge
              </div>
            </>
          ) : (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Info size={48} />
            </div>
          )}
        </div>

        <div className="event-detail-grid">
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1 1 100%' }}>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', marginBottom: '0.8rem', display: 'inline-block', textTransform: 'capitalize' }}>{event.type}</span>
                <h1 style={{ fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-1px', wordBreak: 'break-word' }}>{event.title}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> 
                    {(() => {
                      const startDate = new Date(event.date).toLocaleDateString();
                      const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString() : null;
                      return endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;
                    })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} /> {event.location}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} /> 
                    {formatTime(event.time)} {event.endTime ? ` - ${formatTime(event.endTime)}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handleRefresh} title="Refresh Data" className="btn-premium" style={{ background: '#f0f9ff', color: '#0ea5e9', borderColor: '#e0f2fe' }}>Refresh</button>
                <button onClick={handleReport} title="Report Event" className="btn-premium" style={{ background: '#fef2f2', color: '#ef4444', borderColor: '#fee2e2' }}><Flag size={18} /></button>
                <button onClick={handleShare} className="btn-premium"><Share2 size={18} /></button>
                <button onClick={handleLike} className="btn-premium" style={{ color: isLiked ? '#ef4444' : '', borderColor: isLiked ? '#fecaca' : '' }}><Heart size={18} fill={isLiked ? '#ef4444' : 'none'} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px' }} className="hide-scrollbar">
              <button onClick={() => setActiveTab('info')} style={tabStyle(activeTab === 'info')}>About</button>
              <button onClick={() => setActiveTab('announcements')} style={tabStyle(activeTab === 'announcements')}>Announcements</button>
              <button onClick={() => setActiveTab('participants')} style={tabStyle(activeTab === 'participants')}>Participants</button>
            </div>

            {activeTab === 'info' && (
              <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.8' }}>
                <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem', boxShadow: 'none', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>Event Description</h3>
                  <p>{event.description}</p>
                </div>

                {event.roadmap && event.roadmap.length > 0 ? (
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: 800 }}>Event Roadmap</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {event.roadmap.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{idx + 1}</div>
                            {idx !== event.roadmap.length - 1 && <div style={{ width: '2px', flexGrow: 1, background: 'var(--border-color)', margin: '0.5rem 0' }}></div>}
                          </div>
                          <div style={{ paddingBottom: '2rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary-color)', fontWeight: 700 }}>{item.day || `Step ${idx + 1}`}</h4>
                            <h5 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>{item.title}</h5>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '2.5rem', padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                    <Info size={24} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No roadmap has been added for this event yet.</p>
                  </div>
                )}

                <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem' }}>Requirements</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{event.requiredSkills && event.requiredSkills.length > 0 ? event.requiredSkills.join(', ') : 'No specific skills required.'}</p>

                {(event.contactPerson || event.contactEmail || event.contactPhone) && (
                  <div className="premium-card" style={{ padding: '1.5rem', background: 'var(--primary-light)', border: '1px solid var(--primary-color)', boxShadow: 'none' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', color: 'var(--primary-color)' }}>Contact Information</h3>
                    <div style={{ fontSize: '1rem', display: 'grid', gap: '0.8rem' }}>
                      {event.contactPerson && <div><span style={{ fontWeight: 700 }}>Person:</span> {event.contactPerson}</div>}
                      {event.contactEmail && <div><span style={{ fontWeight: 700 }}>Email:</span> {event.contactEmail}</div>}
                      {event.contactPhone && <div><span style={{ fontWeight: 700 }}>Phone:</span> {event.contactPhone}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {event.resources && event.resources.length > 0 ? event.resources.map((res, idx) => (
                  <div key={idx} className="premium-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-color)', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <Megaphone size={16} color="var(--primary-color)" />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{res.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Announcement</span>
                    </div>
                    {res.url && <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', textDecoration: 'underline' }}>View Resource</a>}
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No announcements yet.</div>
                )}
              </div>
            )}

            {activeTab === 'participants' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {event.participants && event.participants.length > 0 ? event.participants.map(user => (
                  <div key={user._id} className="premium-card" style={{ padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', overflow: 'hidden' }}>
                      {user.avatar ? <img src={user.avatar.startsWith('http') ? user.avatar : `http://${SERVER_IP}:5000/${user.avatar.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/')}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]}
                    </div>
                    <div style={{ fontWeight: 700 }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    <button onClick={() => navigate(`/profile/${user._id}`)} className="btn-premium" style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}>View Profile</button>
                  </div>
                )) : (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No participants yet.</div>
                )}
              </div>
            )}
          </main>

          <aside>
            <div className="premium-card" style={{ padding: '1.5rem', position: 'sticky', top: '100px', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {event.isPaid ? `Price: ₹${event.price || 0}` : 'Free Registration'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {event.registrationCloseDate ? `Registration closes: ${new Date(event.registrationCloseDate).toLocaleDateString()}` : 'Registration Open'}
                </p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={handleJoin}
                  disabled={isJoined}
                  className="btn-premium btn-premium-primary" 
                  style={{ 
                    width: 'fit-content', 
                    minWidth: '200px',
                    padding: '0.8rem 2rem', 
                    justifyContent: 'center', 
                    fontSize: '1rem', 
                    background: isJoined ? '#10b981' : '', 
                    borderColor: isJoined ? '#10b981' : '' 
                  }}
                >
                  {isJoined ? '✓ Enrolled' : 'Join Event'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Event Coordinator</h4>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                    {event.coordinator?.avatar ? <img src={`http://${SERVER_IP}:5000/${event.coordinator.avatar}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (event.coordinator?.name?.[0] || 'C')}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.85rem' }}>{event.coordinator?.name || 'Coordinator'}</h5>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Event Organizer</p>
                  </div>
                </div>
              </div>

              {(event.contactPerson || event.contactEmail || event.contactPhone) && (
                <div className="hidden-mobile" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>Contact Information</h4>
                  <div style={{ fontSize: '0.85rem', display: 'grid', gap: '0.5rem' }}>
                    {event.contactPerson && <div><span style={{ fontWeight: 700 }}>Person:</span> {event.contactPerson}</div>}
                    {event.contactEmail && <div><span style={{ fontWeight: 700 }}>Email:</span> {event.contactEmail}</div>}
                    {event.contactPhone && <div><span style={{ fontWeight: 700 }}>Phone:</span> {event.contactPhone}</div>}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                <div style={{ width: '100%', background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <Users size={18} color="var(--primary-color)" />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{event.participants?.length || 0} Joined</span>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Capacity: {event.registrationLimit > 0 ? `${event.registrationLimit} Seats` : 'Unlimited'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

const tabStyle = (isActive) => ({
  background: 'none',
  border: 'none',
  padding: '1rem 0',
  fontSize: '1rem',
  fontWeight: isActive ? 800 : 600,
  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
  borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.3s'
});

// Add styles for the grid
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  .event-detail-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2.5rem;
  }
  @media (max-width: 1024px) {
    .event-detail-grid {
      grid-template-columns: 1fr;
    }
    aside {
      display: block !important;
      margin-top: 2rem;
    }
    h1 {
      font-size: 1.8rem !important;
    }
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(styleTag);

export default EventDetail;
