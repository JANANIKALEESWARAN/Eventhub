import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowLeft, Key } from 'lucide-react';
import { authAPI } from '../api/api';

const AdminAuth = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login({ email: formData.email, password: formData.password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: response.data._id,
        name: response.data.name,
        role: response.data.role
      }));
      
      navigate('/admin');
    } catch (error) {
      alert(error.response?.data?.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a', color: 'white' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <Link to="/welcome" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 600, marginBottom: '3rem' }}>
            <ArrowLeft size={18} /> Back to Hub
          </Link>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: '#8b5cf6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)'
            }}>
              <Shield size={32} color="white" />
            </div>
            <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Access</h1>
            <p style={{ color: '#94a3b8' }}>Secure authentication for platform administrators.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label style={labelStyle}>Administrator ID</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={iconStyle} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="admin@eventhub.com" style={inputStyle} required />
              </div>
            </div>

            <div className="input-group">
              <label style={labelStyle}>Security Key</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={iconStyle} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={inputStyle} required />
              </div>
            </div>

            <button type="submit" className="btn-premium" style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem', background: '#8b5cf6', color: 'white', marginTop: '1rem', border: 'none' }} disabled={loading}>
              {loading ? <div className="spinner-small" style={{ borderTopColor: 'white' }}></div> : 'Authorize Access'}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', padding: '1rem', border: '1px solid #1e293b', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.5)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              This area is restricted to authorized personnel only. All access attempts are logged.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Dark Aesthetic */}
      <div style={{ 
        flex: 1.2, 
        background: '#1e293b',
        backgroundImage: 'radial-gradient(circle at 20% 30%, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden'
      }} className="hidden-mobile">
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }}>
           {/* Decorative Grid */}
           <div style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>System <span style={{ color: '#8b5cf6' }}>Governance.</span></h2>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '500px' }}>Oversee the platform's ecosystem, manage security protocols, and ensure a safe community environment.</p>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#cbd5e1' };
const iconStyle = { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' };
const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem 0.85rem 3rem',
  borderRadius: '12px',
  border: '1px solid #334155',
  outline: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s',
  background: '#1e293b',
  color: 'white'
};

export default AdminAuth;
