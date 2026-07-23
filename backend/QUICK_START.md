# 🚀 Quick Start Guide - 5 Minutes to Running Platform

## Prerequisites Check
```bash
# Check Node.js (need 20+)
node --version

# Check Docker (optional but recommended)
docker --version
docker-compose --version
```

---

## ⚡ Option 1: Docker (Fastest - Recommended)

### **Step 1: Start Services** (2 minutes)
```bash
cd backend
docker-compose up -d
```

### **Step 2: Verify** (30 seconds)
```bash
# Check all services are running
docker-compose ps

# Test API Gateway
curl http://localhost:3000/health

# Test Auth Service
curl http://localhost:3001/health
```

### **Step 3: Test Login** (1 minute)
```bash
# Super Admin Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rsingh.gen2@gmail.com",
    "password": "Aug@2026"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    },
    "dashboardRoute": "/super-admin-dashboard"
  }
}
```

### **Done! ✅**
Your backend is running:
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 💻 Option 2: Manual Setup (Development)

### **Step 1: Install PostgreSQL**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt install postgresql-15
sudo systemctl start postgresql
```

### **Step 2: Create Database**
```bash
# Access PostgreSQL
psql postgres

# Run these commands:
CREATE DATABASE agentfleet;
CREATE USER agentfleet_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE agentfleet TO agentfleet_user;
\q
```

### **Step 3: Initialize Schema**
```bash
cd backend
psql -U agentfleet_user -d agentfleet -f database/schema.sql
```

### **Step 4: Install Redis**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis
```

### **Step 5: Start Auth Service**
```bash
cd backend/auth-service

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://agentfleet_user:dev_password@localhost:5432/agentfleet
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
EOF

# Build and start
npm run build
npm start
```

### **Step 6: Verify**
```bash
# In a new terminal
curl http://localhost:3001/health
```

---

## 🎨 Frontend Setup

### **Update Login Page**

**File: `src/pages/Login.tsx`**

Add tenant slug input:
```tsx
{/* Add before email field */}
<div className="mb-4">
  <label>Organization</label>
  <input
    type="text"
    placeholder="your-organization"
    value={credentials.tenantSlug}
    onChange={(e) => setCredentials({...credentials, tenantSlug: e.target.value})}
  />
  <p className="text-xs">Leave empty for super admin</p>
</div>
```

Update submit handler:
```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      navigate(data.data.dashboardRoute);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## 🧪 Testing the Flow

### **1. Super Admin Login**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rsingh.gen2@gmail.com",
    "password": "Aug@2026"
  }'
```

### **2. Create a Tenant** (Future - Once Tenant Service is Complete)
```bash
curl -X POST http://localhost:3003/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Dental Clinic",
    "slug": "test-dental",
    "industryCode": "dental",
    "email": "admin@testdental.com"
  }'
```

### **3. Tenant User Login**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testdental.com",
    "password": "temp_password",
    "tenantSlug": "test-dental"
  }'
```

---

## 🔍 Troubleshooting

### **Service Won't Start**
```bash
# Check logs
docker-compose logs auth-service

# Restart service
docker-compose restart auth-service
```

### **Database Connection Error**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
psql -U postgres -h localhost -d agentfleet
```

### **Port Already in Use**
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

---

## 📊 View Database

### **Connect to PostgreSQL**
```bash
# Via Docker
docker exec -it agentfleet-postgres psql -U postgres agentfleet

# Or directly
psql -U agentfleet_user -d agentfleet
```

### **Useful Queries**
```sql
-- List all schemas
SELECT schema_name FROM information_schema.schemata;

-- List all tenants
SELECT id, name, slug, subscription_status FROM public.tenants;

-- List super admins
SELECT id, email, full_name FROM public.super_admins;

-- Check tenant users (replace with actual schema name)
SELECT id, email, full_name, role FROM tenant_uuid.users;
```

---

## 📦 Project Structure
```
backend/
├── database/
│   ├── schema.sql              # Public schema
│   └── tenant-schema.sql       # Tenant template
├── auth-service/               # Port 3001
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── api-gateway/                # Port 3000
├── user-service/               # Port 3002
├── tenant-service/             # Port 3003
├── automation-service/         # Port 3004
├── payment-service/            # Port 3005
├── analytics-service/          # Port 3006
└── docker-compose.yml
```

---

## ✅ Success Checklist

After setup, verify:

- [ ] PostgreSQL running (port 5432)
- [ ] Redis running (port 6379)
- [ ] Auth service health check passes
- [ ] Super admin can login
- [ ] JWT token is returned
- [ ] Frontend can connect to API
- [ ] Dashboard route is returned

---

## 🎯 Next Steps

1. **Complete Other Services** - Implement User, Tenant, etc.
2. **Create Tenants** - Add test organizations
3. **Test User Roles** - Create admin, semi-admin, users
4. **Frontend Integration** - Update all dashboards
5. **Test End-to-End** - Full user flow

---

## 📞 Need Help?

**Check Documentation:**
- `ARCHITECTURE.md` - System design
- `DATABASE_MODELS.md` - Database structure
- `API_DOCUMENTATION.md` - API reference
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `FRONTEND_INTEGRATION.md` - Frontend guide

**Common Issues:**
- Port conflicts → Change ports in docker-compose.yml
- Database errors → Check DATABASE_URL in .env
- CORS errors → Update CORS_ORIGIN in .env

---

**You're ready to build! 🚀**
