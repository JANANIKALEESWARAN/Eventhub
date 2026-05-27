import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportProblem = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Report a Problem</h2>
        </div>
        <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Something not working correctly? Describe the problem below.
        </p>
        <textarea 
          placeholder="What happened?" 
          style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', marginTop: '1rem', outline: 'none' }}
        />
        <button 
          style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 700, marginTop: '1rem', cursor: 'pointer' }}
          onClick={() => { alert('Problem reported. Thank you!'); navigate(-1); }}
        >
          Send Report
        </button>
      </div>
    </div>
  );
};

export default ReportProblem;
