# 🗳️ PollLive — Online Polling and Live Voting System

A full-stack MERN application with **real-time voting** powered by Socket.IO, **JWT authentication**, and **MongoDB-enforced duplicate vote prevention**.

---

## 📌 Project Objective

Solve the problems of:
- Manual vote counting
- Delayed result generation
- Duplicate voting
- Difficulty storing poll history

The system automatically calculates results, broadcasts live updates, and permanently stores all poll data.

---

## ✨ Features

- **User Authentication** — Register, Login, JWT sessions, bcrypt password hashing
- **Create Polls** — Dynamic options, expiry date/time, description
- **Cast Votes** — One vote per user per poll (enforced at DB level via compound unique index)
- **Live Results** — Socket.IO broadcasts vote updates to all viewers instantly
- **Poll Management** — View active polls, close polls manually
- **Poll History** — Browse archived/expired polls with final results
- **Charts** — Recharts bar chart visualization
- **Security** — JWT middleware, protected routes, no userId from frontend

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Vanilla CSS (custom design system) |
| Charts | Recharts |
| HTTP Client | Axios |
| Real-Time | Socket.IO Client |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-Time Server | Socket.IO |

---

## 📁 Folder Structure

```
SMT project/
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── pollController.js
│   │   └── voteController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Poll.js
│   │   ├── Option.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── pollRoutes.js
│   ├── socket/
│   │   └── socket.js
│   ├── seed.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── PollCard.jsx
    │   │   ├── ResultChart.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── CreatePoll.jsx
    │   │   ├── AvailablePolls.jsx
    │   │   ├── VotePoll.jsx
    │   │   ├── PollResults.jsx
    │   │   ├── MyPolls.jsx
    │   │   ├── PollHistory.jsx
    │   │   └── Profile.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── vite.config.js
```

---

## ⚙️ Installation

### Prerequisites
- **Node.js** v18 or later
- **MongoDB** running locally on port 27017 (or MongoDB Atlas)
- **npm** v9 or later

### 1. Clone / Open the project

```bash
cd "c:\SMT project"
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## 🔑 Environment Variables

The `server/.env` file is pre-configured. Edit it if needed:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/online_polling
JWT_SECRET=online_polling_jwt_super_secret_key_2024
CLIENT_URL=http://localhost:5173
JWT_EXPIRE=7d
```

> For **MongoDB Atlas**, replace `MONGO_URI` with your Atlas connection string.

---

## 🚀 Running the Project

### Start MongoDB
Make sure MongoDB is running:
```bash
# Windows — start MongoDB service, or run:
mongod
```

### Start Backend
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

### Start Frontend (new terminal)
```bash
cd client
npm run dev
# Frontend starts at http://localhost:5173
```

### Seed Demo Data (optional)
```bash
cd server
npm run seed
```

This creates:
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- 3 active polls + 1 archived poll

---

## 🧪 Testing the Application

### Test 1 — Registration
1. Open `http://localhost:5173/register`
2. Fill in Name, Email, Password, Confirm Password
3. Click **Create Account**
4. Should redirect to Dashboard

### Test 2 — Login
1. Open `http://localhost:5173/login`
2. Enter credentials
3. Click **Sign In**

### Test 3 — Create a Poll
1. Click **Create Poll** in sidebar
2. Enter title: "Which programming language do you prefer?"
3. Add options: Java, Python, JavaScript, C++
4. Set expiry date/time (tomorrow)
5. Click **Create Poll**

### Test 4 — Cast a Vote
1. Go to **Available Polls**
2. Click **Vote** on your poll
3. Select an option
4. Click **Cast Vote**

### Test 5 — Duplicate Vote Prevention
1. Try to vote in the same poll again
2. Expected: "You have already voted in this poll."

### Test 6 — Real-Time Results (Socket.IO)
1. Open the poll results page in **two browser tabs**
2. In a second account (incognito), vote for a different option
3. Watch the first tab update automatically without refresh

### Test 7 — Close a Poll
1. Go to **My Polls**
2. Click **Close Poll** on an active poll
3. Verify it moves to **Poll History**
4. Verify voting is disabled on the poll

---

## 🔌 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user |

### Polls
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/polls` | Create a poll |
| GET | `/api/polls` | Get all polls |
| GET | `/api/polls/active` | Get active polls |
| GET | `/api/polls/archive` | Get archived/closed polls |
| GET | `/api/polls/my` | Get user's own polls |
| GET | `/api/polls/:id` | Get single poll |
| PUT | `/api/polls/:id/close` | Close a poll |

### Votes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/polls/:pollId/vote` | Cast a vote |
| GET | `/api/polls/:pollId/results` | Get poll results |
| GET | `/api/polls/:pollId/vote-status` | Check if user voted |

---

## 🔒 Security Implementation

- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **JWT**: Tokens expire in 7 days, verified on every protected request
- **Duplicate Votes**: Compound unique index `{userId, pollId}` on Vote collection
- **User ID**: Always extracted from JWT token, never trusted from request body
- **Poll Expiry**: Verified server-side before accepting every vote
- **Protected Routes**: All poll and vote endpoints require valid JWT

---

## 📡 Real-Time Architecture

```
User votes
    ↓
React Frontend (Axios POST)
    ↓
Express REST API (/api/polls/:id/vote)
    ↓
MongoDB (Vote saved + Option.voteCount incremented atomically)
    ↓
Socket.IO emits 'voteUpdated' to poll room
    ↓
All clients in that poll room receive the update
    ↓
React updates results chart and progress bars instantly
```

---

## 👥 Demo Accounts (after seeding)

| Name | Email | Password |
|------|-------|----------|
| Alice Johnson | alice@example.com | password123 |
| Bob Smith | bob@example.com | password123 |
