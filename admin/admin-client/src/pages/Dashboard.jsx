import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Calendar, LogOut, BarChart3, Settings, CheckCircle, XCircle, Clock, Activity, Flag, LayoutDashboard } from 'lucide-react';
import CustomDialog from '../components/CustomDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    pendingEvents: 0,
    coordinators: 0
  });
  const [pendingEvents, setPendingEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const SERVER_IP = '10.174.30.15';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const [statsRes, eventsRes, usersRes, reportsRes, healthRes] = await Promise.all([
        fetch(`http://${SERVER_IP}:5001/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://${SERVER_IP}:5001/api/admin/events/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://${SERVER_IP}:5001/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://${SERVER_IP}:5001/api/admin/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://${SERVER_IP}:5001/api/admin/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setPendingEvents(eventsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://${SERVER_IP}:5001/api/admin/events/${eventId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchDashboardData();
        setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Event approved successfully', position: 'top', onConfirm: closeDialog });
      } else {
        setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to approve event', position: 'top', onConfirm: closeDialog });
      }
    } catch (error) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to approve event', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleRejectEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://${SERVER_IP}:5001/api/admin/events/${eventId}/reject`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchDashboardData();
        setDialogConfig({ isOpen: true, type: 'alert', title: 'Success', message: 'Event rejected successfully', position: 'top', onConfirm: closeDialog });
      } else {
        setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to reject event', position: 'top', onConfirm: closeDialog });
      }
    } catch (error) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to reject event', position: 'top', onConfirm: closeDialog });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = `http://${SERVER_IP}:5173/welcome`;
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'users' ? users : pendingEvents;
    const csvContent = "data:text/csv;charset=utf-8,"
      + (activeTab === 'users'
          ? "ID,Name,Email,Role,Date\n" + users.map(u => `${u._id},${u.name},${u.email},${u.role},${u.createdAt}`).join("\n")
          : "ID,Title,Coordinator,Date\n" + pendingEvents.map(e => `${e._id},${e.title},${e.coordinator?.name},${e.date}`).join("\n"));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Admin Dashboard...</div>;
  }

  const coordinators = users.filter(u => u.role === 'coordinator');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Admin Portal</h1>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', color: '#64748b' }}>
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }} className="admin-main">
        {/* Tabs */}
        <div className="desktop-tabs" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>User Management</TabButton>
          <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')}>Event Moderation</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Flagged Posts</TabButton>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Actions */}
            <div className="admin-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Admin Command Center</h2>
                <p style={{ color: '#64748b', marginTop: '0.25rem' }}>System overview and platform governance</p>
              </div>
              <div className="admin-header-buttons" style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={fetchDashboardData} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  System Health: {health?.status || 'Stable'}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
              <StatCard icon={<Users size={24} color="#3b82f6" />} label="Total Users" value={stats.users} />
              <StatCard icon={<Shield size={24} color="#10b981" />} label="Coordinators" value={stats.coordinators} />
              <StatCard icon={<Calendar size={24} color="#f59e0b" />} label="Total Events" value={stats.events} />
              <StatCard icon={<Clock size={24} color="#8b5cf6" />} label="Pending Events" value={stats.pendingEvents} />
            </div>
            <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Activity Trend Chart */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="#667eea" /> Platform Activity (Weekly)
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Mon', events: 4, users: 12, reports: 2 },
                      { name: 'Tue', events: 3, users: 18, reports: 1 },
                      { name: 'Wed', events: 7, users: 24, reports: 4 },
                      { name: 'Thu', events: 5, users: 15, reports: 0 },
                      { name: 'Fri', events: 8, users: 30, reports: 5 },
                      { name: 'Sat', events: 12, users: 45, reports: 2 },
                      { name: 'Sun', events: 10, users: 35, reports: 1 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="New Users" />
                      <Line type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Events Created" />
                      <Line type="monotone" dataKey="reports" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Reports" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* User Demographics & Health */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>User Distribution</h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Regular Users', value: stats.users - stats.coordinators || 1 },
                            { name: 'Coordinators', value: stats.coordinators || 1 }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>Platform Health</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <HealthItem label="Database" status={health?.db || 'Stable'} value={health?.db === 'Connected' ? 'Online' : 'Offline'} />
                    <HealthItem label="API Uptime" status="Active" value={`${Math.round(health?.uptime || 0)}s`} />
                    <HealthItem label="Server Memory" status="Normal" value={health?.memory || 'N/A'} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pending Events Summary */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Clock size={22} color="#f59e0b" />
                  Needs Attention: Event Approvals
                </h3>
                <button onClick={() => setActiveTab('events')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>View All</button>
              </div>

              {pendingEvents.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>All caught up! No pending events.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {pendingEvents.slice(0, 3).map(event => (
                    <div key={event._id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{event.coordinator?.name || 'Unknown'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          onClick={() => {
                            setDialogConfig({
                              isOpen: true,
                              type: 'confirm',
                              title: 'Approve Event',
                              message: 'Are you sure you want to approve this event?',
                              confirmText: 'Approve',
                              onCancel: closeDialog,
                              onConfirm: () => { handleApproveEvent(event._id); closeDialog(); }
                            });
                          }}
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', background: '#10b981', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => {
                            setDialogConfig({
                              isOpen: true,
                              type: 'confirm',
                              title: 'Reject Event',
                              message: 'Are you sure you want to reject this event?',
                              confirmText: 'Reject',
                              onCancel: closeDialog,
                              onConfirm: () => { handleRejectEvent(event._id); closeDialog(); }
                            });
                          }}
                          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>User Management</h3>
              <button onClick={handleExport} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Export Users</button>
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ paddingBottom: '1rem' }}>USER</th>
                    <th style={{ paddingBottom: '1rem' }}>ROLE</th>
                    <th style={{ paddingBottom: '1rem' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '1rem 0' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{user.email}</p>
                      </td>
                      <td style={{ padding: '1rem 0', fontSize: '0.85rem', color: '#64748b' }}>{user.role}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{ background: '#dbeafe', color: '#3b82f6', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Event Moderation</h3>
              <button onClick={handleExport} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Export Events</button>
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                    <th style={{ paddingBottom: '1rem' }}>EVENT TITLE</th>
                    <th style={{ paddingBottom: '1rem' }}>COORDINATOR</th>
                    <th style={{ paddingBottom: '1rem' }}>REPORTS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEvents.map(event => (
                    <tr key={event._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '1.2rem 0', fontWeight: 700 }}>{event.title}</td>
                      <td style={{ padding: '1.2rem 0', fontSize: '0.9rem' }}>{event.coordinator?.name || 'Unknown'}</td>
                      <td style={{ padding: '1.2rem 0' }}>
                        <span style={{ background: '#fee2e2', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {reports.filter(r => r.targetId === event._id).length} Reports
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Flagged Posts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.filter(r => r.targetType === 'Post').slice(0, 10).map(report => (
                <div key={report._id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{report.reason}</span>
                    <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Flagged Post</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Reporter: {report.reporter?.name}</p>
                </div>
              ))}
              {reports.filter(r => r.targetType === 'Post').length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No flagged posts found.</p>}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="mobile-tabbar">
        <button className={`mobile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </button>
        <button className={`mobile-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={20} />
          <span>Users</span>
        </button>
        <button className={`mobile-tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <Calendar size={20} />
          <span>Events</span>
        </button>
        <button className={`mobile-tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <Flag size={20} />
          <span>Flagged</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mobile-tabbar { display: none; }
        @media (max-width: 768px) {
          .desktop-tabs { display: none !important; }
          .mobile-tabbar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid #e2e8f0;
            z-index: 1000;
            justify-content: space-around;
            padding: 0.5rem 0;
            padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
          }
          .mobile-tab-btn {
            background: none;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: #64748b;
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            flex: 1;
          }
          .mobile-tab-btn.active {
            color: #667eea;
          }
          main.admin-main {
            padding: 1rem !important;
            padding-bottom: 80px !important;
          }
          .admin-header-actions {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .admin-header-buttons {
            width: 100%;
            justify-content: stretch;
          }
          .admin-header-buttons > button {
            flex: 1;
            text-align: center;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .chart-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <CustomDialog {...dialogConfig} />
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ width: '50px', height: '50px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{value}</p>
    </div>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      padding: '1rem 0',
      borderBottom: active ? '3px solid #667eea' : '3px solid transparent',
      color: active ? '#667eea' : '#64748b',
      fontWeight: active ? 700 : 600,
      cursor: 'pointer',
      fontSize: '0.95rem'
    }}
  >
    {children}
  </button>
);

const HealthItem = ({ label, status, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <span style={{ fontWeight: 700 }}>{value} <span style={{ fontSize: '0.7rem', color: '#10b981' }}>({status})</span></span>
  </div>
);

export default Dashboard;
