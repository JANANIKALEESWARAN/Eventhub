import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CustomDialog = ({ isOpen, type, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', position = 'center' }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset input on open
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTop = position === 'top';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: isTop ? 'transparent' : 'rgba(0, 0, 0, 0.5)', 
      zIndex: 99999,
      display: 'flex', justifyContent: 'center', 
      alignItems: isTop ? 'flex-start' : 'center',
      paddingTop: isTop ? '2rem' : '0',
      backdropFilter: isTop ? 'none' : 'blur(4px)',
      pointerEvents: isTop ? 'none' : 'auto' // Allow clicking through backdrop if top (toast-like)
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '1.5rem',
        width: '90%', maxWidth: '400px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: isTop ? 'slideDown 0.3s ease-out forwards' : 'slideUp 0.2s ease-out forwards',
        pointerEvents: 'auto' // Ensure dialog itself is clickable
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 700 }}>{title || 'Notice'}</h3>
          {type !== 'alert' && (
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <p style={{ margin: '0 0 1.25rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {message}
        </p>

        {type === 'prompt' && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1',
              marginBottom: '1.25rem', outline: 'none', fontSize: '1rem'
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => type === 'prompt' ? onConfirm(inputValue) : onConfirm()}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
              background: 'var(--primary-color, #3b82f6)', color: 'white', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CustomDialog;
