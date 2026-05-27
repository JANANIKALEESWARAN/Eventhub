import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { ArrowLeft, HelpCircle, Search, ChevronRight, MessageSquare, Shield, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);

  const sections = [
  { icon: <HelpCircle size={20} color="#3b82f6" />, title: "Help Center", sub: "Find answers and tutorials", route: "/help-center" },
  { icon: <MessageSquare size={20} color="#10b981" />, title: "Support Inbox", sub: "View your support requests", route: "/support" },
  { icon: <Shield size={20} color="#ef4444" />, title: "Report a Problem", sub: "Let us know if something is broken", route: "/report" },
  { icon: <Globe size={20} color="#8b5cf6" />, title: "Safety Center", sub: "Learn about platform safety", route: "/safety" }
];

  const faqs = [
    { q: "How do I save a post?", a: "To save a post, tap the bookmark icon on the bottom right of any post. You can find your saved posts in Settings > Saved." },
    { q: "How do I create an event?", a: "Only coordinators can create events. If you are a coordinator, go to your dashboard and click 'Create New Event'." },
    { q: "Is my profile private?", a: "By default, profiles are public. You can change this in Settings > Account Privacy." },
    { q: "How do I connect with others?", a: "Go to someone's profile and tap 'Connect'. Once they accept, you'll be connected." },
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
          <h2 style={{ margin: 0, fontWeight: 800 }}>Help</h2>
        </div>

        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search help articles..." 
            style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '3rem' }}>
          {sections.map((s, idx) => (
            <div
              key={idx}
              className="premium-card"
              style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
              onClick={() => navigate(s.route)}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontWeight: 700 }}>{s.title}</h4>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.sub}</p>
              </div>
              <ChevronRight size={18} color="#cbd5e1" />
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="premium-card" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{faq.q}</h4>
                {activeFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {activeFaq === idx && (
                <p style={{ margin: '1rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Help;
