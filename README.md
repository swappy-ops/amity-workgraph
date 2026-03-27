# Nexus — Amity WorkGraph
Internal campus freelance and opportunity marketplace

## Demo Overview
Nexus is a closed-network marketplace designed for students and faculty. The platform facilitates a structured workflow where users post opportunities, relevant candidates submit applications, and posters review and accept candidates. Operating strictly as an internal system, it establishes a high-trust environment by restricting access to verified campus personnel.

## Architecture
### Frontend
The client application is built with React and Vite. It utilizes the React Context API for authentication state management and local storage for session persistence across a component-based user interface.

### Backend
The server is implemented using Node.js and Express. It connects to a SQLite database (`node:sqlite`) configured in WAL (Write-Ahead Log) mode to support efficient concurrent operations.

## Database Design
The core data architecture relies on a three-table relational schema:
- **users**: Stores identity markers, role designation, and authentication password hashes.
- **jobs**: Records opportunity definitions, compensation metrics, and foreign key relations to the posting entity.
- **applications**: Maps applicants to jobs alongside their textual proposals and optional bid amounts.

Integrity is enforced at the database level using a `unique_application` index to prevent duplicate submissions by the same applicant for a specific job. The `enrollment_no` functions as the primary platform identity key.

## Auth System
The authentication and identity verification infrastructure has undergone the following distinct iterations:
- **V1**: Static mock login utilizing hardcoded client-side state mapping.
- **V2**: Enrollment-based identity resolution using a backend find-or-create mechanism without cryptographic verification.
- **V3 (Current)**: Password-based authentication utilizing `bcrypt` hashing. The initial login sequence for a recognized enrollment number inherently functions as registration, durably storing the password hash. Subsequent authentication attempts mandate cryptographic password verification against the stored hash.

## Feature Set
- Role-based login and session creation (student and faculty)
- Job posting interface with strict compensation logic validation
- Dynamic job feed featuring multi-dimensional filtering
- Application submission gateway accepting proposals and bids
- Consolidated personal dashboard tracking authored posts and active applications
- Application status control mechanism (accept/reject handlers)

## System Evolution

### Phase 1
Static Nexus HTML prototype implementation. This phase established the monolithic visual design language and user experience layouts utilizing vanilla web technologies.

### Phase 2
React migration. The initial static asset was dismantled and architected into a componentized React application. This process segregated rendering logic into distinct pages and reusable components while centralizing style declarations.

### Phase 3
Backend integration. The Express development server and SQLite instances were established. RESTful API routes were defined and wired to the client tier to fully replace the legacy mock request interceptors.

### Phase 4
Identity system fixes. Enrollment format validation was enforced on both the client and server layers. Faculty identity generation was normalized to ensure deterministic identifier assignment preventing duplicate logical users.

### Phase 5
Password authentication. The platform was upgraded to integrate `bcrypt`. The core authentication controller was rewritten to securely handle first-time dynamic registration scenarios alongside standard returning user verifications without relying on external state.

## Running Locally

### Backend
Navigate to the backend directory and initiate the service. Note that the experimental sqlite flag is required.
```bash
cd backend
node --experimental-sqlite src/index.js
```

### Frontend
Navigate to the frontend directory and start the Vite development server.
```bash
cd frontend
npm run dev
```

## Demo Flow
1. Authenticate using a faculty role.
2. Formulate and post a new opportunity.
3. Authenticate using a student role configuration.
4. Locate the newly created opportunity and submit an application.
5. Authenticate again via the initial faculty credentials.
6. Review the pending application within the dashboard and accept it.

## Known Limitations
- Session trust relies strictly on header transmission; formal JWT generation and validation layers are absent.
- No self-service password reset infrastructure.
- Complete absence of University Single Sign-On (SSO) integration.
- Bound to SQLite, an architecture not natively suitable for wide-scale horizontal production deployment.

## Future Roadmap
- Implementation of cryptographically secure JWT authentication logic
- University-level SSO infrastructure integrations
- Multi-campus horizontal scaling deployment architecture
- Auditable work records and bidirectional rating systems
- Alumni network ingestion capabilities

## Author
Swapnil Karki
