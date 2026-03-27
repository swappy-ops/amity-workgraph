const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware');
const { login } = require('../controllers/authController');
const { getFeed, createJob, getJobDetail } = require('../controllers/jobController');
const {
  applyToJob,
  getMyApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');

// ─── Auth (public) ────────────────────────────────────────────────────────────
router.post('/auth/login', login);

// ─── Jobs ─────────────────────────────────────────────────────────────────────
router.get('/jobs', getFeed);                          // public feed
router.post('/jobs', requireAuth, createJob);          // must be logged in to post
router.get('/jobs/:id', requireAuth, getJobDetail);   // must be logged in to see applicants

// ─── Applications ──────────────────────────────────────────────────────────────
router.post('/jobs/:id/apply', requireAuth, applyToJob);
router.get('/applications/mine', requireAuth, getMyApplications);
router.patch('/applications/:id', requireAuth, updateApplicationStatus);

module.exports = router;
