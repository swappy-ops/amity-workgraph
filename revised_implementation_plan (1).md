# Campus Work Graph — Revised MVP Plan (Amity)
### Prototype-First. Pitch-Ready. No Overengineering.

---

## System Boundary Clarification

**Two separate systems exist. This plan covers only the freelance platform.**

| System | Identity | Purpose |
|---|---|---|
| **Freelance Platform** (this plan) | Enrollment number + name | Campus work marketplace |
| **XPD Club Recruitment Drive** | `@s.amity.edu` email | Separate system, not in scope here |

Do not conflate the two. `@s.amity.edu` is not used anywhere in this codebase.

---

## What Changed & Why

The original plan was solid in structure but **over-built for a first prototype**. The transcript conversation with the faculty advisor reveals the real goal: build something working and demo-able that can be **pitched to Amity administration**. That means:

- It needs to feel **institutional and trustworthy**, not like a side project
- It must be **open to all departments** (not just design/UI), per the advisor's explicit direction
- The **alumni platform connection** was suggested as a pitch angle — not a technical dependency yet
- **Ratings and work lifecycle tracking** are V2 features; get users first
- **Authentication** is now enrollment number + name — no email at all in the prototype

The `erebus` and `company` job sources from the original plan are dropped — the transcript only establishes **students and faculty** as actors in the MVP.

---

## 1. Simplified Scope (What This Prototype Does)

| Feature | In Prototype? | Notes |
|---|---|---|
| Enrollment number + name login | ✅ | Validated against known pattern, no password needed |
| Post a job/gig | ✅ | Students and faculty both can post |
| Browse & filter job feed | ✅ | Filter by type and compensation |
| Apply to a job | ✅ | Simple proposal text + optional bid |
| View your applications (Dashboard) | ✅ | Applicant view only |
| Accept/reject applicants (poster view) | ✅ | Simple status update |
| Ratings system | ❌ | V2 — too early |
| Work record lifecycle | ❌ | V2 — too early |
| `erebus` / external company source | ❌ | Not in transcript scope |
| Alumni platform integration | ❌ | Pitch angle only, not MVP tech |
| Email notifications | ❌ | V2 |

---

## 2. Folder Structure

```
c:\Users\swapn\freelance\
├── backend/
│   └── src/
│       ├── config/
│       │   └── db.js              # SQLite init + seed
│       ├── controllers/
│       │   ├── authController.js  # Mock login: find-or-create by email
│       │   ├── jobController.js   # CRUD + sorted feed
│       │   └── applicationController.js  # Apply, view, accept/reject
│       ├── routes/
│       │   └── api.js
│       ├── index.js
│       └── .env
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Navbar.jsx
        │   ├── JobCard.jsx
        │   ├── FilterBar.jsx
        │   └── ApplicationForm.jsx
        ├── pages/
        │   ├── Login.jsx          # NEW — simple @amity.edu email entry
        │   ├── HomeFeed.jsx
        │   ├── JobDetail.jsx
        │   ├── PostJob.jsx        # NEW — any user can post
        │   └── Dashboard.jsx      # "My Posts" + "My Applications" tabs
        ├── context/
        │   └── AuthContext.jsx    # NEW — global user state
        ├── index.css
        ├── main.jsx
        └── App.jsx
    ├── package.json
    └── vite.config.js
```

**Key additions vs original:**
- `Login.jsx` — resolves the open question from the original plan (simple email entry screen)
- `PostJob.jsx` — extracted into its own page for clarity
- `AuthContext.jsx` — stores logged-in user so all components can access it without prop drilling

---

## 3. Database Schema (Simplified)

Three tables. `work_records` and `ratings` are deferred to V2.

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    enrollment_no TEXT NOT NULL UNIQUE,  -- e.g. A02142924001
    role TEXT NOT NULL CHECK(role IN ('student', 'faculty')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enrollment number validation (applied in authController.js, not DB-level):
-- UX 2023-27 batch pattern: /^A02142924\d{3}$/
-- Flexible fallback for other depts: /^A0\d{10}$/  (A0 + 10 digits)
-- Faculty: no enrollment number constraint — role set manually or via a separate faculty list

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT,                -- e.g. "AI/ML", "Design", "Marketing" — open field
    type TEXT NOT NULL CHECK(type IN ('internship', 'freelance', 'part-time', 'project')),
    compensation_type TEXT NOT NULL CHECK(compensation_type IN ('paid', 'stipend', 'unpaid')),
    compensation_amount REAL,
    timeline TEXT,                  -- Required if unpaid (what they get instead)
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    proposal_text TEXT NOT NULL,
    bid_amount REAL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(applicant_id) REFERENCES users(id)
);
```

**Schema changes from original:**
- Removed `source` column (was 'student'/'faculty'/'erebus'/'company') — source is now derived from `created_by → users.role`. No redundant data.
- Removed `low_priority` boolean — sorting can just push `unpaid` to bottom in query; no need to store it.
- Added `department` as an open text field — supports the advisor's requirement that jobs span all departments (AI, design, coding, marketing, etc.) without requiring a fixed enum.
- Dropped `work_records` and `ratings` tables entirely.

---

## 4. Backend API Routes

All routes under `/api`. After login, the backend returns a user object which the frontend stores in `AuthContext` and passes as `x-enrollment-no` header on subsequent requests.

```
POST   /api/auth/login          # { enrollment_no, name } → validate format → find or create user

