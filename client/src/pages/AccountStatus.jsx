import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, ShieldCheck, AlertCircle, Info, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountStatus = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    { 
      title: "Community Guidelines", 
      status: "No violations", 
      icon: <CheckCircle2 size={20} color="#10b981" />,
      desc: "You haven't posted anything that goes against our community guidelines."
    },
    { 
      title: "Recommendation Guidelines", 
      status: "Eligible", 
      icon: <CheckCircle2 size={20} color="#10b981" />,
      desc: "Your content is eligible to be recommended to people who don't follow you."
    }
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
          <h2 style={{ margin: 0, fontWeight: 800 }}>Account Status</h2>
        </div>

        {checking ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Checking account status...</p>
          </div>
        ) : (
          <>
            <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem', borderTop: '4px solid #10b981' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <ShieldCheck size={32} color="#10b981" />
              </div>
              <h3 style={{ fontWeight: 800, margin: '0 0 0.5rem' }}>Your account is in good standing</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Thank you for following our community guidelines!</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => (
                <div key={idx} className="premium-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    {item.icon}
                    <h4 style={{ margin: 0, fontWeight: 700, flex: 1 }}>{item.title}</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--text-secondary)" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                If you think we've made a mistake, you can request a review of specific content.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AccountStatus;
