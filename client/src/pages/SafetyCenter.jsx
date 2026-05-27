import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SafetyCenter = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Safety Center</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <ShieldCheck size={64} color="var(--primary-color)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ fontWeight: 800 }}>Your Safety Matters</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '1rem auto' }}>
            We are committed to providing a safe and respectful environment for everyone.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Community Guidelines</h4>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Learn what is and isn't allowed on the platform.</p>
          </div>
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '15px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Security Tips</h4>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>How to keep your account secure.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyCenter;
