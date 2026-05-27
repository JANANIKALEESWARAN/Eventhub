import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportInbox = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Support Inbox</h2>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          This is a placeholder Support Inbox page. Add support ticket UI here.
        </p>
      </div>
    </div>
  );
};

export default SupportInbox;
