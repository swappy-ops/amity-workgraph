const db = require('./config/db');

// ─── Auth Middleware ───────────────────────────────────────────────────────────
// Reads x-enrollment-no header, finds user in DB, attaches req.user
// Rejects with 401 if header missing or user not found.

const requireAuth = (req, res, next) => {
  const enrollmentNo = req.headers['x-enrollment-no'];
  if (!enrollmentNo) {
    return res.status(401).json({ error: 'Missing x-enrollment-no header.' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE enrollment_no = ?')
    .get(enrollmentNo.trim().toUpperCase());

  if (!user) {
    return res.status(401).json({ error: 'User not found. Please log in again.' });
  }

  req.user = user;
  next();
};

module.exports = { requireAuth };
