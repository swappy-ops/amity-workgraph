// jobController.js — uses req.user set by requireAuth middleware

const db = require('../config/db');

const VALID_TYPES = ['internship', 'freelance', 'part-time', 'project'];
const VALID_COMP  = ['paid', 'stipend', 'unpaid'];

// GET /api/jobs  (public — no auth required)
const getFeed = (req, res) => {
  const { type, compensation_type } = req.query;

  let query = `
    SELECT j.*, u.name as poster_name, u.role as poster_role
    FROM jobs j
    JOIN users u ON j.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type) {
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type filter.' });
    query += ' AND j.type = ?';
    params.push(type);
  }
  if (compensation_type) {
    if (!VALID_COMP.includes(compensation_type)) return res.status(400).json({ error: 'Invalid compensation_type filter.' });
    query += ' AND j.compensation_type = ?';
    params.push(compensation_type);
  }

  let jobs = db.prepare(query).all(...params);

  // Sort: faculty first → unpaid last → newest first
  jobs.sort((a, b) => {
    if (a.poster_role === 'faculty' && b.poster_role !== 'faculty') return -1;
    if (b.poster_role === 'faculty' && a.poster_role !== 'faculty') return 1;
    if (a.compensation_type === 'unpaid' && b.compensation_type !== 'unpaid') return 1;
    if (b.compensation_type === 'unpaid' && a.compensation_type !== 'unpaid') return -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const countStmt = db.prepare('SELECT COUNT(*) as c FROM applications WHERE job_id = ?');
  jobs = jobs.map((j) => ({ ...j, applicant_count: countStmt.get(j.id).c }));

  res.json({ jobs });
};

// POST /api/jobs  (requires auth via middleware)
const createJob = (req, res) => {
  const user = req.user; // attached by requireAuth
  const { title, description, department, type, compensation_type, compensation_amount, timeline } = req.body;

  // Required field checks
  if (!title || !title.trim())       return res.status(400).json({ error: 'title is required.' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'description is required.' });
  if (!type)             return res.status(400).json({ error: 'type is required.' });
  if (!compensation_type) return res.status(400).json({ error: 'compensation_type is required.' });

  if (!VALID_TYPES.includes(type))  return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}.` });
  if (!VALID_COMP.includes(compensation_type)) return res.status(400).json({ error: `compensation_type must be one of: ${VALID_COMP.join(', ')}.` });

  // Compensation rules
  if (compensation_type === 'unpaid' && (!timeline || !timeline.trim())) {
    return res.status(400).json({ error: 'timeline is required for unpaid jobs (describe what the applicant gets instead).' });
  }
  if ((compensation_type === 'paid' || compensation_type === 'stipend') && !compensation_amount) {
    return res.status(400).json({ error: `compensation_amount is required for ${compensation_type} jobs.` });
  }
  if (compensation_amount !== undefined && compensation_amount !== null && Number(compensation_amount) < 0) {
    return res.status(400).json({ error: 'compensation_amount cannot be negative.' });
  }

  const result = db.prepare(`
    INSERT INTO jobs (title, description, department, type, compensation_type, compensation_amount, timeline, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    description.trim(),
    department ? department.trim() : null,
    type,
    compensation_type,
    compensation_amount ? Number(compensation_amount) : null,
    timeline ? timeline.trim() : null,
    user.id
  );

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ job });
};

// GET /api/jobs/:id  (public, but applicant list visible only to poster)
const getJobDetail = (req, res) => {
  const job = db.prepare(`
    SELECT j.*, u.name as poster_name, u.role as poster_role
    FROM jobs j JOIN users u ON j.created_by = u.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found.' });

  // Applicants only visible to the job creator
  let applicants = [];
  const requester = req.user; // set by requireAuth if route uses it, otherwise undefined
  if (requester && requester.id === job.created_by) {
    applicants = db.prepare(`
      SELECT a.*, u.name as applicant_name, u.enrollment_no, u.role as applicant_role
      FROM applications a JOIN users u ON a.applicant_id = u.id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC
    `).all(job.id);
  }

  res.json({ job, applicants });
};

module.exports = { getFeed, createJob, getJobDetail };
