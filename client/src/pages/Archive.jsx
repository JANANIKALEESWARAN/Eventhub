import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userAPI } from '../api/api';
import { ArrowLeft, History, Calendar, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Archive = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const pastEvents = profile?.joinedEvents?.filter(e => new Date(e.date) < new Date()) || [];

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', paddingBottom: '50px', maxWidth: '600px', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Archive</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ margin: '0 auto' }}></div>
          </div>
        ) : pastEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <History size={40} color="#cbd5e1" />
            </div>
            <h3 style={{ fontWeight: 800 }}>No Past Events</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0.5rem auto' }}>Your past joined and created events will appear here once they are completed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pastEvents.map(event => (
              <div 
                key={event._id} 
                onClick={() => navigate(`/event/${event._id}`)}
                className="premium-card"
                style={{ 
                  padding: '1.2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <Calendar size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>{event.title}</h4>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(event.date).toLocaleDateString()} • {event.location}
                  </p>
                </div>
                <div style={{ color: '#10b981' }}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Archive;
