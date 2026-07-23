# 🚀 Deployment Guide - AgentFleet AI

## Prerequisites

- **Node.js**: 20.x or higher
- **PostgreSQL**: 15.x or higher  
- **Redis**: 7.x or higher
- **Docker** (optional): 24.x or higher
- **Docker Compose** (optional): 2.x or higher

---

## 🐳 Option 1: Docker Deployment (Recommended)

### **1. Clone Repository**
```bash
git clone <repository-url>
cd agentfleet-ai/backend
```

### **2. Environment Setup**
Create `.env` file in each service directory:

**backend/auth-service/.env:**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/agentfleet
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS
JWT_REFRESH_SECRET=your-super-secret-refresh-key-CHANGE-THIS
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://your-frontend-domain.com
```

**backend/automation-service/.env:**
```env
TWILIO_ACCOUNT_SID=your_actual_twilio_sid
TWILIO_AUTH_TOKEN=your_actual_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**backend/payment-service/.env:**
```env
STRIPE_SECRET_KEY=sk_live_xxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### **3. Build and Start Services**
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### **4. Initialize Database**
```bash
# Database will be initialized automatically on first run
# Schemas are applied from docker-entrypoint-initdb.d

# To reinitialize (WARNING: This will delete all data)
docker-compose down -v
docker-compose up -d
```

### **5. Verify Services**
```bash
# Check health endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Tenant Service
curl http://localhost:3004/health  # Automation Service
curl http://localhost:3005/health  # Payment Service
curl http://localhost:3006/health  # Analytics Service
```

---

## 💻 Option 2: Manual Deployment

### **1. Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# macOS
brew install postgresql@15

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

### **2. Create Database**
```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE agentfleet;

# Create user
CREATE USER agentfleet_user WITH PASSWORD 'strong_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE agentfleet TO agentfleet_user;

# Exit
\q
```

### **3. Initialize Schema**
```bash
psql -U agentfleet_user -d agentfleet -f database/schema.sql
```

### **4. Install Redis**
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis  # macOS
```

### **5. Install Node.js Services**
```bash
# For each service directory
cd auth-service
npm install
npm run build
npm start

# Repeat for:
# - user-service
# - tenant-service
# - automation-service
# - payment-service
# - analytics-service
```

### **6. Use PM2 for Process Management**
```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: './auth-service/dist/server.js',
      instances: 2,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'user-service',
      script: './user-service/dist/server.js',
      instances: 2,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
    // ... add other services
  ]
};
```

---

## 🌍 Production Deployment

### **1. Use Environment Variables**
Never hardcode secrets. Use environment variables:

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="$(openssl rand -base64 32)"
export JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
```

### **2. Setup Nginx Reverse Proxy**
```nginx
# /etc/nginx/sites-available/agentfleet

upstream api_gateway {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.agentfleet.ai;

    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### **3. SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.agentfleet.ai
```

### **4. Database Backups**
```bash
# Automated daily backups
0 2 * * * pg_dump -U agentfleet_user agentfleet > /backups/agentfleet_$(date +\%Y\%m\%d).sql
```

### **5. Monitoring**

**Install Prometheus:**
```bash
docker run -d -p 9090:9090 prom/prometheus
```

**Install Grafana:**
```bash
docker run -d -p 3007:3000 grafana/grafana
```

---

## 🔧 Configuration

### **API Gateway Rate Limiting**
```typescript
// api-gateway/src/middleware/rateLimiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});
```

### **Database Connection Pooling**
```typescript
// config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 📊 Health Checks & Monitoring

### **Service Health Check**
```bash
#!/bin/bash
# healthcheck.sh

services=("3000" "3001" "3002" "3003" "3004" "3005" "3006")

for port in "${services[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  if [ $response -eq 200 ]; then
    echo "✅ Service on port $port is healthy"
  else
    echo "❌ Service on port $port is down"
  fi
done
```

### **Database Health**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_database_size('agentfleet') / 1024 / 1024 AS size_mb;

-- Check slow queries
SELECT query, calls, total_time / calls AS avg_time
FROM pg_stat_statements
ORDER BY avg_time DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### **Service Won't Start**
```bash
# Check logs
docker-compose logs service-name

# Check port conflicts
netstat -an | grep 3001

# Restart specific service
docker-compose restart auth-service
```

### **Database Connection Errors**
```bash
# Test connection
psql -U postgres -h localhost -d agentfleet

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection limits
SHOW max_connections;
```

### **Redis Connection Issues**
```bash
# Test Redis
redis-cli ping

# Check Redis status
redis-cli info server
```

---

## 📈 Scaling

### **Horizontal Scaling**
```yaml
# docker-compose.override.yml
services:
  auth-service:
    deploy:
      replicas: 3
```

### **Load Balancer**
Add Nginx or HAProxy in front of services.

### **Database Scaling**
- Read replicas for heavy read operations
- Partition large tables by date
- Use connection pooling (PgBouncer)

---

## ✅ Pre-Launch Checklist

- [ ] Change all default passwords
- [ ] Update JWT secrets
- [ ] Configure CORS for production domain
- [ ] Enable SSL/TLS
- [ ] Setup automated backups
- [ ] Configure monitoring & alerts
- [ ] Load test critical endpoints
- [ ] Review security headers
- [ ] Setup logging aggregation
- [ ] Document runbook procedures

---

**Version:** 1.0  
**Last Updated:** July 23, 2026
