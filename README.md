# AI Governance System

A full-stack AI activity governance and monitoring platform built with **Node.js**, **React**, and **MongoDB**. It tracks employee AI usage, analyses risk in real-time using a rule-based ML engine, enforces configurable policies, and provides an admin dashboard for oversight.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Role-Based Access](#role-based-access)

---

## Features

- **JWT Authentication** with role-based access (Admin / Employee)
- **Real-time risk analysis** — every submitted activity is scored as LOW / MEDIUM / HIGH
- **Policy engine** — admins create configurable governance policies (keyword blocks, time restrictions, rate limits)
- **Approval workflow** — HIGH-risk activities are blocked and routed for admin review
- **Live alerts** via Socket.io WebSockets
- **Email notifications** for HIGH-risk activities (Nodemailer)
- **Audit log** — every admin action is recorded (who, what, when)
- **Prometheus metrics** endpoint for monitoring
- **PDF report generation** with scheduled daily emails
- **System health dashboard** with SLA tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, Mongoose 7 |
| Frontend | React 19, Vite, React Router 7, Recharts |
| Database | MongoDB 7 |
| Real-time | Socket.io 4 |
| Security | Helmet, express-rate-limit, bcryptjs, JWT |
| ML / Risk | Rule-based engine + optional Python ML microservice |

---

## Project Structure

```
ai-governance-system/
├── backend/
│   ├── controllers/        # Route handler logic
│   ├── middleware/         # Auth, rate-limit, validation, metrics
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── services/           # Email, reports, scheduled tasks
│   ├── utils/              # Token generation, risk analysis, audit logger
│   ├── ml/                 # In-process risk model
│   ├── .env.example        # Environment variable template
│   ├── Dockerfile
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # AuthContext (global auth state)
│   │   ├── hooks/          # useAuth, useLogs
│   │   ├── pages/          # Full page views
│   │   └── services/       # Axios API client
│   └── index.html
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- MongoDB 7 running locally (or use Docker)

### 1. Clone & set up environment

```bash
git clone https://github.com/mskapase370822/ai-governance-system.git
cd ai-governance-system

cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

### 2. Install backend dependencies

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:5000
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
npm run dev        # starts on http://localhost:5173
```

### 4. Seed the database (optional)

```bash
cd backend
node seed.js
```

---

## Docker Setup

Start the entire stack (MongoDB + backend) with one command:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — MONGO_URI will be overridden by docker-compose

docker compose up --build
```

Backend will be available at `http://localhost:5000`.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (min 32 chars) |
| `PORT` | — | Server port (default: 5000) |
| `NODE_ENV` | — | `development` or `production` |
| `FRONTEND_URL` | — | Comma-separated allowed CORS origins (default: `http://localhost:5173`) |
| `EMAIL_SERVICE` | — | Nodemailer transport (e.g. `gmail`) |
| `EMAIL_USER` | — | Sender email address |
| `EMAIL_PASSWORD` | — | Email app password |
| `ADMIN_EMAIL` | — | Fallback admin email for alerts |
| `ML_SERVICE_URL` | — | External Python ML service URL (optional) |
| `SLA_TARGET_MS` | — | Response time SLA target in ms (default: 200) |
| `SLA_COMPLIANCE_TARGET` | — | SLA compliance % target (default: 99.5) |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login (rate-limited: 10/15min) |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/role` | Admin | Update a user's role |

### Activity — `/api/activity`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submit` | Employee | Submit text for risk analysis |
| GET | `/me` | Employee | Get own activity history |
| GET | `/all` | Admin | Get all activities |
| GET | `/filter` | Admin | Filter activities (riskLevel, status, date, search) |
| GET | `/stats/dashboard` | Admin | Risk statistics summary |
| GET | `/stats/charts` | Admin | Chart data (trend, distribution, heatmap) |
| GET | `/:id` | Admin | Get single activity |
| PUT | `/:id/flag` | Admin | Flag an activity |
| PUT | `/:id/approve` | Admin | Approve an activity |
| PUT | `/:id/block` | Admin | Block an activity |

### Policies — `/api/policies`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Any | List all policies |
| GET | `/:id` | Any | Get single policy |
| POST | `/` | Admin | Create a policy |
| PUT | `/:id` | Admin | Update a policy |
| PUT | `/:id/toggle` | Admin | Toggle policy active/inactive |
| DELETE | `/:id` | Admin | Delete a policy |

### Approvals — `/api/approvals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/pending` | Admin | Get pending approvals |
| GET | `/all` | Admin | Get all approvals |
| GET | `/me` | Employee | Get own approval requests |
| PUT | `/:id/approve` | Admin | Approve a request |
| PUT | `/:id/deny` | Admin | Deny a request |

### Audit Log — `/api/audit`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | List admin audit log entries |

### Other

| Prefix | Description |
|---|---|
| `/api/logs` | AI action logs |
| `/api/alerts` | System alerts |
| `/api/analytics` | Dashboard analytics |
| `/api/reports` | PDF report export |
| `/api/metrics` | Prometheus/system metrics |
| `/api/ml` | ML model stats and training |

---

## Role-Based Access

| Feature | Employee | Admin |
|---|---|---|
| Submit activity for analysis | ✅ | ✅ |
| View own activity history | ✅ | ✅ |
| View all activities | ❌ | ✅ |
| Approve / block / flag activities | ❌ | ✅ |
| Manage policies | ❌ | ✅ |
| Review approval requests | ❌ | ✅ |
| View audit log | ❌ | ✅ |
| View system health & metrics | ❌ | ✅ |
| Generate & schedule reports | ❌ | ✅ |
