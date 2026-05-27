import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { X, Check, ZoomIn, Sliders } from 'lucide-react';

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Contrast', value: 'contrast(150%)' },
  { name: 'Bright', value: 'brightness(120%)' }
];

const ImageEditorModal = ({ file, onClose, onSave }) => {
  const editorRef = useRef(null);
  const [zoom, setZoom] = useState(1.2);
  const [activeFilter, setActiveFilter] = useState('none');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editorRef.current) {
      setIsSaving(true);
      // Get the cropped image canvas from AvatarEditor
      const canvas = editorRef.current.getImageScaledToCanvas();
      
      // Create a new canvas to apply the CSS filter permanently
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const ctx = finalCanvas.getContext('2d');
      
      if (activeFilter !== 'none') {
        ctx.filter = activeFilter;
      }
      ctx.drawImage(canvas, 0, 0);

      // Convert to Blob and send back
      finalCanvas.toBlob((blob) => {
        // Construct a File object from the blob
        const newFile = new File([blob], file.name || 'avatar.jpg', { type: 'image/jpeg' });
        onSave(newFile);
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="premium-card" style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', animation: 'slideUp 0.3s ease' }}>
        
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Edit Photo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          
          <div style={{ filter: activeFilter, borderRadius: '50%', overflow: 'hidden', border: '2px dashed #cbd5e1', padding: '4px' }}>
            <AvatarEditor
              ref={editorRef}
              image={file}
              width={250}
              height={250}
              border={0}
              borderRadius={125}
              color={[255, 255, 255, 0.6]} // RGBA
              scale={zoom}
              rotate={0}
              style={{ borderRadius: '50%' }}
            />
          </div>

          {/* Zoom Control */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ZoomIn size={18} color="#64748b" />
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary-color)' }}
            />
          </div>

          {/* Filters Control */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
              <Sliders size={16} /> Filters
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setActiveFilter(f.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: activeFilter === f.value ? 'none' : '1px solid #e2e8f0',
                    background: activeFilter === f.value ? 'var(--primary-color)' : 'white',
                    color: activeFilter === f.value ? 'white' : '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: '0.2s'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSaving ? 'Saving...' : <><Check size={18} /> Apply</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImageEditorModal;
