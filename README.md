# 🗳️ PollLive — Online Polling and Live Voting System

A production-grade, full-stack **Online Polling and Real-Time Voting System** built on Node.js/Express, MongoDB/Mongoose, and React 18/Vite. Powered by **Socket.IO** for live real-time ballot updates, **JWT** authentication, **Role-Based Access Control (Admin, Creator, Participant)**, **DB-level race-condition defense**, and an **Admin Approval Workflow Gate**.

---

## 📌 Table of Contents
1. [Architecture & System Design](#-architecture--system-design)
2. [Technology Stack](#-technology-stack)
3. [Key Highlights & Capabilities](#-key-highlights--capabilities)
4. [Security Architecture](#-security-architecture)
5. [Project Structure](#-project-structure)
6. [Quickstart & Setup](#-quickstart--setup)
7. [Running Tests](#-running-tests)
8. [Comprehensive API Reference](#-comprehensive-api-reference)
9. [Seed & Demo Accounts](#-seed--demo-accounts)
10. [License](#-license)

---

## 🏗️ Architecture & System Design

```
                     ┌───────────────────────────────────────────┐
                     │           React 18 + Vite Client          │
                     │  (Tailored CSS, Glassmorphism, Recharts)  │
                     └─────────────────────┬─────────────────────┘
                                           │
                        REST HTTP (Axios)  │  WebSockets (Socket.IO)
                        JWT in Auth Header │  Authenticated Handshake
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Express 4 Server API                               │
│                                                                                 │
│  [Security Layer]                                                               │
│    ├── Helmet (Security Headers)                                                │
│    ├── Express Rate Limit (General, Auth, Voting Tiers)                         │
│    ├── Express Mongo Sanitize (NoSQL Injection Defense)                         │
│    └── CORS Whitelist                                                           │
│                                                                                 │
│  [Middlewares]                                                                  │
│    ├── authMiddleware (JWT verify, active status, role check, creator perm)     │
│    ├── validatorMiddleware (express-validator schema rules)                     │
│    └── errorMiddleware (sanitized responses, duplicate key mappings)            │
│                                                                                 │
│  [Service Layer]                                                                │
│    ├── authService.js                                                           │
│    ├── pollService.js                                                           │
│    ├── voteService.js (Aggregation source of truth, drift-free healing)         │
│    ├── adminService.js (User, creator, permission & poll management)            │
│    └── pollExpiryService.js (Autonomous 60s background lifecycle worker)        │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────────┐
                     │               MongoDB 8.0                 │
                     │  - Compound Unique Index: {user, poll}    │
                     │  - Compound Queries: {status, expiry}     │
                     │  - Atomic $inc, $sum Aggregations         │
                     └───────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Server** | Node.js, Express 4 | High-throughput async REST API backend |
| **Database** | MongoDB 8, Mongoose 8 | Document storage with compound indexing & aggregation |
| **Authentication** | JWT, bcryptjs | Stateless bearer authentication with bcrypt salt cost ≥ 12 |
| **Real-Time** | Socket.IO | Handshake-authenticated WebSocket rooms (`poll_:id`) |
| **Testing** | Jest, Supertest | Automated unit, RBAC, ownership, and integrity test suites |
| **Frontend** | React 18, Vite 5 | SPA with code-splitting and responsive layout |
| **Styling** | Vanilla CSS | Custom tokenized design system (Light/Dark mode, glassmorphism) |
| **Charts** | Recharts | Dynamic Bar and Donut chart visualizations |
| **Export** | jsPDF, xlsx | PDF, Excel, and Word report generators |

---

## ✨ Key Highlights & Capabilities

1. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full administrative dashboard, user management (promote, demote, activate, deactivate), creator permission overrides, and poll approval/rejection moderation queue.
   - **Creator**: Poll creation with custom options, start/end date windows, creator dashboard, participant vote viewer, and report exports.
   - **Participant**: Vote in active polls (strictly 1 vote per poll), view live tally results, browse archived poll history, customize settings/themes.
2. **Admin Poll Approval Workflow**:
   - Creator-submitted polls enter a `pending` state and are hidden from general participants.
   - Admins review, approve (with optional option refinements), or reject with direct creator feedback.
3. **Atomic Double-Voting Defense**:
   - Application pre-check combined with a database-level **Compound Unique Index** `{ userId: 1, pollId: 1 }` prevents concurrent double-voting race conditions (HTTP 409).
4. **Drift-Free Result Aggregation**:
   - Poll tallies and percentages are computed dynamically from `Vote.aggregate` (the source of truth), with automatic self-healing for cached counters.
5. **Automated Expiry Service**:
   - Autonomous background worker transitions active polls to `closed` as soon as their `expiryTime` expires.
6. **Code-Split Frontend**:
   - Optimized with `React.lazy` and Vite rollup manual chunks, reducing initial page load bundle by over 80%.

---

## 🔒 Security Architecture

- **Credential Hashing**: Passwords require min 8 characters with uppercase, lowercase, and digit; hashed using bcrypt with salt rounds ≥ 12.
- **Timing Attack / Enumeration Defense**: Verify passwords before account status checks to prevent user enumeration.
- **Rate Limiting**:
  - General API: 300 req / 15 min per IP.
  - Authentication (Login/Register): 20 req / 15 min per IP.
  - Voting Submission: 30 req / 1 min per IP.
- **NoSQL Injection Prevention**: `express-mongo-sanitize` strips `$` and `.` operators from all incoming parameters.
- **Strict CORS & Headers**: Whitelisted client origins and HTTP security headers enforced by `helmet`.
- **Payload Limits**: Max 50KB request body limits to prevent denial-of-service via oversized JSON payloads.

---

## 📁 Project Structure

```
c:\SMT project/
├── client/
│   ├── src/
│   │   ├── api/             # Unified API service exports
│   │   ├── assets/          # Static branding assets
│   │   ├── components/      # Common, layout, polls, and charts
│   │   │   ├── common/      # SkeletonLoader, LoadingSpinner, AccessDenied, ProtectedRoute
│   │   │   ├── layout/      # Navbar (with mobile toggle), Sidebar (with drawer)
│   │   │   ├── polls/       # PollCard
│   │   │   └── charts/      # ResultChart (Bar & Donut toggles)
│   │   ├── context/         # AuthContext, SettingsContext
│   │   ├── pages/           # Domain-partitioned pages
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── admin/       # AdminDashboard
│   │   │   ├── creator/     # CreatePoll, MyPolls
│   │   │   └── user/        # Dashboard, AvailablePolls, VotePoll, PollResults, History, Profile, Settings
│   │   ├── services/        # Axios interceptors & HTTP client
│   │   ├── utils/           # exportUtils (PDF, Excel, Word export)
│   │   ├── App.jsx          # Route declarations & Suspense code-splitting
│   │   └── index.css        # Tokenized design system
│   ├── vite.config.js       # Vite configuration & Rollup manual chunks
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/          # db.js, env.js (fail-fast validator)
│   │   ├── models/          # User.js, Poll.js, Option.js, Vote.js
│   │   ├── services/        # authService, pollService, voteService, adminService, pollExpiryService
│   │   ├── controllers/     # authController, pollController, voteController, adminController
│   │   ├── middleware/      # authMiddleware, errorMiddleware, rateLimiter, validatorMiddleware
│   │   ├── validators/      # express-validator schemas
│   │   ├── routes/          # authRoutes, pollRoutes, adminRoutes
│   │   ├── sockets/         # socket.js (handshake auth & rooms)
│   │   ├── app.js           # Express app instance (ideal for supertest)
│   │   └── server.js        # Server entry point & listener
│   ├── tests/               # Automated test suites (Jest + Supertest)
│   │   ├── auth.test.js
│   │   ├── rbac.test.js
│   │   ├── pollOwnership.test.js
│   │   ├── votingIntegrity.test.js
│   │   └── validation.test.js
│   ├── scripts/             # setupAdmin.js, testApprovalWorkflow.js, testRBAC.js
│   ├── seed.js              # Database seeder with 8 standard accounts
│   ├── .env.example         # Sanitized configuration template
│   └── package.json
│
└── README.md
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (v6 or higher running locally on `127.0.0.1:27017` or MongoDB Atlas URI)

### 1. Clone & Configure Server
```bash
cd server
cp .env.example .env
```
Edit `server/.env` to ensure appropriate values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/online_polling
JWT_SECRET=your_super_secret_jwt_key_min_16_characters!
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 2. Seed Database
```bash
npm run seed
```
*(Creates 8 demo accounts and pre-populated polls ready for testing).*

### 3. Run Development Servers
**Terminal 1 (Server):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Client):**
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Running Tests

The test suite validates authentication, RBAC, poll ownership isolation, double-voting prevention, and input validation without side effects on production data.

```bash
cd server

# Run complete Jest automated test suite (37 tests across 5 suites)
npm test

# Run approval workflow verification
node scripts/testApprovalWorkflow.js

# Run RBAC security verification
node scripts/testRBAC.js

# Run Phase 2 integrity test suite
node tests/phase2_verify.js
```

---

## 📡 Comprehensive API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register participant or creator (rejects `role: admin`) |
| `POST` | `/api/auth/login` | Public | Login with 7-digit ID or Email & password |
| `GET` | `/api/auth/me` | Bearer Token | Fetch current authenticated user session |

### Polls & Voting (`/api/polls`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/polls` | Admin / Creator | Create poll (starts as `pending` for creators) |
| `GET` | `/api/polls` | Authenticated | List all viewable polls (lean with pagination) |
| `GET` | `/api/polls/active` | Authenticated | List only active, approved, non-expired polls |
| `GET` | `/api/polls/archive` | Authenticated | List closed or expired polls |
| `GET` | `/api/polls/my` | Admin / Creator | List polls created by the logged-in user |
| `GET` | `/api/polls/:id` | Authenticated | Get single poll details with options |
| `PUT` | `/api/polls/:id` | Owner / Admin | Update poll title, description, or expiry |
| `PUT` | `/api/polls/:id/close` | Owner / Admin | Manually close an active poll |
| `PUT` | `/api/polls/:id/status`| Owner / Admin | Toggle poll status between active and closed |
| `DELETE`| `/api/polls/:id` | Owner / Admin | Cascading delete of poll, options, and votes |
| `POST` | `/api/polls/:pollId/vote` | Authenticated | Cast ballot (enforces 1 vote per user) |
| `GET` | `/api/polls/:pollId/results` | Authenticated | Get drift-free live results & winner |
| `GET` | `/api/polls/:pollId/vote-status` | Authenticated | Check if current user has voted |
| `GET` | `/api/polls/:pollId/participants` | Owner / Admin | View full participant audit records |

### Admin Moderation (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin Only | System-wide counts and analytics |
| `GET` | `/api/admin/polls/pending` | Admin Only | Review pending poll approval queue |
| `PUT` | `/api/admin/polls/:id/approve` | Admin Only | Approve and publish a creator poll |
| `PUT` | `/api/admin/polls/:id/reject` | Admin Only | Reject poll with moderation feedback |
| `GET` | `/api/admin/creators` | Admin Only | List all creators with poll statistics |
| `PUT` | `/api/admin/creators/:id/status` | Admin Only | Activate or deactivate creator account |
| `PUT` | `/api/admin/creators/:id/permissions` | Admin Only | Update granular creator permissions |
| `DELETE`| `/api/admin/creators/:id` | Admin Only | Remove creator and cleanup polls |
| `GET` | `/api/admin/users` | Admin Only | Search & paginate all platform accounts |
| `PUT` | `/api/admin/users/:id/role` | Admin Only | Promote or demote user role |
| `PUT` | `/api/admin/users/:id/status` | Admin Only | Deactivate or restore user account |
| `DELETE`| `/api/admin/users/:id` | Admin Only | Delete user account |

---

## 👥 Seed & Demo Accounts

When seeded via `npm run seed`, the following accounts are initialized with password **`User@12345`** (Admin: **`Admin@12345`**):

| Role | Name | Identifier / Voter ID | Email |
|---|---|---|---|
| **Admin** | System Administrator | — | `admin@poll.local` |
| **Creator** | Dr. Alice Walker | — | `creator1@poll.local` |
| **Creator** | Prof. Robert Davis | — | `creator2@poll.local` |
| **Participant** | Priya Sharma | `24104110` | `priya@student.local` |
| **Participant** | Rahul Verma | `24104111` | `rahul@student.local` |
| **Participant** | Ananya Sen | `24104112` | `ananya@student.local` |
| **Participant** | Karthik Raja | `24104113` | `karthik@student.local` |
| **Participant** | Sneha Patel | `24104114` | `sneha@student.local` |

---

## 📄 License
MIT License. Developed for secure, transparent online voting and live classroom/organizational polling.
