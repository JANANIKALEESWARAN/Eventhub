const Job = require('../models/Job');
const MarketJob = require('../models/MarketJob');
const User = require('../models/User');

const searchJobs = async (req, res) => {
  try {
    const { q, type, remote, location, salary, category } = req.query;
    console.log('Job search filters:', { q, type, remote, location, salary, category });
    const currentUser = await User.findById(req.user._id);
    const userSkills = (currentUser.skills || []).map(s => s.toLowerCase());

    // ── FETCH REAL-TIME TECH JOBS (Remotive & Arbeitnow) ──
    let externalJobs = [];
    
    // 1. Remotive API (Deep Tech Focus: MERN, AI, Cybersecurity)
    try {
      const remResponse = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const remData = await remResponse.json();
      const techJobs = (remData.jobs || []).map(job => ({
        _id: `rem-${job.id}`,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Remote',
        salary: job.salary || 'Competitive',
        type: job.job_type || 'Full-time',
        link: job.url,
        skills: [job.category, ...(job.tags || [])],
        source: 'Remotive Tech'
      }));
      externalJobs = [...externalJobs, ...techJobs];
    } catch (err) { console.error('Remotive API Failed:', err.message); }

    // 2. Arbeitnow API (General Business/Europe Focus)
    try {
      const arbResponse = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const arbData = await arbResponse.json();
      const bizJobs = (arbData.data || []).map(job => ({
        _id: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.location || 'Remote',
        salary: 'Competitive',
        type: job.job_types[0] || 'Full-time',
        link: job.url,
        skills: job.tags || [],
        source: 'Arbeitnow'
      }));
      externalJobs = [...externalJobs, ...bizJobs];
    } catch (err) { console.error('Arbeitnow API Failed'); }

    const localJobs = await MarketJob.find({}).sort({ postedDate: -1 });
    let combinedJobs = [...externalJobs, ...localJobs];
    console.log(`Initial combined jobs: ${combinedJobs.length}`);

    // Filter by search query if provided
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      combinedJobs = combinedJobs.filter(job => 
        job.title.toLowerCase().includes(term) || 
        job.company.toLowerCase().includes(term) ||
        job.skills.some(s => s.toLowerCase().includes(term))
      );
      console.log(`After search query (${q}): ${combinedJobs.length}`);
    }

    // Apply additional filters
    if (type && type.trim()) {
      const t = type.trim().toLowerCase().replace('-', '_');
      combinedJobs = combinedJobs.filter(job => {
        const jobType = job.type.toLowerCase().replace('-', '_');
        return jobType.includes(t);
      });
      console.log(`After type filter (${type}): ${combinedJobs.length}`);
    }

    if (remote === 'true' || remote === 'false') {
      console.log('Locations before onsite/remote filter:', combinedJobs.map(j => j.location));
    }

    if (remote === 'true') {
      combinedJobs = combinedJobs.filter(job => {
        const loc = job.location.toLowerCase();
        return loc.includes('remote') || loc.includes('offsite') || loc.includes('worldwide') || loc.includes('anywhere');
      });
      console.log(`After remote filter (true): ${combinedJobs.length}`);
    } else if (remote === 'false') {
      combinedJobs = combinedJobs.filter(job => {
        const loc = job.location.toLowerCase();
        return !loc.includes('remote') && !loc.includes('offsite') && !loc.includes('worldwide') && !loc.includes('anywhere');
      });
      console.log(`After onsite filter (false): ${combinedJobs.length}`);
    }

    if (location && location.trim()) {
      const loc = location.trim().toLowerCase();
      combinedJobs = combinedJobs.filter(job => 
        job.location.toLowerCase().includes(loc)
      );
      console.log(`After location filter (${location}): ${combinedJobs.length}`);
    }

    if (salary === 'paid') {
      combinedJobs = combinedJobs.filter(job => {
        const s = job.salary.toLowerCase();
        return s !== 'unpaid' && !s.includes('n/a') && s !== 'none';
      });
      console.log(`After salary filter (paid): ${combinedJobs.length}`);
    }

    if (category && category.trim()) {
      const cat = category.trim().toLowerCase();
      combinedJobs = combinedJobs.filter(job => 
        job.skills.some(s => s.toLowerCase().includes(cat))
      );
      console.log(`After category filter (${category}): ${combinedJobs.length}`);
    }

    // Sort by skill match preference
    const sorted = combinedJobs.sort((a, b) => {
      const aMatches = a.skills.some(s => userSkills.includes(s.toLowerCase())) ? 1 : 0;
      const bMatches = b.skills.some(s => userSkills.includes(s.toLowerCase())) ? 1 : 0;
      return bMatches - aMatches;
    });

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveJob = async (req, res) => {
  try {
    const { externalId, title, company, location, salary, type, link } = req.body;
    
    // Check if already saved
    let job = await Job.findOne({ user: req.user._id, externalId });
    
    if (job) {
      if (job.status === 'saved') {
        // Toggle: remove if already saved
        await Job.findByIdAndDelete(job._id);
        return res.json({ message: 'Job removed from saved list', status: 'none' });
      } else {
        // If already applied, don't change anything or update status
        return res.json({ message: 'Job already applied', status: 'applied' });
      }
    }

    job = await Job.create({
      user: req.user._id,
      externalId,
      title,
      company,
      location,
      salary,
      type,
      link,
      status: 'saved'
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const applyJob = async (req, res) => {
  try {
    const { externalId, title, company, location, salary, type, link } = req.body;
    
    let job = await Job.findOne({ user: req.user._id, externalId });
    
    if (job) {
      job.status = 'applied';
      await job.save();
    } else {
      job = await Job.create({
        user: req.user._id,
        externalId,
        title,
        company,
        location,
        salary,
        type,
        link,
        status: 'applied'
      });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { saveJob, applyJob, getMyJobs, searchJobs };
