import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { eventAPI, reportAPI } from '../api/api';

const AdminEventModeration = () => {
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, reportsRes] = await Promise.all([
          eventAPI.getEvents(),
          reportAPI.getReports()
        ]);
        setEvents(eventsRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error('Failed to fetch moderation data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const handleApprove = async (id) => {
    try {
      await eventAPI.approveEvent(id);
      alert('Event approved successfully');
      const response = await eventAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      alert('Failed to approve event');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this event?')) {
      try {
        await eventAPI.deleteModeratedEvent(id);
        alert('Event removed successfully');
        const response = await eventAPI.getEvents();
        setEvents(response.data);
      } catch (error) {
        alert('Failed to remove event');
      }
    }
  };

  if (loading) return <AdminLayout><div style={{ padding: '2rem', textAlign: 'center' }}>Loading events for moderation...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 800 }}>Event Moderation</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => alert(`Reviewing ${pendingReports} active reports...`)}
            className="btn-premium" 
            style={{ background: 'white', border: '1px solid var(--border-color)', color: '#ef4444' }}
          >
            View Reports ({pendingReports})
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {events.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No events found in the database.</div>
        ) : (
          events.map(event => (
            <EventModCard 
              key={event._id}
              title={event.title} 
              coordinator={event.coordinator?.name || 'Unknown'} 
              reports={`${reports.filter(r => r.targetId === event._id).length} Reports`} 
              reason={reports.find(r => r.targetId === event._id)?.reason || 'None'} 
              status={event.isApproved ? 'Verified' : 'Pending Review'} 
              severity={reports.filter(r => r.targetId === event._id).length > 5 ? 'High' : 'Low'}
              onApprove={() => handleApprove(event._id)}
              onDelete={() => handleDelete(event._id)}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
};

const EventModCard = ({ title, coordinator, reports, reason, status, severity, onApprove, onDelete }) => (
  <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <div style={{ 
        width: '10px', 
        height: '60px', 
        borderRadius: '5px', 
        background: severity === 'High' ? '#ef4444' : '#10b981' 
      }}></div>
      <div>
        <h3 style={{ margin: 0 }}>{title} <ExternalLink size={16} color="#888" style={{ cursor: 'pointer' }} /></h3>
        <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>Organized by: <span style={{ fontWeight: 700 }}>{coordinator}</span></p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444' }}>{reports}</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reason: {reason}</span>
        </div>
      </div>
    </div>
    
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <span className="badge" style={{ 
        background: status === 'Verified' ? '#dcfce7' : '#fee2e2', 
        color: status === 'Verified' ? '#166534' : '#991b1b' 
      }}>{status}</span>
      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <button onClick={onApprove} title="Verify" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #10b981', color: '#10b981', background: 'none', cursor: 'pointer' }}><CheckCircle size={18} /></button>
        <button onClick={onDelete} title="Delete" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', background: 'none', cursor: 'pointer' }}><XCircle size={18} /></button>
      </div>
    </div>
  </div>
);

export default AdminEventModeration;
