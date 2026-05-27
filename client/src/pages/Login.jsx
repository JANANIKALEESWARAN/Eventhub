import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f0f7fb, #ffffff)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card shadow-lg" style={{ width: '400px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>EventHub</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome to the future of networking</p>
          </div>
          
          <h2 style={{ marginBottom: '1.5rem' }}>{isLogin ? 'Login' : 'Sign Up'}</h2>
          
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" className="glass" style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="John Doe" />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Email Address</label>
              <input type="email" className="glass" style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="name@email.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500 }}>Password</label>
              <input type="password" className="glass" style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', outline: 'none' }} placeholder="••••••••" />
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{isLogin ? 'Sign In' : 'Create Account'}</button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer' }}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
