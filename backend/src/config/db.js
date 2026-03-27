const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/amity.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Enable WAL + foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    enrollment_no TEXT NOT NULL UNIQUE,
    role          TEXT NOT NULL CHECK(role IN ('student', 'faculty')),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    department          TEXT,
    type                TEXT NOT NULL CHECK(type IN ('internship', 'freelance', 'part-time', 'project')),
    compensation_type   TEXT NOT NULL CHECK(compensation_type IN ('paid', 'stipend', 'unpaid')),
    compensation_amount REAL,
    timeline            TEXT,
    created_by          INTEGER NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id         INTEGER NOT NULL,
    applicant_id   INTEGER NOT NULL,
    proposal_text  TEXT NOT NULL,
    bid_amount     REAL,
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id)       REFERENCES jobs(id),
    FOREIGN KEY(applicant_id) REFERENCES users(id)
  );
`);

// Unique index: one application per (job, applicant) — enforced at DB level
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS unique_application
  ON applications(job_id, applicant_id);
`);

// ─── Migration: add password_hash if missing (safe — keeps existing rows) ──────
try {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;');
  console.log('✅ Migration: password_hash column added to users');
} catch {
  // Column already exists — no action needed
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

if (userCount === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (name, enrollment_no, role) VALUES (?, ?, ?)'
  );
  const insertJob = db.prepare(`
    INSERT INTO jobs (title, description, department, type, compensation_type, compensation_amount, timeline, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Priya Menon',    'A021142924001', 'faculty');
  insertUser.run('Rohan Kapoor',   'A021142924042', 'student');
  insertUser.run('Aisha Siddiqui', 'A021142924078', 'student');

  insertJob.run(
    'Research Assistant – NLP Project',
    'Join our NLP research lab to assist with data annotation, model fine-tuning, and writing paper sections. Prior experience with Python and basic ML libraries preferred.',
    'AI/ML', 'project', 'stipend', 3000, null, 1
  );
  insertJob.run(
    'Instagram Reels Editor for Startup',
    'Looking for a creative video editor to produce 4–6 short-form reels per week for an early-stage food-tech startup. Must be proficient in CapCut or Premiere Pro.',
    'Design', 'freelance', 'paid', 5000, null, 2
  );
  insertJob.run(
    'Backend Dev for Campus Event App',
    'We are building an app to streamline campus event RSVPs and room bookings. Need a Node.js developer to build REST APIs and integrate with the college portal.',
    'Engineering', 'project', 'unpaid', null,
    '6 weeks — certificate of completion + strong recommendation letter from faculty mentor', 2
  );
  insertJob.run(
    'Campus Brand Photographer',
    "Shoot bi-weekly content for Amity's official social media channels. Events, portraits, and campus life. Equipment provided. Flexible schedule.",
    'Marketing', 'part-time', 'paid', 800, null, 3
  );
  insertJob.run(
    'Marketing Intern – Fest Promotion',
    "Help plan and execute the social media campaign for Amity's annual cultural fest. Create graphics, schedule posts, and track engagement metrics.",
    'Marketing', 'internship', 'stipend', 2000, null, 1
  );
  insertJob.run(
    'Data Entry & Research Help (Law Dept)',
    'Assist a faculty member with legal research — compiling case studies, summarizing judgments, and maintaining structured records. Any department welcome.',
    'Law', 'part-time', 'unpaid', null,
    '4 weeks — letter of appreciation + access to legal research databases', 1
  );

  console.log('✅ Database seeded with demo data');
}

module.exports = db;
