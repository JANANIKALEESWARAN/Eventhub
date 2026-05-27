const express = require('express');
const router = express.Router();
const { saveJob, applyJob, getMyJobs, searchJobs } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-jobs', getMyJobs);
router.get('/search', searchJobs);
router.post('/save', saveJob);
router.post('/apply', applyJob);

module.exports = router;
