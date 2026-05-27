import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, TrendingUp, Bell, Settings, ArrowUpRight, BarChart3, MessageSquare, LogOut, ArrowLeft } from 'lucide-react';
import { userAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';


const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'overview';
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified avatar URL helper - handles all path variations consistently
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    const SERVER_IP = (window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor')) ? '10.174.30.15' : window.location.hostname;
    const cleanPath = avatarPath.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/');
    return `http://${SERVER_IP}:5000/uploads/${cleanPath}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await userAPI.getProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== activeTab) {
      params.set('tab', activeTab);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [activeTab]);

  // Inject coordinator-specific styles and clean up on unmount
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-id', 'coordinator-styles');
    styleTag.innerHTML = `
      .mobile-bottom-bar {
        display: none;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid var(--border-color);
        padding: 0.5rem;
        z-index: 1000;
        box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
      }
      .mobile-top-bar { display: none !important; }
      .coordinator-table-mobile { display: none; }
      @media (max-width: 768px) {
        .desktop-sidebar { display: none !important; }
        .desktop-navbar { display: none !important; }
        .mobile-top-bar { display: flex !important; }
        .mobile-bottom-bar { display: flex; justify-content: space-around; }
        .coordinator-container {
          grid-template-columns: 1fr !important;
          padding-top: 80px !important;
          padding-bottom: 80px !important;
        }
        .stats-grid-overview { gap: 0.6rem !important; }
        .stats-grid-overview > div { padding: 0.75rem !important; }
        .chart-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
        .chart-grid .premium-card { padding: 1rem !important; }
        .coordinator-table-desktop { display: none !important; }
        .coordinator-table-mobile { display: block !important; }
        .event-detail-card {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 0.6rem !important;
          padding: 1rem !important;
        }
        .event-detail-card > div:last-child {
          width: 100%;
          justify-content: space-between !important;
          padding-left: 0 !important;
          border-left: none !important;
        }
        .analytics-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
        .analytics-grid > div { padding: 1rem !important; }
        .participant-avatars { flex-wrap: wrap !important; overflow-x: visible !important; }
        .premium-card { padding: 1rem !important; }
        .mobile-event-card {
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          background: white;
        }
        .mobile-event-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .mobile-event-card-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .mobile-event-card-row:last-child { border-bottom: none; }
        .event-detail-card {
          position: relative;
        }
        @media (max-width: 640px) {
          .event-detail-card {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
          }
          .event-detail-card .stats-group {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
            width: 100% !important;
            border-top: 1px solid var(--border-color);
            padding-top: 1rem;
          }
          .event-detail-card .stats-item {
            text-align: left !important;
            border-left: none !important;
            padding-left: 0 !important;
          }
          .event-detail-card .manage-btn {
            width: 100% !important;
          }
        }
      }
    `;
    document.head.appendChild(styleTag);
    // Cleanup: remove the style tag when leaving the coordinator dashboard
    return () => {
      const existing = document.querySelector('style[data-id="coordinator-styles"]');
      if (existing) existing.remove();
    };
  }, []);

  if (loading) return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading Dashboard...</div>;

  const createdEvents = profile?.createdEvents || [];
  const totalJoins = createdEvents.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0);

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Mobile Top App Bar */}
      <div className="mobile-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', height: '60px', background: 'white', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, borderBottom: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ color: 'var(--primary-color)', fontSize: '1.4rem', margin: 0, fontWeight: 800, lineHeight: 1 }}>EventHub</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/profile">
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {profile?.avatar ? (
                <img
                  src={getAvatarUrl(profile.avatar)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (profile?.name?.[0] || 'C')}
            </div>
          </Link>
        </div>
      </div>

      <div className="container coordinator-container" style={{ paddingTop: '100px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem' }}>
        {/* Sidebar Mini */}
        <aside className="desktop-sidebar" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
          <div style={{ padding: '0.5rem' }}>
            <h4 style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Management</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <DashTab icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <DashTab icon={<Calendar size={18} />} label="My Events" active={activeTab === 'my-events'} onClick={() => setActiveTab('my-events')} />
              <DashTab icon={<Users size={18} />} label="Participants" active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} />
              <DashTab icon={<BarChart3 size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <DashTab icon={<Bell size={18} />} label="Announcements" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} />
              <DashTab icon={<Settings size={18} />} label="Dashboard Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
              <Link to="/settings" style={{ textDecoration: 'none' }}>
                <div className="dash-tab" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '10px', color: '#64748b', fontWeight: 600 }}>
                  <Settings size={18} />
                  <span>App Settings</span>
                </div>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Bottom App Bar */}
        <div className="mobile-bottom-bar">
          <DashTab icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} isMobile />
          <DashTab icon={<Calendar size={20} />} label="Events" active={activeTab === 'my-events'} onClick={() => setActiveTab('my-events')} isMobile />
          <DashTab icon={<Users size={20} />} label="Users" active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} isMobile />
          <DashTab icon={<Bell size={20} />} label="Announce" active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} isMobile />
          <DashTab icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isMobile />
        </div>

        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={28} />
              </button>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)' }}>
                {activeTab === 'overview' && 'Coordinator Overview'}
                {activeTab === 'my-events' && 'My Events'}
                {activeTab === 'participants' && 'Event Participants'}
                {activeTab === 'analytics' && 'Performance Analytics'}
                {activeTab === 'announcements' && 'Event Announcements'}
                {activeTab === 'settings' && 'Dashboard Settings'}
              </h1>
            </div>
            {activeTab === 'my-events' && (
              <Link to="/create-event">
                <button className="btn-premium btn-premium-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>+ Create Event</button>
              </Link>
            )}
          </div>

          {activeTab === 'overview' && (() => {
            // ── Derived chart data ──
            const activeCount = createdEvents.filter(e => e.isApproved && !e.isRejected).length;
            const rejectedCount = createdEvents.filter(e => e.isRejected).length;
            const pendingCount = createdEvents.length - activeCount - rejectedCount;

            const statusData = [
              { name: 'Active', value: activeCount || 0 },
              { name: 'Pending', value: pendingCount || 0 },
              { name: 'Rejected', value: rejectedCount || 0 },
            ];
            const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

            const barData = createdEvents.slice(0, 8).map(e => ({
              name: e.title?.length > 12 ? e.title.slice(0, 12) + '…' : (e.title || 'Event'),
              Participants: e.participants?.length || 0,
              Limit: e.registrationLimit || 0,
            }));

            // Build monthly joins trend from event dates
            const monthMap = {};
            createdEvents.forEach(e => {
              const d = new Date(e.date);
              const key = d.toLocaleString('default', { month: 'short' });
              monthMap[key] = (monthMap[key] || 0) + (e.participants?.length || 0);
            });
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const areaData = months
              .filter(m => monthMap[m] !== undefined)
              .map(m => ({ month: m, Joins: monthMap[m] }));
            if (areaData.length === 0) {
              months.slice(-4).forEach(m => areaData.push({ month: m, Joins: 0 }));
            }

            return (
              <>
                {/* Stats Grid — 2 col on mobile, 4 col on desktop */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }} className="stats-grid-overview">
                  <StatCard label="Total Joins" value={totalJoins} />
                  <StatCard label="Total Events" value={createdEvents.length} />
                  <StatCard label="Active Events" value={activeCount} color="#10b981" />
                  <StatCard label="Reputation" value={profile?.reputation || 0} />
                </div>

                {/* Row 1: Bar chart + Donut chart — Pure SVG/CSS */}
                <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                  {/* Participants per Event — CSS Bar Chart */}
                  <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BarChart3 size={18} color="var(--primary-color)" /> Participants per Event
                    </h3>
                    {barData.length > 0 ? (() => {
                      const maxVal = Math.max(...barData.map(d => Math.max(d.Participants, d.Limit || 0)), 1);
                      return (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '180px', padding: '0 4px' }}>
                          {barData.map((d, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d.Participants}</span>
                              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                {d.Limit > 0 && (
                                  <div style={{ width: '70%', height: `${(d.Limit / maxVal) * 130}px`, background: '#e0e7ff', borderRadius: '3px 3px 0 0', minHeight: '4px' }} />
                                )}
                                <div style={{ width: '100%', height: `${(d.Participants / maxVal) * 130}px`, background: 'var(--primary-color)', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.5s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2, maxWidth: '100%' }}>{d.name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })() : (
                      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No events yet</div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', justifyContent: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ width: 10, height: 10, background: 'var(--primary-color)', borderRadius: 2, display: 'inline-block' }} />Enrolled</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}><span style={{ width: 10, height: 10, background: '#e0e7ff', borderRadius: 2, display: 'inline-block' }} />Limit</span>
                    </div>
                  </div>

                  {/* Event Status — SVG Donut Chart */}
                  <div className="premium-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={18} color="#10b981" /> Event Status
                    </h3>
                    {(() => {
                      const total = activeCount + pendingCount + rejectedCount || 1;
                      const activePct = (activeCount / total) * 100;
                      const pendingPct = (pendingCount / total) * 100;
                      const r = 60, cx = 90, cy = 90, circ = 2 * Math.PI * r;
                      const activeDash = (activePct / 100) * circ;
                      const pendingDash = (pendingPct / 100) * circ;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <svg viewBox="0 0 180 180" width="160" height="160">
                            {/* Rejected (Background/Base) */}
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth="22" />
                            {/* Pending */}
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth="22"
                              strokeDasharray={`${pendingDash + activeDash} ${circ - (pendingDash + activeDash)}`} strokeDashoffset={0} strokeLinecap="round"
                              transform={`rotate(-90 ${cx} ${cy})`} />
                            {/* Active */}
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth="22"
                              strokeDasharray={`${activeDash} ${circ - activeDash}`} strokeDashoffset={0} strokeLinecap="round"
                              transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{activeCount}</text>
                            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">Active</text>
                          </svg>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><span style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />Active ({activeCount})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><span style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />Pending ({pendingCount})</span>
                            {rejectedCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />Rejected ({rejectedCount})</span>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Row 2: Monthly Joins Trend — Pure SVG Line/Area Chart */}
                <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="#6366f1" /> Monthly Joins Trend
                  </h3>
                  {(() => {
                    const W = 500, H = 160, padL = 30, padR = 10, padT = 10, padB = 30;
                    const chartW = W - padL - padR, chartH = H - padT - padB;
                    const maxY = Math.max(...areaData.map(d => d.Joins), 1);
                    const pts = areaData.map((d, i) => ({
                      x: padL + (i / Math.max(areaData.length - 1, 1)) * chartW,
                      y: padT + chartH - (d.Joins / maxY) * chartH,
                      label: d.month, val: d.Joins
                    }));
                    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                    const areaPath = pts.length > 0
                      ? `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(padT + chartH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + chartH).toFixed(1)} Z`
                      : '';
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                          <line key={i} x1={padL} y1={padT + chartH * (1 - t)} x2={W - padR} y2={padT + chartH * (1 - t)}
                            stroke="#f1f5f9" strokeWidth="1" />
                        ))}
                        {/* Area fill */}
                        {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
                        {/* Line */}
                        {linePath && <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
                        {/* Dots + labels */}
                        {pts.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
                            {p.val > 0 && <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#4f46e5" fontWeight="700">{p.val}</text>}
                          </g>
                        ))}
                        {/* Y axis labels */}
                        {[0, Math.round(maxY / 2), maxY].map((v, i) => (
                          <text key={i} x={padL - 4} y={padT + chartH - (v / maxY) * chartH + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

                {/* Row 3: Event Fill Rate progress bars */}
                {createdEvents.length > 0 && (
                  <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} color="#f59e0b" /> Event Fill Rate
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {createdEvents.slice(0, 5).map(event => {
                        const enrolled = event.participants?.length || 0;
                        const limit = event.registrationLimit || 0;
                        const pct = limit > 0 ? Math.min(100, Math.round((enrolled / limit) * 100)) : (enrolled > 0 ? 100 : 0);
                        const barColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
                        return (
                          <div key={event._id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{enrolled}{limit > 0 ? `/${limit}` : ''} ({pct}%)</span>
                            </div>
                            <div style={{ height: '8px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '10px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Current Events Table */}
                <div className="premium-card">
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Current Events</h3>
                    <button onClick={() => setActiveTab('my-events')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}>View All</button>
                  </div>
                  <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <table className="coordinator-table-desktop" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <th style={{ paddingBottom: '1rem' }}>EVENT NAME</th>
                          <th style={{ paddingBottom: '1rem' }}>DATE</th>
                          <th style={{ paddingBottom: '1rem' }}>STATUS</th>
                          <th style={{ paddingBottom: '1rem' }}>PARTICIPANTS</th>
                          <th style={{ paddingBottom: '1rem' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdEvents.map(event => (
                          <EventRow
                            key={event._id}
                            id={event._id}
                            name={event.title}
                            date={new Date(event.date).toLocaleDateString()}
                            status={event.isRejected ? 'Rejected' : (event.isApproved ? 'Active' : 'Pending')}
                            count={`${event.participants?.length || 0}/${event.registrationLimit || '∞'}`}
                          />
                        ))}
                      </tbody>
                    </table>
                    <div className="coordinator-table-mobile">
                      {createdEvents.map(event => (
                        <div key={event._id} className="mobile-event-card">
                          <div className="mobile-event-card-header">
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.title}</span>
                            <span style={{ 
                              background: event.isRejected ? '#fee2e2' : (event.isApproved ? '#dcfce7' : '#fef3c7'), 
                              color: event.isRejected ? '#991b1b' : (event.isApproved ? '#166534' : '#92400e'), 
                              fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 
                            }}>
                              {event.isRejected ? 'Rejected' : (event.isApproved ? 'Active' : 'Pending')}
                            </span>
                          </div>
                          <div className="mobile-event-card-row">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Date</span>
                            <span style={{ fontWeight: 500 }}>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="mobile-event-card-row">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Participants</span>
                            <span style={{ fontWeight: 500 }}>{event.participants?.length || 0}/{event.registrationLimit || '∞'}</span>
                          </div>
                          <div style={{ marginTop: '0.5rem' }}>
                            <Link to={`/manage-event/${event._id}`} style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                              Manage Event →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {activeTab === 'my-events' && <MyEventsView events={createdEvents} />}
          {activeTab === 'participants' && <ParticipantsView events={createdEvents} />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'announcements' && <AnnouncementsView events={createdEvents} />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

const MyEventsView = ({ events }) => (
  <div className="premium-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
    <div style={{ display: 'grid', gap: '1rem' }}>
      {events.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>You haven't created any events yet.</p>
      ) : (
        events.map(event => {
          const isUnlimited = !event.registrationLimit || event.registrationLimit === 0;
          const availableSeats = isUnlimited ? 'Unlimited' : event.registrationLimit - (event.participants?.length || 0);

          return (
            <EventDetailCard 
              key={event._id}
              id={event._id}
              name={event.title} 
              date={new Date(event.date).toLocaleDateString() + (event.endDate ? ` - ${new Date(event.endDate).toLocaleDateString()}` : '')} 
              status={event.isApproved ? 'Active' : 'Pending'} 
              participants={event.participants?.length || 0} 
              limit={event.registrationLimit || '∞'} 
              available={availableSeats}
            />
          );
        })
      )}
    </div>
  </div>
);

const ParticipantsView = ({ events }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {events.length === 0 ? (
      <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No events found to track participants.</div>
    ) : (
      events.map(event => (
        <ParticipantGroup
          key={event._id}
          eventName={event.title}
          count={event.participants?.length || 0}
          participants={event.participants || []}
        />
      ))
    )}
  </div>
);

const AnalyticsView = () => (
  <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
    <div className="premium-card" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><BarChart3 size={20} color="var(--primary-color)" /> Conversion Rate</h3>
      <div style={{ height: '200px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Chart Placeholder</div>
    </div>
    <div className="premium-card" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Users size={20} color="#10b981" /> Attendee Growth</h3>
      <div style={{ height: '200px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Chart Placeholder</div>
    </div>
  </div>
);

const AnnouncementsView = ({ events }) => {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const selectedEvent = events.find(e => e._id === selectedEventId);
  const participantCount = selectedEvent?.participants?.length || 0;

  const handleSendNotification = async () => {
    if (!selectedEventId || !message.trim()) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Please select an event and enter a message', onConfirm: closeDialog });
      return;
    }

    setSending(true);
    setSuccess('');
    try {
      const response = await fetch(`http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost' : window.location.hostname}:5000/api/events/${selectedEventId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setMessage('');
      } else {
        setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: data.message || 'Failed to send notification', onConfirm: closeDialog });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: 'Failed to send notification', onConfirm: closeDialog });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="premium-card" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Send Event Notification</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Event Selector */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '1rem',
              outline: 'none',
              background: 'white'
            }}
          >
            <option value="">-- Choose an event --</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>
                {event.title} ({event.participants?.length || 0} participants)
              </option>
            ))}
          </select>
        </div>

        {/* Message Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Notification Message
          </label>
          <textarea
            placeholder="Enter your notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              height: '120px',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              outline: 'none',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Participant Count Info */}
        {selectedEvent && (
          <div style={{
            padding: '1rem',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            fontSize: '0.9rem',
            color: '#0369a1'
          }}>
            <strong>{participantCount}</strong> participant{participantCount !== 1 ? 's' : ''} will receive this notification
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendNotification}
          disabled={!selectedEventId || !message.trim() || sending}
          className="btn-premium btn-premium-primary"
          style={{
            opacity: (!selectedEventId || !message.trim() || sending) ? 0.5 : 1,
            cursor: (!selectedEventId || !message.trim() || sending) ? 'not-allowed' : 'pointer'
          }}
        >
          {sending ? 'Sending...' : 'Send Notification'}
        </button>

        {/* Success Message */}
        {success && (
          <div style={{
            padding: '1rem',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}
      </div>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

const SettingsView = () => (
  <div className="premium-card" style={{ padding: '2rem' }}>
    <h3 style={{ marginBottom: '1.5rem' }}>Dashboard Configuration</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DashboardToggle label="Auto-Approve Requests" description="Automatically approve join requests for all events." enabled={false} />
      <DashboardToggle label="Weekly Performance Report" description="Receive a summary of event engagement every Monday." enabled={true} />
      <DashboardToggle label="Public Organizer Profile" description="Allow users to see your success score and past events." enabled={true} />
    </div>
  </div>
);

const EventDetailCard = ({ id, name, date, status, participants, limit, available }) => (
  <div className="event-detail-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'white', gap: '1rem' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h4>
      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{date} • <span style={{ color: status === 'Active' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{status}</span></p>
    </div>
    <div className="stats-group" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div className="stats-item" style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: available === 0 ? '#ef4444' : 'var(--text-primary)' }}>
          {available === 'Unlimited' ? '∞' : available}
        </div>
        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Available</p>
      </div>
      <div className="stats-item" style={{ textAlign: 'right', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{participants}/{limit}</div>
        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Enrolled</p>
      </div>
      <Link 
        to={`/manage-event/${id}`} 
        className="btn-premium btn-premium-primary manage-btn" 
        style={{ 
          fontSize: '0.8rem', 
          padding: '0.5rem 1rem',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '90px'
        }}
      >
        Manage
      </Link>
    </div>
  </div>
);

const ParticipantGroup = ({ eventName, count, participants }) => {
  const handleExportCSV = () => {
    if (participants.length === 0) return;
    
    const headers = ['Name', 'Email'];
    const csvRows = [headers.join(',')];
    
    participants.forEach(p => {
      const isObject = typeof p === 'object' && p !== null;
      const name = isObject ? (p.name || 'Unknown') : 'Unknown';
      const email = isObject ? (p.email || 'N/A') : 'N/A';
      csvRows.push(`"${name}","${email}"`);
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `${eventName.replace(/\s+/g, '_')}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="premium-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h4 style={{ margin: 0 }}>{eventName}</h4>
        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>{count} Enrolled</span>
      </div>

      {participants.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No participants yet.</p>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            onClick={handleExportCSV}
            className="btn-premium btn-premium-primary"
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
          >
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );
};

const AnnouncementItem = ({ text, date }) => (
  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{text}</p>
    <span style={{ fontSize: '0.75rem', color: '#888' }}>{date}</span>
  </div>
);

const DashboardToggle = ({ label, description, enabled }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h4 style={{ margin: 0 }}>{label}</h4>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</p>
    </div>
    <div style={{ width: '45px', height: '22px', background: enabled ? 'var(--primary-color)' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer' }}>
      <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: enabled ? '25px' : '2px', transition: 'all 0.3s' }}></div>
    </div>
  </div>
);

const StatCard = ({ label, value, growth, color }) => (
  <div className="premium-card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'none', textAlign: 'center' }}>
    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
      <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', color: color || 'var(--text-primary)' }}>{value}</h2>
      {growth && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{growth}</span>}
    </div>
  </div>
);

const DashTab = ({ icon, label, active, onClick, isMobile }) => {
  if (isMobile) {
    return (
      <div onClick={onClick} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '0.3rem', 
        padding: '0.5rem', 
        color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
        fontWeight: active ? 700 : 500,
        fontSize: '0.7rem',
        cursor: 'pointer',
        transition: 'var(--transition)',
        flex: 1
      }}>
        <div style={{ 
          background: active ? 'var(--primary-light)' : 'transparent',
          padding: '0.4rem 1.2rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition)'
        }}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem', 
      padding: '0.6rem 1rem', 
      borderRadius: 'var(--radius-sm)',
      background: active ? 'var(--primary-light)' : 'transparent',
      color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
      fontWeight: active ? 600 : 500,
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'var(--transition)'
    }}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

const EventRow = ({ id, name, date, status, count }) => (
  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
    <td style={{ padding: '1.2rem 0', fontWeight: 700 }}>{name}</td>
    <td style={{ padding: '1.2rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{date}</td>
    <td style={{ padding: '1.2rem 0' }}>
      <span className="badge" style={{ 
        background: status === 'Rejected' ? '#fee2e2' : (status === 'Active' ? '#dcfce7' : '#f1f5f9'), 
        color: status === 'Rejected' ? '#991b1b' : (status === 'Active' ? '#166534' : '#64748b') 
      }}>{status}</span>
    </td>
    <td style={{ padding: '1.2rem 0', fontWeight: 600 }}>{count}</td>
    <td style={{ padding: '1.2rem 0' }}>
      <Link 
        to={`/manage-event/${id}`} 
        style={{ 
          color: 'var(--primary-color)', 
          fontWeight: 700, 
          textDecoration: 'none',
          fontSize: '0.85rem',
          padding: '0.4rem 0.8rem',
          borderRadius: '4px',
          background: 'var(--primary-light)',
          transition: 'var(--transition)'
        }}
        onMouseOver={(e) => e.target.style.background = '#e0e7ff'}
        onMouseOut={(e) => e.target.style.background = 'var(--primary-light)'}
      >
        Manage
      </Link>
    </td>
  </tr>
);

export default CoordinatorDashboard;
