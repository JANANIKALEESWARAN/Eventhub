import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const PlaceholderPage = ({ title }) => (
  <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
    <Navbar />
    <div className="container" style={{ paddingTop: '100px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2.5rem' }}>
      <Sidebar />
      <main>
        <div className="premium-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '1rem' }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>This page is coming soon to your Integrated Social Platform.</p>
          <div style={{ marginTop: '2rem', height: '300px', background: '#f8f9fa', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 800, fontSize: '2rem' }}>[ Placeholder Content ]</span>
          </div>
        </div>
      </main>
    </div>
  </div>
);

export const Networking = () => <PlaceholderPage title="Networking" />;
export const Jobs = () => <PlaceholderPage title="Jobs Portal" />;
export const Messages = () => <PlaceholderPage title="Messages & Chat" />;
export const Notifications = () => <PlaceholderPage title="Notifications" />;
