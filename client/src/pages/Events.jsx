import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { eventAPI, userAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';

const formatTime = (timeStr) => {
  if (!timeStr) return 'TBD';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsResponse = await eventAPI.getEvents();
        // Sort events by updatedAt (most recently updated first)
        const sortedEvents = eventsResponse.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setEvents(sortedEvents);

        try {
          const profileResponse = await userAPI.getProfile();
          setUserProfile(profileResponse.data);
        } catch(e) {
          console.error('Could not fetch user profile');
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
      }
    };
    fetchEvents();
  }, []);

  const handleJoin = async (id) => {
    try {
      await eventAPI.enrollEvent(id);
      setDialogConfig({ 
        isOpen: true, 
        type: 'alert', 
        title: 'Success', 
        message: 'Successfully enrolled!', 
        position: 'top',
        onConfirm: closeDialog 
      });
      const profileResponse = await userAPI.getProfile();
      setUserProfile(profileResponse.data);
    } catch (error) {
      console.error('Failed to enroll', error);
      setDialogConfig({ 
        isOpen: true, 
        type: 'alert', 
        title: 'Error', 
        message: error.response?.data?.message || 'Failed to enroll', 
        position: 'top',
        onConfirm: closeDialog 
      });
    }
  };

  const isEnrolled = (eventId) => {
    if (!userProfile) return false;
    return userProfile.joinedEvents?.some(e => e._id === eventId);
  };

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    // Tab filtering
    let passesTab = true;
    switch (activeTab) {
      case 'Future':
        passesTab = eventDate > now;
        break;
      case 'Past':
        passesTab = eventDate <= now;
        break;
      case 'My events':
        passesTab = isEnrolled(event._id);
        break;
      default: // 'All'
        passesTab = true;
    }

    if (!passesTab) return false;

    // Search filtering
    const searchMatch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       event.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (!searchMatch) return false;

    // Price filtering
    if (priceFilter !== 'All') {
      const isPaid = priceFilter === 'Paid';
      if (event.isPaid !== isPaid) return false;
    }

    // Type filtering
    if (typeFilter !== 'All') {
      if (event.type !== typeFilter.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Navbar />
      <div className="container home-grid" style={{ marginTop: '80px', gap: '2rem', padding: '0 1rem' }}>
        <Sidebar role="user" />
        <main>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Discover Events</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
              {['All', 'My events', 'Past', 'Future'].map(tab => (
                <span 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    fontWeight: activeTab === tab ? 700 : 500, 
                    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)', 
                    borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent', 
                    paddingBottom: '0.8rem', 
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Advanced Filters */}
            <div className="events-filter-wrapper" style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1rem', 
              marginBottom: '2rem', 
              background: '#f8fafc', 
              padding: '1.2rem', 
              borderRadius: '15px', 
              border: '1px solid var(--border-color)' 
            }}>
              <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Search by title or location..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
              </div>
              
              <div className="filter-group" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flex: '1', minWidth: '140px' }}>
                <span className="filter-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Price:</span>
                <select 
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="All">All Prices</option>
                  <option value="Free">Free Only</option>
                  <option value="Paid">Paid Only</option>
                </select>
              </div>
    
              <div className="filter-group" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flex: '1', minWidth: '140px' }}>
                <span className="filter-label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Type:</span>
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="All">All Types</option>
                  <option value="Online">Online</option>
                  <option value="In-person">In-Person</option>
                </select>
              </div>
            </div>
               <style>{`
              @media (max-width: 768px) {
                .events-filter-wrapper { flex-direction: column !important; padding: 1rem !important; }
                .filter-group { width: 100% !important; flex-direction: column !important; align-items: flex-start !important; gap: 0.4rem !important; }
                .filter-label { font-size: 0.8rem !important; }
                .events-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
                .event-card { margin: 0 !important; }
                h2 { font-size: 1.5rem !important; }
              }
            `}</style>

            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {filteredEvents.map(event => {
                const SERVER_IP_EVT = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;
                const cleanPath = event.coverMedia?.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/');
                const imageSrc = event.coverMedia
                  ? (event.coverMedia.startsWith('http') ? event.coverMedia : `http://${SERVER_IP_EVT}:5000/uploads/${cleanPath}`)
                  : null;
                
                const availableSeats = event.registrationLimit > 0 ? event.registrationLimit - (event.participants?.length || 0) : 'Unlimited';
                const isClosed = event.registrationCloseDate && new Date() > new Date(event.registrationCloseDate);

                return (
                  <div 
                    key={event._id} 
                    className="event-card premium-card" 
                    style={{ padding: '0', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <div style={{ height: '180px', width: '100%', background: '#f0f4f8', position: 'relative' }}>
                      {imageSrc ? (
                        <img src={imageSrc} alt="cover" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                          No Cover Image
                        </div>
                      )}
                      <span style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: isClosed ? '#ef4444' : '#10b981', color: 'white',
                        padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.75rem',
                        fontWeight: 800, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textTransform: 'uppercase'
                      }}>
                        {isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ margin: '0 0 1rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{event.title}</h4>
                      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                            📅 {(() => {
                              const startDate = new Date(event.date).toLocaleDateString();
                              const endDate = event.endDate ? new Date(event.endDate).toLocaleDateString() : null;
                              return endDate && endDate !== startDate ? `${startDate} - ${endDate}` : startDate;
                            })()}
                          </span>
                          <span style={{ textTransform: 'capitalize', fontWeight: 800, color: event.type === 'online' ? '#3b82f6' : '#8b5cf6', background: event.type === 'online' ? '#eff6ff' : '#f5f3ff', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.7rem' }}>{event.type}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ⏰ <span style={{ fontWeight: 500 }}>{formatTime(event.time)} {event.endTime ? ` - ${formatTime(event.endTime)}` : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📍 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{event.location}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ background: event.isPaid ? '#fee2e2' : '#dcfce7', color: event.isPaid ? '#ef4444' : '#10b981', padding: '0.3rem 0.8rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                            {event.isPaid ? `Paid ($${event.price || 0})` : 'FREE'}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: availableSeats === 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                            👥 {availableSeats === 'Unlimited' ? 'Unlimited' : `${availableSeats} Seats Left`}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 'auto' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleJoin(event._id); }}
                          className={isEnrolled(event._id) ? "btn-premium" : "btn-premium btn-premium-primary"} 
                          style={{ 
                            width: '100%', padding: '0.75rem', fontWeight: 800, borderRadius: '12px',
                            fontSize: '0.9rem', opacity: isClosed && !isEnrolled(event._id) ? 0.6 : 1,
                            cursor: isClosed && !isEnrolled(event._id) ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isClosed && !isEnrolled(event._id)}
                        >
                          {isEnrolled(event._id) ? '✓ Registered' : (isClosed ? 'Registration Closed' : 'Register Now')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredEvents.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No events found in this category.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

export default Events;
