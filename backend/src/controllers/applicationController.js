// applicationController.js — uses req.user set by requireAuth middleware

const db = require('../config/db');

// POST /api/jobs/:id/apply
const applyToJob = (req, res) => {
  const user = req.user;

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  // Ownership check: cannot apply to own job
  if (job.created_by === user.id) {
    return res.status(400).json({ error: 'You cannot apply to your own job.' });
  }

  // Duplicate check (belt + suspenders — DB unique index is the final guard)
  const existing = db
    .prepare('SELECT id FROM applications WHERE job_id = ? AND applicant_id = ?')
    .get(job.id, user.id);
  if (existing) return res.status(409).json({ error: 'You have already applied to this job.' });

  const { proposal_text, bid_amount } = req.body;
  if (!proposal_text || !proposal_text.trim()) {
    return res.status(400).json({ error: 'proposal_text is required.' });
  }
  if (bid_amount !== undefined && bid_amount !== null && Number(bid_amount) < 0) {
    return res.status(400).json({ error: 'bid_amount cannot be negative.' });
  }

  let result;
  try {
    result = db.prepare(
      'INSERT INTO applications (job_id, applicant_id, proposal_text, bid_amount) VALUES (?, ?, ?, ?)'
    ).run(job.id, user.id, proposal_text.trim(), bid_amount ? Number(bid_amount) : null);
  } catch (err) {
    // Catch DB-level unique constraint violation as fallback
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You have already applied to this job.' });
    }
    throw err;
  }

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ application });
};

// GET /api/applications/mine
const getMyApplications = (req, res) => {
  const user = req.user;

  const applications = db.prepare(`
    SELECT a.*, j.title as job_title, j.department, j.type, j.compensation_type,
           j.compensation_amount, j.id as job_id, u.name as poster_name, u.role as poster_role
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON j.created_by = u.id
    WHERE a.applicant_id = ?
    ORDER BY a.created_at DESC
  `).all(user.id);

  res.json({ applications });
};

// PATCH /api/applications/:id  — only job poster can accept/reject
const updateApplicationStatus = (req, res) => {
  const user = req.user;

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found.' });

  // Ownership: only poster of the linked job can change status
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(application.job_id);
  if (job.created_by !== user.id) {
    return res.status(403).json({ error: 'Only the job poster can update application status.' });
  }

  const { status } = req.body;
  if (!['accepted', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be "accepted", "rejected", or "pending".' });
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, application.id);
  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(application.id);

  res.json({ application: updated });
};

module.exports = { applyToJob, getMyApplications, updateApplicationStatus };
