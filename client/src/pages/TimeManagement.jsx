import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, Clock, Bell, Smartphone, Moon, Sun, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api/api';

const TimeManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    quietMode: false,
    dailyLimit: 0,
    breakReminders: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await userAPI.getProfile();
        if (res.data.timeSettings) {
          setSettings(res.data.timeSettings);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await userAPI.updateProfile({ timeSettings: newSettings });
    } catch (err) {
      console.error("Failed to update setting", err);
    }
  };

  const stats = [
    { day: 'M', height: '40%' },
    { day: 'T', height: '60%' },
    { day: 'W', height: '30%' },
    { day: 'T', height: '80%' },
    { day: 'F', height: '95%' },
    { day: 'S', height: '50%' },
    { day: 'S', height: '20%' },
  ];

  if (loading) return <div style={{ paddingTop: '100px', textAlign: 'center' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: '90px', paddingBottom: '50px', maxWidth: '600px', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
        
        {/* Header */}
        <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ margin: 0, fontWeight: 800 }}>Time Management</h2>
        </div>

        <div className="premium-card" style={{ padding: '2rem 1.5rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Average</h4>
            <h1 style={{ margin: '0.5rem 0', fontWeight: 900, fontSize: '2.5rem' }}>48m</h1>
            <p style={{ margin: 0, color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>↓ 12% from last week</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '150px', padding: '0 1rem' }}>
            {stats.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{ width: '12px', height: s.height, background: idx === 4 ? 'var(--primary-color)' : '#e2e8f0', borderRadius: '6px', transition: 'height 1s ease-in-out' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.day}</span>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Manage your time</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <div 
            onClick={() => updateSetting('quietMode', !settings.quietMode)}
            style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Bell size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 700 }}>Quiet Mode</h4>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mute notifications during specific times</p>
            </div>
            {settings.quietMode ? <ToggleRight size={28} color="var(--primary-color)" /> : <ToggleLeft size={28} color="#cbd5e1" />}
          </div>

          <div 
            onClick={() => {
              const limits = [0, 15, 30, 45, 60];
              const currentIndex = limits.indexOf(settings.dailyLimit);
              const nextValue = limits[(currentIndex + 1) % limits.length];
              updateSetting('dailyLimit', nextValue);
            }}
            style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Clock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 700 }}>Set Daily Limit</h4>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Get a reminder when you reach your limit</p>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700 }}>
              {settings.dailyLimit === 0 ? 'Off' : `${settings.dailyLimit}m`}
            </span>
          </div>

          <div 
            onClick={() => updateSetting('breakReminders', !settings.breakReminders)}
            style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}>
              <Smartphone size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 700 }}>Take a Break</h4>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Schedule reminders to take breaks</p>
            </div>
            {settings.breakReminders ? <ToggleRight size={28} color="var(--primary-color)" /> : <ToggleLeft size={28} color="#cbd5e1" />}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TimeManagement;
