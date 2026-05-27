import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PrivacyTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>{isPrivacy ? 'Privacy Policy' : 'Terms of Use'}</h2>
        </div>
        <div style={{ marginTop: '2rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          <p>Last updated: May 2024</p>
          <p>This is a placeholder for the {isPrivacy ? 'Privacy Policy' : 'Terms of Use'}.</p>
          <p>We take your {isPrivacy ? 'data privacy' : 'usage terms'} seriously. Full legal text will be provided here in the production version.</p>
          
          <h3 style={{ marginTop: '2rem' }}>1. Introduction</h3>
          <p>Welcome to EventHub. By using our services, you agree to our policies.</p>
          
          <h3 style={{ marginTop: '2rem' }}>2. Your Data</h3>
          <p>We collect and process your data to provide a better social experience.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTerms;