GET    /api/jobs                # Feed: sorted, supports ?type=&compensation_type=
POST   /api/jobs                # Post a job (requires auth header)
GET    /api/jobs/:id            # Full detail + applicants (if requester is poster)

POST   /api/jobs/:id/apply      # Submit application
GET    /api/applications/mine   # All applications by logged-in user
PATCH  /api/applications/:id    # Accept or reject (poster only)
```

**Auth validation logic (`authController.js`):**
```js
const UX_2023_BATCH = /^A02142924\d{3}$/;
const GENERIC_STUDENT = /^A0\d{10}$/;

function validateEnrollment(enrollment_no) {
  return UX_2023_BATCH.test(enrollment_no) || GENERIC_STUDENT.test(enrollment_no);
}
// Faculty bypass: if role === 'faculty', skip enrollment validation entirely.
// Faculty can self-declare role on the login screen for the prototype.
```
```js
// In jobController.js — applied after fetch
jobs.sort((a, b) => {
  // Faculty-posted jobs first
  if (a.poster_role === 'faculty' && b.poster_role !== 'faculty') return -1;
  if (b.poster_role === 'faculty' && a.poster_role !== 'faculty') return 1;
  // Unpaid jobs always last
  if (a.compensation_type === 'unpaid' && b.compensation_type !== 'unpaid') return 1;
  if (b.compensation_type === 'unpaid' && a.compensation_type !== 'unpaid') return -1;
  // Otherwise newest first
  return new Date(b.created_at) - new Date(a.created_at);
});
```

---

## 5. Frontend Pages

### `Login.jsx`
Two fields: **name** and **enrollment number**. A role toggle (Student / Faculty) is shown. For students, the enrollment number is validated client-side against the known pattern before hitting the API — invalid formats show an inline error ("That doesn't look like a valid Amity enrollment number"). Faculty skip enrollment validation. On success, user object stored in `AuthContext`, redirect to feed.

### `HomeFeed.jsx`
`FilterBar` at the top (type + compensation_type). `JobCard` grid below. Cards show: title, poster name + role badge, department tag, compensation badge (color-coded: green=paid, yellow=stipend, grey=unpaid), and a "View" button.

### `JobDetail.jsx`
Full description, timeline (for unpaid), and an `ApplicationForm` embedded at the bottom. If the logged-in user is the poster, they see a list of applicants with Accept/Reject buttons instead.

### `PostJob.jsx`
Clean form. Fields: title, description, department (free text), type (select), compensation_type (select), compensation_amount (conditional), timeline (conditional on unpaid). Submits to `POST /api/jobs`.

### `Dashboard.jsx`
Two tabs:
- **My Posts** — jobs this user has created, with applicant counts
- **My Applications** — jobs this user applied to, with current status badge

---

## 6. Seed Data

To make the demo compelling, seed with realistic Amity-flavoured data across departments:

```js
// Users — enrollment numbers follow validated patterns
{ name: 'Priya Menon',     enrollment_no: 'A02142924001', role: 'faculty' },
{ name: 'Rohan Kapoor',    enrollment_no: 'A02142924042', role: 'student' },
{ name: 'Aisha Siddiqui',  enrollment_no: 'A02142924078', role: 'student' },

// Jobs (mix of types + departments)
{ title: 'Research Assistant – NLP Project', type: 'project', department: 'AI/ML',
  compensation_type: 'stipend', compensation_amount: 3000, created_by: 1 /* faculty */ },

{ title: 'Instagram Reels Editor for Startup', type: 'freelance', department: 'Design',
  compensation_type: 'paid', compensation_amount: 5000, created_by: 2 /* student */ },

{ title: 'Backend Dev for Campus Event App', type: 'project', department: 'Engineering',
  compensation_type: 'unpaid', timeline: '6 weeks, certificate + strong recommendation letter',
  created_by: 2 },

{ title: 'Campus Brand Photographer', type: 'part-time', department: 'Marketing',
  compensation_type: 'paid', compensation_amount: 800, created_by: 3 },
```

---

## 7. Open Questions (Resolved)

| Question | Decision |
|---|---|
| Login mechanism? | **Enrollment number + name** — validated client-side, no password, no email |
| What about `@s.amity.edu`? | **Not used here** — belongs to XPD club recruitment drive (separate system) |
| Enrollment format for other depts? | **Flexible regex fallback** `A0\d{10}` — UX batch gets strict check, others pass generic pattern |
| Brand colors? | **Amity Yellow (#F5B800) + Navy (#002147)** — CSS variables throughout |

---

## 8. What's Explicitly Deferred to V2

- Ratings and reviews (after `work_records` concept is validated)
- Alumni platform integration (pitch angle → actual API later)
- Email blast / newsletter (mentioned in transcript — great V2 add)
- OAuth / real auth (swap mock header auth for proper JWT or institutional SSO)
- Real-time notifications
- Admin panel

---

## Build Order (Execution Sequence)

1. `backend/` — `db.js` schema + seed → `authController` → `jobController` → `applicationController` → `api.js` routes → `index.js`
2. `frontend/` — Vite scaffold → `AuthContext` → `Login` page → `HomeFeed` + `JobCard` → `JobDetail` + `ApplicationForm` → `PostJob` → `Dashboard` → CSS polish with Amity brand tokens

> ✅ **Ready to execute on approval.** This prototype can be running locally in a single session and is demo-ready for an Amity administration pitch.
