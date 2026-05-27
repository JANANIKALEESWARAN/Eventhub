import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AdminLayout from '../components/AdminLayout';
import { BarChart3, Users, AlertCircle, Shield, Settings, Activity, Flag } from 'lucide-react';
import { userAPI, reportAPI, eventAPI, systemAPI } from '../api/api';
import { useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const location = useLocation();
  
  const query = new URLSearchParams(location.search);
  const searchTerm = query.get('search') || '';

  const fetchData = async () => {
    try {
      const [usersRes, reportsRes, eventsRes, healthRes] = await Promise.all([
        userAPI.getUsers(),
        reportAPI.getReports(),
        eventAPI.getEvents(),
        systemAPI.getHealth()
      ]);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
      setEvents(eventsRes.data);
      setHealth(healthRes.data);
    } catch (error) {
      console.error('Failed to fetch admin dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    const dataToExport = activeTab === 'users' ? users : events;
    const csvContent = "data:text/csv;charset=utf-8," 
      + (activeTab === 'users' 
          ? "ID,Name,Email,Role,Date\n" + users.map(u => `${u._id},${u.name},${u.email},${u.role},${u.createdAt}`).join("\n")
          : "ID,Title,Coordinator,Date\n" + events.map(e => `${e._id},${e.title},${e.coordinator?.name},${e.date}`).join("\n"));
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading Admin Dashboard...</div>;

  const coordinators = users.filter(u => u.role === 'coordinator');
  const regularUsers = users.filter(u => u.role === 'user');
  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontWeight: 800 }}>Admin Command Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>System overview and platform governance</p>
        </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExport} className="btn-premium" style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Export Data</button>
            <button onClick={fetchData} className="btn-premium btn-premium-primary" title="Click to refresh">System Health: {health?.status || 'Stable'}</button>
          </div>
        </div>

        {/* Admin Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <AdminStat label="Total Users" value={users.length} icon={<Users size={20} />} trend="" />
          <AdminStat label="Coordinators" value={coordinators.length} icon={<Shield size={20} />} trend="" />
          <AdminStat label="Regular Users" value={regularUsers.length} icon={<Users size={20} />} trend="" />
          <AdminStat label="Memory Usage" value={health?.memory || '0MB'} icon={<Activity size={20} />} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          {/* Main Management Section */}
          <section>
            <div className="premium-card">
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '2rem' }}>
                <span 
                  onClick={() => setActiveTab('users')}
                  style={{ fontWeight: activeTab === 'users' ? 800 : 600, color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'users' ? '3px solid var(--primary-color)' : 'none', paddingBottom: '1.5rem', marginBottom: '-1.5rem', cursor: 'pointer' }}
                >
                  User Management
                </span>
                <span 
                  onClick={() => setActiveTab('events')}
                  style={{ fontWeight: activeTab === 'events' ? 800 : 600, color: activeTab === 'events' ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'events' ? '3px solid var(--primary-color)' : 'none', paddingBottom: '1.5rem', marginBottom: '-1.5rem', cursor: 'pointer' }}
                >
                  Event Moderation
                </span>
                <span 
                  onClick={() => setActiveTab('posts')}
                  style={{ fontWeight: activeTab === 'posts' ? 800 : 600, color: activeTab === 'posts' ? 'var(--primary-color)' : 'var(--text-secondary)', borderBottom: activeTab === 'posts' ? '3px solid var(--primary-color)' : 'none', paddingBottom: '1.5rem', marginBottom: '-1.5rem', cursor: 'pointer' }}
                >
                  Flagged Posts
                </span>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                {activeTab === 'users' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ paddingBottom: '1rem' }}>USER</th>
                        <th style={{ paddingBottom: '1rem' }}>ROLE</th>
                        <th style={{ paddingBottom: '1rem' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                        <UserAdminRow 
                          key={user._id}
                          name={user.name} 
                          role={user.role} 
                          status="Active" 
                        />
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'events' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ paddingBottom: '1rem' }}>EVENT TITLE</th>
                        <th style={{ paddingBottom: '1rem' }}>COORDINATOR</th>
                        <th style={{ paddingBottom: '1rem' }}>REPORTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
                        <tr key={event._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '1.2rem 0', fontWeight: 700 }}>{event.title}</td>
                          <td style={{ padding: '1.2rem 0', fontSize: '0.9rem' }}>{event.coordinator?.name || 'Unknown'}</td>
                          <td style={{ padding: '1.2rem 0' }}>
                            <span className="badge" style={{ background: '#fee2e2', color: '#ef4444' }}>
                              {reports.filter(r => r.targetId === event._id).length} Reports
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeTab === 'posts' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reports.filter(r => r.targetType === 'Post').slice(0, 10).map(report => (
                      <div key={report._id} className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{report.reason}</span>
                          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Flagged Post</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reporter: {report.reporter?.name}</p>
                      </div>
                    ))}
                    {reports.filter(r => r.targetType === 'Post').length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No flagged posts found.</p>}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions & Logs */}
          <aside>
            <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>Platform Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <HealthItem label="Database" status={health?.db || 'Stable'} value={health?.db === 'Connected' ? 'Online' : 'Offline'} />
                <HealthItem label="API Uptime" status="Active" value={`${Math.round(health?.uptime || 0)}s`} />
                <HealthItem label="Server Memory" status="Normal" value={health?.memory || 'N/A'} />
              </div>
            </div>

            <div className="premium-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>Recent Reports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.slice(0, 5).map(report => (
                  <ReportItem 
                    key={report._id}
                    user={report.reporter?.name || 'Unknown'} 
                    reason={report.reason} 
                    time={new Date(report.createdAt).toLocaleDateString()} 
                  />
                ))}
                {reports.length === 0 && <p style={{ color: '#888', fontSize: '0.85rem' }}>No reports recorded yet.</p>}
              </div>
              <button onClick={() => window.location.href='/admin/events'} style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'none', fontWeight: 600, cursor: 'pointer' }}>View All Flags</button>
            </div>
          </aside>
        </div>
      </AdminLayout>
  );
};

const AdminStat = ({ label, value, icon, color }) => (
  <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '6px', 
        background: 'var(--primary-light)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--primary-color)'
      }}>
        {icon}
      </div>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</span>
    </div>
    <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)' }}>{value}</h2>
  </div>
);

const UserAdminRow = ({ name, role, status }) => (
  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
    <td style={{ padding: '1rem 0' }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{name}</p>
    </td>
    <td style={{ padding: '1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{role}</td>
    <td style={{ padding: '1rem 0' }}>
      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>{status}</span>
    </td>
  </tr>
);

const HealthItem = ({ label, status, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontWeight: 700 }}>{value} <span style={{ fontSize: '0.7rem', color: '#10b981' }}>({status})</span></span>
  </div>
);

const ReportItem = ({ user, reason, time }) => (
  <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '0.8rem', fontSize: '0.85rem' }}>
    <p style={{ margin: 0, fontWeight: 700 }}>{user} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', float: 'right' }}>{time}</span></p>
    <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)' }}>{reason}</p>
  </div>
);

const TrendingUp = ({ size }) => <BarChart3 size={size} />;

export default AdminDashboard;
