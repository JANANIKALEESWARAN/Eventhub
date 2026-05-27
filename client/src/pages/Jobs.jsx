import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { Briefcase, MapPin, DollarSign, Clock, Bookmark, Filter, Search, Globe, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { userAPI, jobAPI } from '../api/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobType, setJobType] = useState('');
  const [isRemote, setIsRemote] = useState('');
  const [area, setArea] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [category, setCategory] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  const fetchProfileAndJobs = async () => {
    setLoading(true);
    try {
      const filters = {
        q: searchQuery,
        type: jobType,
        remote: isRemote,
        location: area,
        salary: salaryFilter,
        category: category
      };

      const [profileRes, myJobsRes, searchRes] = await Promise.all([
        userAPI.getProfile(),
        jobAPI.getMyJobs(),
        jobAPI.searchJobs(filters)
      ]);

      const skills = profileRes.data.skills || [];
      setUserSkills(skills);

      // Track saved and applied
      const saved = new Set();
      const applied = new Set();
      myJobsRes.data.forEach(j => {
        if (j.status === 'saved') saved.add(j.externalId);
        if (j.status === 'applied') applied.add(j.externalId);
      });
      setSavedJobIds(saved);
      setAppliedJobIds(applied);

      setJobs(searchRes.data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchProfileAndJobs();
  }, [searchQuery, jobType, isRemote, area, salaryFilter, category]);

  const handleSave = async (job) => {
    try {
      const res = await jobAPI.saveJob({
        externalId: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        type: job.type,
        link: '#'
      });

      const newSaved = new Set(savedJobIds);
      if (res.data.status === 'none') {
        newSaved.delete(job._id);
      } else {
        newSaved.add(job._id);
      }
      setSavedJobIds(newSaved);
    } catch (err) {
      alert('Failed to save job');
    }
  };

  const handleApply = async (job) => {
    try {
      await jobAPI.applyJob({
        externalId: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        type: job.type,
        link: '#'
      });
      setAppliedJobIds(prev => new Set([...prev, job._id]));
      alert(`Success! Your application for ${job.title} at ${job.company} has been sent.`);
    } catch (err) {
      alert('Failed to apply');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        {/* Header Section */}
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '0 1rem' }}>
            <h1 style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Opportunities for <span style={{ color: 'var(--primary-color)' }}>You</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>Live recruiting jobs matching your skills and interests.</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="jobs-search-container premium-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '15px', background: 'white' }}>
            <div className="search-inputs-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 2, position: 'relative', minWidth: '260px' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                <input
                  type="text"
                  placeholder="Job title, company, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '0.95rem' }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                <MapPin style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                <input
                  type="text"
                  placeholder="Area / Location"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div className="filters-row" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: '0.2rem' }} className="mobile-only-flex">
                <Filter size={16} color="#64748b" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Filters:</span>
              </div>
              
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="job-select">
                <option value="">All Job Types</option>
                <option value="full-time">Full-time</option>
                <option value="intern">Internship</option>
                <option value="contract">Contract</option>
              </select>

              <select value={isRemote} onChange={(e) => setIsRemote(e.target.value)} className="job-select">
                <option value="">Work Setting</option>
                <option value="true">Offsite / Remote</option>
                <option value="false">Onsite</option>
              </select>

              <select value={salaryFilter} onChange={(e) => setSalaryFilter(e.target.value)} className="job-select">
                <option value="">Any Salary</option>
                <option value="paid">Paid / Stipend</option>
              </select>

              <select value={category} onChange={(e) => setCategory(e.target.value)} className="job-select">
                <option value="">All Domains</option>
                <option value="Software Development">Software Dev</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Data">Data Science</option>
                <option value="Customer Service">Support</option>
                <option value="Sales">Sales</option>
                <option value="Writing">Writing</option>
              </select>

              <button 
                onClick={() => {
                  setSearchQuery(''); setJobType(''); setIsRemote(''); setArea(''); setSalaryFilter(''); setCategory('');
                }}
                className="clear-filters-btn"
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, padding: '0.5rem' }}
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="jobs-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
            {/* Main Job Feed */}
            <div className="job-feed-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="var(--primary-color)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>
                    {loading ? 'Fetching live data...' : `${jobs.length} Jobs found`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.7rem', fontWeight: 800 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></div>
                  LIVE FEED
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px' }}>
                  <div className="spinner-small" style={{ margin: '0 auto 1rem', width: '40px', height: '40px' }}></div>
                  <p style={{ color: '#64748b', fontWeight: 600 }}>Scanning tech boards...</p>
                </div>
              ) : jobs.length > 0 ? (
                jobs.map(job => (
                  <JobCard
                    key={job._id}
                    job={job}
                    isSaved={savedJobIds.has(job._id)}
                    isApplied={appliedJobIds.has(job._id)}
                    onSave={() => handleSave(job)}
                    onApply={() => handleApply(job)}
                  />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '20px' }}>
                  <Search size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b' }}>No jobs found for your search.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="jobs-page-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="premium-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--primary-color), #4f46e5)', color: 'white' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Profile Strength</h3>
                <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.4rem' }}>Recruiters are looking for you!</p>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', marginTop: '1rem', overflow: 'hidden' }}>
                  <div style={{ width: '75%', height: '100%', background: 'white', borderRadius: '10px' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}>
                  <span>Intermediate</span>
                  <span>75%</span>
                </div>
              </div>

              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem' }}>My Skills</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {userSkills.length > 0 ? userSkills.map(skill => (
                    <span key={skill} style={{ padding: '0.35rem 0.7rem', background: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {skill}
                    </span>
                  )) : <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No skills added yet.</p>}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .job-select {
            padding: 0.6rem 0.8rem;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            outline: none;
            font-size: 0.9rem;
            background: white;
            color: #1e293b;
            flex: 1;
            min-width: 140px;
            cursor: pointer;
            transition: var(--transition);
          }
          .job-select:hover { border-color: var(--primary-color); }
          
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
          
          @media (max-width: 1024px) {
            .jobs-layout-grid { grid-template-columns: 1fr !important; }
            .jobs-page-sidebar { display: none !important; }
          }

          @media (max-width: 768px) {
            .jobs-search-container { padding: 1rem !important; margin: 0 1rem 1.5rem !important; }
            .search-inputs-row { gap: 0.75rem !important; }
            .job-select { width: 100% !important; flex: none !important; }
            .filters-row { gap: 0.6rem !important; }
            .clear-filters-btn { width: 100% !important; text-align: center !important; margin-top: 0.5rem !important; }
            .job-feed-column { padding: 0 1rem !important; }
            .job-card-premium { flex-direction: column !important; gap: 1rem !important; padding: 1.25rem !important; }
            .job-card-premium .company-logo-wrapper { width: 48px !important; height: 48px !important; }
            .job-card-premium .job-info-header { flex-direction: row !important; align-items: flex-start !important; }
            .job-card-premium .job-meta-row { gap: 0.8rem !important; margin-top: 0.75rem !important; }
            .job-card-premium .job-actions-row { width: 100% !important; justify-content: space-between !important; margin-top: 1.25rem !important; }
            .job-card-premium .btn-premium { width: 100% !important; }
          }
        `}} />
    </div>
  );
};

const JobCard = ({ job, isSaved, isApplied, onSave, onApply }) => (
  <div className="premium-card job-card-premium" style={{ padding: '1.2rem', display: 'flex', gap: '1.2rem', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid transparent' }}>
    <div className="company-logo-wrapper" style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {job.company[0] === 'G' ? <img src="https://www.google.com/favicon.ico" style={{ width: '24px' }} alt="Google" /> : <Briefcase size={28} color="var(--primary-color)" />}
    </div>

    <div style={{ flex: 1 }}>
      <div className="job-info-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.3 }}>{job.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{job.company}</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} className="hidden-mobile"></div>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{job.time}</span>
          </div>
        </div>
        <button
          onClick={onSave}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#cbd5e1', transition: 'color 0.2s', padding: '4px' }}
        >
          <Bookmark size={22} fill={isSaved ? '#f59e0b' : 'none'} />
        </button>
      </div>

      <div className="job-meta-row" style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem', color: '#64748b', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {job.location}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><DollarSign size={14} /> {job.salary}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {job.type}</div>
      </div>

      <div className="job-actions-row" style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {job.skills.slice(0, 2).map(s => (
            <span key={s} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', color: '#64748b', fontWeight: 700 }}>{s}</span>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          {job.source && (
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }} className="hidden-mobile">
              <Globe size={12} /> {job.source}
            </span>
          )}
          {isApplied ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 800, fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#ecfdf5', borderRadius: '8px' }}>
              <CheckCircle2 size={18} /> Applied
            </div>
          ) : (
            <button
              onClick={() => {
                onApply();
                if (job.link && job.link !== '#') window.open(job.link, '_blank');
              }}
              className="btn-premium btn-premium-primary"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem', borderRadius: '10px', fontWeight: 700 }}
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default Jobs;
