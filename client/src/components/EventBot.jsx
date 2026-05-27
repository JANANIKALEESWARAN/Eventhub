import React, { useState } from 'react';
import { Send, Bot, X } from 'lucide-react';

const EventBot = ({ eventName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: `Hi! I'm the ${eventName} assistant. How can I help you today?`, isBot: true }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isBot: false }]);
    setInput('');
    
    // Mock bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "That's a great question! Based on the event details, the workshop starts at 10 AM and the materials will be provided on-site. Anything else?", 
        isBot: true 
      }]);
    }, 1000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 2000 }}>
      {isOpen ? (
        <div className="premium-card shadow-lg" style={{ width: '350px', height: '450px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            padding: '1.2rem', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Bot size={24} />
              <div>
                <h4 style={{ margin: 0 }}>Event Assistant</h4>
                <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>Online • Powered by AI</p>
              </div>
            </div>
            <X size={20} cursor="pointer" onClick={() => setIsOpen(false)} />
          </div>
          
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.isBot ? 'flex-start' : 'flex-end',
                background: m.isBot ? '#f1f5f9' : 'var(--primary-color)',
                color: m.isBot ? 'var(--text-primary)' : 'white',
                padding: '0.8rem 1.2rem',
                borderRadius: m.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                maxWidth: '80%',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {m.text}
              </div>
            ))}
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '50px', padding: '0.6rem 1.2rem', outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsOpen(true)}
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0, 119, 181, 0.4)',
            transition: 'var(--transition)'
          }}
          className="hover-scale"
        >
          <Bot size={28} />
        </div>
      )}
      <style>{`
        .hover-scale:hover { transform: scale(1.1); }
      `}</style>
    </div>
  );
};

export default EventBot;
