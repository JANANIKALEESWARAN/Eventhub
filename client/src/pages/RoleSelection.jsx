import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Shield, ArrowRight } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem', letterSpacing: '-1px' }}>
          Welcome to <span style={{ color: 'var(--primary-color)' }}>EventHub</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '600px' }}>
          An integrated social platform for event promotion, engagement, and professional networking.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '2rem', 
        width: '100%', 
        maxWidth: '1100px' 
      }}>
        <RoleCard 
          title="Participant" 
          description="Discover events, connect with professionals, and join the conversation."
          icon={<Users size={32} />}
          color="var(--primary-color)"
          onClick={() => navigate('/auth/user')}
        />
        <RoleCard 
          title="Coordinator" 
          description="Create events, manage participants, and grow your community."
          icon={<Calendar size={32} />}
          color="#10b981"
          onClick={() => navigate('/auth/coordinator')}
        />
        <RoleCard 
          title="Administrator" 
          description="Maintain platform integrity, manage users, and oversee system health."
          icon={<Shield size={32} />}
          color="#8b5cf6"
          onClick={() => window.location.href = `http://${window.location.hostname}:5174/login`}
        />
      </div>
    </div>
  );
};

const RoleCard = ({ title, description, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="premium-card" 
    style={{ 
      padding: '2.5rem', 
      cursor: 'pointer', 
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '1.5rem',
      border: '1px solid rgba(255,255,255,0.5)',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-10px)';
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.boxShadow = `0 20px 40px -10px ${color}20`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
      e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
    }}
  >
    <div style={{ 
      width: '60px', 
      height: '60px', 
      borderRadius: '16px', 
      background: `${color}10`, 
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
      <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '1.5rem' }}>{description}</p>
    </div>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      fontWeight: 700, 
      color: color,
      marginTop: 'auto'
    }}>
      Get Started <ArrowRight size={18} />
    </div>
  </div>
);

export default RoleSelection;
