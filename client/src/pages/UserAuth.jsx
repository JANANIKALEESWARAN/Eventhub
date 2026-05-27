import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { authAPI } from '../api/api';

const UserAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
        response = await authAPI.register({ ...formData, role: 'user' });
      }
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      
      // Destructure to separate token from other user data if needed
      const { token, ...userData } = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      
      navigate('/');
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
        background: 'linear-gradient(45deg, var(--primary-color), var(--secondary-color))',
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
        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>Discover Your Next <span style={{ opacity: 0.8 }}>Professional Milestone.</span></h2>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '500px' }}>Join thousands of participants exploring events, jobs, and networking opportunities tailored for you.</p>
        
        <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>12k+</div>
            <div style={{ opacity: 0.8 }}>Active Users</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>500+</div>
            <div style={{ opacity: 0.8 }}>Live Events</div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p style={{ color: '#64748b' }}>{isLogin ? 'Sign in to your participant account' : 'Join as a participant to explore events'}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!isLogin && (
              <div className="input-group">
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" style={inputStyle} required={!isLogin} />
                </div>
              </div>
            )}

            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@company.com" style={inputStyle} required />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Password</label>
                {isLogin && <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Forgot?</a>}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={inputStyle} required />
              </div>
            </div>

            <button type="submit" className="btn-premium btn-premium-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
              {loading ? <div className="spinner-small" style={{ borderTopColor: 'white' }}></div> : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem 0.85rem 3rem',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  outline: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s'
};

export default UserAuth;
