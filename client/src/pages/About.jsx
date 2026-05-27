import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, Info, Lock, FileText, Shield, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const links = [
    { title: "Privacy Policy", icon: <Lock size={18} />, route: "/privacy" },
    { title: "Terms of Use", icon: <FileText size={18} />, route: "/terms" },
    { title: "Open Source Libraries", icon: <Info size={18} />, route: "/about" },
    { title: "Cookie Policy", icon: <Shield size={18} />, route: "/privacy" },
  ];

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', paddingBottom: '50px', maxWidth: '600px', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>About</h2>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--primary-color)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}>E</span>
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>EventHub</h3>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Version 2.4.0 (Build 892)</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          {links.map((link, idx) => (
            <div 
              key={idx} 
              className="premium-card" 
              style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', marginBottom: '0.5rem', background: 'white', borderRadius: '12px' }}
              onClick={() => navigate(link.route)}
            >
              <div style={{ color: 'var(--text-secondary)' }}>{link.icon}</div>
              <span style={{ flex: 1, fontWeight: 600 }}>{link.title}</span>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Made with <Heart size={14} color="#ef4444" fill="#ef4444" /> for the community
          </p>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            © 2024 EventHub Inc. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
};

export default About;
