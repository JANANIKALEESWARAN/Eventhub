import React from 'react';
import Navbar from '../components/Navbar';
import { Users, Shield, Flag, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '3rem' }}>
        <aside style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
          <div style={{ padding: '0.5rem' }}>
            <h4 style={{ padding: '0.8rem 1rem', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Management</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <AdminNavItem to="/admin" icon={<BarChart3 size={18} />} label="System Overview" active={location.pathname === '/admin'} />
              <AdminNavItem to="/admin/users" icon={<Users size={18} />} label="User Management" active={location.pathname === '/admin/users'} />
              <AdminNavItem to="/admin/events" icon={<Shield size={18} />} label="Event Controls" active={location.pathname === '/admin/events'} />
              <AdminNavItem to="/admin/content" icon={<Flag size={18} />} label="Content Reports" active={location.pathname === '/admin/content'} />
              <AdminNavItem to="/admin/settings" icon={<Settings size={18} />} label="General Settings" active={location.pathname === '/admin/settings'} />
            </div>
          </div>
        </aside>
        <main style={{ paddingBottom: '4rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminNavItem = ({ to, icon, label, active }) => (
  <Link to={to} style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    padding: '0.6rem 1rem', 
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--primary-light)' : 'transparent',
    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem',
    textDecoration: 'none',
    transition: 'var(--transition)'
  }}>
    {icon}
    <span>{label}</span>
  </Link>
);

export default AdminLayout;
