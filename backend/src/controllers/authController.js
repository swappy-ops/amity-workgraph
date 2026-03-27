const bcrypt = require('bcrypt');
const db = require('../config/db');

const SALT_ROUNDS = 10;

// ─── Enrollment Validation ────────────────────────────────────────────────────
const UX_2023 = /^A021142924\d{3}$/;   // UX batch: A021142924 + 3 digits
const GENERIC  = /^A0\d{10,11}$/;       // Generic Amity: A0 + 10–11 digits

function validateEnrollment(enrollment_no, role) {
  if (role === 'faculty') return true;
  return UX_2023.test(enrollment_no) || GENERIC.test(enrollment_no);
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Body: { enrollment_no, name, password, role }
//
// FLOW:
//   User NOT found             → REGISTER: hash password, create user, return user
//   User found, hash IS NULL   → FIRST LOGIN: set password (seed user first sign-in)
//   User found, hash present   → LOGIN: verify password
//
const login = async (req, res) => {
  try {
    const { enrollment_no, name, password, role } = req.body;

    // ── Basic presence checks ──────────────────────────────────────────────────
    if (!enrollment_no || !role) {
      return res.status(400).json({ error: 'enrollment_no and role are required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters.' });
    }

    const trimmedNo   = enrollment_no.trim().toUpperCase();
    const trimmedName = (name || '').trim();
    const trimmedRole = role.trim();

    if (!['student', 'faculty'].includes(trimmedRole)) {
      return res.status(400).json({ error: 'role must be "student" or "faculty".' });
    }

    // ── Enrollment format validation (students only) ───────────────────────────
    if (!validateEnrollment(trimmedNo, trimmedRole)) {
      return res.status(400).json({
        error: 'Invalid enrollment number. Expected: A021142924XXX (UX batch) or A0 + 10–11 digits.',
      });
    }

    // ── Look up user ───────────────────────────────────────────────────────────
    let user = db.prepare('SELECT * FROM users WHERE enrollment_no = ?').get(trimmedNo);

    // ── REGISTER: new user ─────────────────────────────────────────────────────
    if (!user) {
      if (!trimmedName) {
        return res.status(400).json({ error: 'name is required for first-time registration.' });
      }
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = db
        .prepare('INSERT INTO users (name, enrollment_no, role, password_hash) VALUES (?, ?, ?, ?)')
        .run(trimmedName, trimmedNo, trimmedRole, hash);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

      // Strip hash before returning
      const { password_hash, ...safeUser } = user;
      return res.status(201).json({ user: safeUser, message: 'Account created successfully.' });
    }

    // ── FIRST LOGIN for seeded user (no password set yet) ─────────────────────
    if (!user.password_hash) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser, message: 'Password set. Welcome!' });
    }

    // ── LOGIN: verify password ─────────────────────────────────────────────────
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser });

  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { login };
