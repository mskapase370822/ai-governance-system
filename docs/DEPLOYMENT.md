# AI Governance System — Deployment Guide

## Prerequisites

- Node.js 18+ (backend)
- Node.js 18+ (frontend)
- MongoDB 6+ (or MongoDB Atlas)
- Docker + Docker Compose (optional)

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

### Required Variables

| Variable       | Description                         | Example                              |
|----------------|-------------------------------------|--------------------------------------|
| `MONGO_URI`    | MongoDB connection string           | `mongodb://localhost:27017/ai-gov`   |
| `JWT_SECRET`   | Secret for signing JWT tokens       | (generate with `openssl rand -hex 32`) |

### Optional Variables

| Variable              | Default              | Description                         |
|-----------------------|----------------------|-------------------------------------|
| `PORT`                | `5000`               | Server port                         |
| `NODE_ENV`            | `development`        | `development` or `production`       |
| `FRONTEND_URL`        | `http://localhost:5173` | Allowed CORS origins             |
| `JWT_EXPIRES_IN`      | `1d`                 | Access token expiry                 |
| `JWT_REFRESH_SECRET`  | Same as JWT_SECRET   | Refresh token secret                |
| `JWT_REFRESH_EXPIRES_IN` | `7d`            | Refresh token expiry                |
| `ENCRYPTION_KEY`      | (dev fallback)       | 64-char hex or passphrase for AES   |
| `ML_SERVICE_URL`      | `http://localhost:8000` | Python ML service URL            |
| `LOG_LEVEL`           | `info`               | `error`, `warn`, `info`, `debug`    |
| `SMTP_HOST`           | —                    | Email server host                   |
| `SMTP_PORT`           | `587`                | Email server port                   |
| `SMTP_USER`           | —                    | SMTP username                       |
| `SMTP_PASS`           | —                    | SMTP password                       |

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit with your values
npm run dev            # nodemon — auto-reload on change
```

Server starts at `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

### Python ML Service (optional)

```bash
cd backend
pip install fastapi uvicorn pydantic
uvicorn ml_service:app --reload --port 8000
```

---

## Docker Deployment

### Build and Start All Services

```bash
# From project root
docker-compose up --build -d
```

This starts:
- MongoDB on port 27017
- Backend API on port 5000

### Check Logs

```bash
docker-compose logs -f backend
docker-compose logs -f mongo
```

### Stop Services

```bash
docker-compose down
docker-compose down -v   # Also remove volumes (data)
```

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (32+ random bytes)
- [ ] Set `ENCRYPTION_KEY` (64 hex chars or passphrase)
- [ ] Use MongoDB Atlas or a managed MongoDB with auth
- [ ] Set `FRONTEND_URL` to your actual frontend domain
- [ ] Configure HTTPS via nginx/Caddy/cloud load balancer
- [ ] Set up log rotation / aggregation (e.g., CloudWatch, Datadog)
- [ ] Enable MongoDB authentication and network restrictions
- [ ] Configure email SMTP for alerts

---

## Health Monitoring

### Liveness Probe

```bash
curl http://localhost:5000/health
# → {"status":"ok","service":"ai-governance-backend","timestamp":"..."}
```

### Readiness Probe (includes DB status)

```bash
curl http://localhost:5000/health/detailed
```

Returns `200` if healthy, `503` if degraded.

---

## API Access

### Authentication Flow

1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login` → returns JWT
3. Use JWT: `Authorization: Bearer <token>`

### Quick Test

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}' | jq -r .token)

# 2. Submit a prompt
curl -X POST http://localhost:5000/api/v1/prompts/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"SELECT * FROM users WHERE email='\''test@example.com'\'''}'

# 3. Check health
curl http://localhost:5000/health/detailed
```

---

## Database Seeding

```bash
cd backend
node seed.js   # Creates admin user and sample data
```

---

## Scaling Considerations

- **Horizontal scaling**: The backend is stateless (JWT auth) — multiple instances can run behind a load balancer
- **WebSocket scaling**: Use Redis adapter for Socket.io when running multiple instances
- **MongoDB**: Use replica sets for high availability; connection pooling is handled by Mongoose
- **Background jobs**: In multi-instance deployments, use a distributed job queue (e.g., Bull) instead of cron
- **Rate limiting**: In multi-instance deployments, use a Redis-backed rate limiter
