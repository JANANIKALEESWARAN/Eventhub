import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Camera, Calendar, MapPin, Users, DollarSign, Shield, Cpu, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventAPI } from '../api/api';
import CustomDialog from '../components/CustomDialog';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'online',
    date: '',
    endDate: '',
    time: '',
    endTime: '',
    location: '',
    registrationLimit: '',
    registrationCloseDate: '',
    isApprovalRequired: false,
    isPaid: false,
    price: '',
    requiredSkills: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [roadmap, setRoadmap] = useState([{ day: '', title: '', description: '' }]);

  const [coverMedia, setCoverMedia] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getEventById(id);
        const ev = res.data;
        setFormData({
          title: ev.title || '',
          description: ev.description || '',
          type: ev.type || 'online',
          date: ev.date ? ev.date.split('T')[0] : '',
          endDate: ev.endDate ? ev.endDate.split('T')[0] : '',
          time: ev.time || '',
          endTime: ev.endTime || '',
          location: ev.location || '',
          registrationLimit: ev.registrationLimit || '',
          registrationCloseDate: ev.registrationCloseDate ? ev.registrationCloseDate.split('T')[0] : '',
          isApprovalRequired: ev.isApprovalRequired || false,
          isPaid: ev.isPaid || false,
          price: ev.price || '',
          requiredSkills: ev.requiredSkills ? ev.requiredSkills.join(', ') : '',
          contactPerson: ev.contactPerson || '',
          contactEmail: ev.contactEmail || '',
          contactPhone: ev.contactPhone || ''
        });
        if (ev.roadmap && ev.roadmap.length > 0) {
          setRoadmap(ev.roadmap);
        }
      } catch (err) {
        console.error('Failed to fetch event', err);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCoverMedia(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverMedia(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      const filteredRoadmap = roadmap.filter(item => item.day.trim() || item.title.trim() || item.description.trim());
      data.append('roadmap', JSON.stringify(filteredRoadmap));

      if (coverMedia) {
        data.append('coverMedia', coverMedia);
      }

      await eventAPI.updateEvent(id, data);
      setDialogConfig({ 
        isOpen: true, 
        type: 'alert', 
        title: 'Success', 
        message: 'Event Updated Successfully!', 
        position: 'top',
        onConfirm: () => navigate(`/manage-event/${id}`) 
      });
    } catch (error) {
      setDialogConfig({ isOpen: true, type: 'alert', title: 'Error', message: error.response?.data?.message || 'Failed to update event', onConfirm: closeDialog });
    }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', maxWidth: '800px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Event Management
        </button>

        <div className="premium-card" style={{ padding: '2.5rem' }}>
          <h1 style={{ marginBottom: '2rem', fontWeight: 800 }}>Edit Event</h1>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('coverMediaInput').click()}
              style={{ 
                height: '200px', 
                background: dragActive ? '#e2e8f0' : '#f1f5f9', 
                borderRadius: '12px', 
                border: `2px dashed ${dragActive ? 'var(--primary-color)' : '#cbd5e1'}`, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem', 
                cursor: 'pointer',
                transition: 'all 0.3s',
                overflow: 'hidden'
              }}
            >
              <input 
                id="coverMediaInput"
                type="file" 
                accept="image/*,video/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              {coverMedia ? (
                <img src={URL.createObjectURL(coverMedia)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={40} color={dragActive ? 'var(--primary-color)' : '#94a3b8'} />
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Drag & Drop or Click to Upload New Cover Media (Leaves existing if empty)</span>
                </>
              )}
            </div>

            <div className="input-group">
              <label style={labelStyle}>Event Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Global AI Summit 2026" style={inputStyle} required />
            </div>

            <div className="input-group">
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your event..." style={{ ...inputStyle, height: '120px', resize: 'none' }} required></textarea>
            </div>

            <div className="input-group">
              <label style={labelStyle}>Event Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                <option value="online">Online / Webinar</option>
                <option value="offline">In-Person / Offline</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label style={labelStyle}>Registration Limit</label>
                <input type="number" name="registrationLimit" value={formData.registrationLimit} onChange={handleChange} placeholder="e.g., 100" style={inputStyle} />
              </div>
              <div className="input-group">
                <label style={labelStyle}>Registration Close Date</label>
                <input type="date" name="registrationCloseDate" value={formData.registrationCloseDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label style={labelStyle}>Start Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} style={inputStyle} required />
              </div>
              <div className="input-group">
                <label style={labelStyle}>End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label style={labelStyle}>Start Time</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} style={inputStyle} required />
              </div>
              <div className="input-group">
                <label style={labelStyle}>End Time</label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div className="input-group">
              <label style={labelStyle}>Location / Link</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Venue name or Meeting Link" style={{ ...inputStyle, paddingLeft: '3rem' }} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" name="isApprovalRequired" checked={formData.isApprovalRequired} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Manual Approval
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" name="isPaid" checked={formData.isPaid} onChange={handleChange} style={{ width: '18px', height: '18px' }} /> Paid Event
              </label>
            </div>

            {formData.isPaid && (
              <div className="input-group">
                <label style={labelStyle}>Price (₹)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="e.g., 500" style={{ ...inputStyle, paddingLeft: '3rem' }} required={formData.isPaid} />
                </div>
              </div>
            )}

            <div className="input-group">
              <label style={labelStyle}>Required Skills (comma separated)</label>
              <input type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} placeholder="React, UI Design, Leadership" style={inputStyle} />
            </div>

            <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Contact Information</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact Person Name" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="Contact Email" style={inputStyle} />
                  <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Contact Phone" style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Event Roadmap</h3>
                <button type="button" onClick={() => setRoadmap([...roadmap, { day: '', title: '', description: '' }])} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>+ Add Step</button>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {roadmap.map((item, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                    {roadmap.length > 1 && (
                      <button type="button" onClick={() => setRoadmap(roadmap.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
                    )}
                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                      <input 
                        type="text" 
                        placeholder="Day / Step (e.g., Day 1)" 
                        value={item.day} 
                        onChange={(e) => {
                          const newRoadmap = [...roadmap];
                          newRoadmap[idx].day = e.target.value;
                          setRoadmap(newRoadmap);
                        }}
                        style={inputStyle} 
                      />
                      <input 
                        type="text" 
                        placeholder="Title" 
                        value={item.title} 
                        onChange={(e) => {
                          const newRoadmap = [...roadmap];
                          newRoadmap[idx].title = e.target.value;
                          setRoadmap(newRoadmap);
                        }}
                        style={inputStyle} 
                      />
                      <textarea 
                        placeholder="Short description..." 
                        value={item.description} 
                        onChange={(e) => {
                          const newRoadmap = [...roadmap];
                          newRoadmap[idx].description = e.target.value;
                          setRoadmap(newRoadmap);
                        }}
                        style={{ ...inputStyle, height: '60px', resize: 'none' }}
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-premium btn-premium-primary" style={{ padding: '1rem', justifyContent: 'center', fontSize: '1.1rem', marginTop: '1rem' }}>
              Update Event
            </button>
          </form>
        </div>
      </div>
      <CustomDialog {...dialogConfig} />
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: '#1e293b' };
const inputStyle = {
  width: '100%',
  padding: '0.8rem 1.2rem',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  outline: 'none',
  fontSize: '1rem',
  transition: 'border-color 0.3s',
  background: 'white'
};

export default EditEvent;
