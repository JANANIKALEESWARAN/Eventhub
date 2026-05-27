import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Building, Briefcase } from 'lucide-react';
import { authAPI } from '../api/api';

const CoordinatorAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', organization: '', expertise: 'Technology' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({ email: formData.email, password: formData.password });
      } else {
        response = await authAPI.register({ ...formData, role: 'coordinator' });
      }
      
      localStorage.setItem('token', response.data.token);
      const { token, ...userData } = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      navigate('/coordinator');
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      {/* Left Side - Visual */}
      <div style={{ 
        flex: 1, 
        background: 'linear-gradient(45deg, #059669, #10b981)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="hidden-mobile">
        <Link to="/welcome" style={{ position: 'absolute', top: '2rem', left: '2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={20} /> Back
        </Link>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>Empower Your <span style={{ opacity: 0.8 }}>Community.</span></h2>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '500px' }}>Join as a coordinator to create high-impact events, manage workshops, and reach your target audience effectively.</p>
        
        <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>98%</div>
            <div style={{ opacity: 0.8 }}>Satisfaction Rate</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>24/7</div>
            <div style={{ opacity: 0.8 }}>AI Support</div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '450px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="badge" style={{ background: '#d1fae5', color: '#059669', marginBottom: '1rem', display: 'inline-block' }}>Coordinator Portal</div>
            <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '0.5rem' }}>{isLogin ? 'Partner Login' : 'Create Partner Account'}</h1>
            <p style={{ color: '#64748b' }}>Manage your events and community efficiently.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={iconStyle} />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" style={inputStyle} required />
                  </div>
                </div>
                <div className="input-group">
                  <label style={labelStyle}>Organization</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={18} style={iconStyle} />
                    <input type="text" name="organization" value={formData.organization} onChange={handleChange} placeholder="TechCorp" style={inputStyle} required />
                  </div>
                </div>
              </div>
            )}

            <div className="input-group">
              <label style={labelStyle}>Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={iconStyle} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="coordinator@org.com" style={inputStyle} required />
              </div>
            </div>

            <div className="input-group">
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={iconStyle} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={inputStyle} required />
              </div>
            </div>

            {!isLogin && (
              <div className="input-group">
                <label style={labelStyle}>Area of Expertise</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={iconStyle} />
                  <select name="expertise" value={formData.expertise} onChange={handleChange} style={inputStyle} required>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="btn-premium" style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem', background: '#059669', color: 'white', marginTop: '1rem' }} disabled={loading}>
              {loading ? <div className="spinner-small" style={{ borderTopColor: 'white' }}></div> : (isLogin ? 'Sign In' : 'Join as Coordinator')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>
              {isLogin ? "Interested in organizing?" : "Already a coordinator?"}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                {isLogin ? 'Join Now' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' };
const iconStyle = { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem 0.85rem 3rem',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  outline: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s',
  background: 'white'
};

export default CoordinatorAuth;
