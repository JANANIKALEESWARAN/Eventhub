import Navbar from '../components/Navbar';
import AdminLayout from '../components/AdminLayout';
import { ToggleLeft, ToggleRight, Database, Bell, Shield, Wallet, Globe, Cpu } from 'lucide-react';

const SystemSettings = () => {
  return (
    <AdminLayout>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontWeight: 800 }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure platform-wide rules, monetization, and AI thresholds.</p>
      </div>

        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Feature Toggles */}
          <section className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Cpu size={24} color="var(--primary-color)" /> Feature Toggles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <SettingToggle label="Real-time Event Chat" description="Allow participants to chat during live events." enabled={true} />
              <SettingToggle label="AI Event Assistant" description="Global toggle for the automated event chatbot." enabled={true} />
              <SettingToggle label="Premium Subscriptions" description="Enable monetization and exclusive event access." enabled={false} />
            </div>
          </section>

          {/* Security & Moderation */}
          <section className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Shield size={24} color="#ef4444" /> Security & Moderation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>AI Moderation Threshold</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sensitivity for auto-flagging toxic content.</p>
                </div>
                <input type="range" min="0" max="100" defaultValue="75" style={{ width: '200px' }} />
              </div>
              <SettingToggle label="Coordinator Verification" description="Require manual approval for new event coordinators." enabled={true} />
            </div>
          </section>

          {/* Monetization Settings */}
          <section className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Wallet size={24} color="#f59e0b" /> Monetization Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Platform Commission</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Percentage taken from paid event tickets.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="number" defaultValue="10" style={{ width: '60px', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  <span style={{ fontWeight: 700 }}>%</span>
                </div>
              </div>
              <SettingToggle label="Ad-free Premium" description="Allow users to purchase ad-free experience." enabled={true} />
            </div>
          </section>

          {/* Notification Rules */}
          <section className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Bell size={24} color="#8b5cf6" /> Notification Rules
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <SettingToggle label="Email Summaries" description="Send weekly event digests to all users." enabled={true} />
              <SettingToggle label="Push Notifications" description="Global toggle for mobile app push notifications." enabled={true} />
              <SettingToggle label="Critical Alerts" description="Notify admins of high-severity system flags immediately." enabled={true} />
            </div>
          </section>

          {/* Infrastructure */}
          <section className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Database size={24} color="#64748b" /> Infrastructure
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f1f5f9', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={20} color="var(--primary-color)" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Region: North America (US-East)</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Service Operational</p>
                </div>
              </div>
              <button className="btn-premium" style={{ background: 'white', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>Manage Clusters</button>
            </div>
          </section>
        </div>
      </AdminLayout>
  );
};

const SettingToggle = ({ label, description, enabled }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h4 style={{ margin: 0 }}>{label}</h4>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</p>
    </div>
    {enabled ? <ToggleRight size={32} color="var(--primary-color)" cursor="pointer" /> : <ToggleLeft size={32} color="#cbd5e1" cursor="pointer" />}
  </div>
);

export default SystemSettings;
