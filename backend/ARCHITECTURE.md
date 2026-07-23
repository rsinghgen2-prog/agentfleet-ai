# AgentFleet AI - System Architecture

## 🏗️ Overview

A highly scalable, multi-tenant SaaS platform supporting various industries (Dental Clinics, Hospitals, Schools, etc.) with role-based access control and microservices architecture.

---

## 🎯 Architecture Pattern

### **Multi-Tenant Strategy: Shared Database, Separate Schema**
- Each tenant gets isolated database schema
- Shared infrastructure for cost efficiency
- Data isolation and security
- Easy scaling and maintenance

### **Microservices Architecture**
```
┌─────────────────────────────────────────────────┐
│              API Gateway (Port 3000)            │
│         (Routing, Rate Limiting, Auth)          │
└────────┬────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
┌───▼────────┐  ┌─────────┐  ┌──────────┐ │
│ Auth       │  │ User    │  │ Tenant   │ │
│ Service    │  │ Service │  │ Service  │ │
│ :3001      │  │ :3002   │  │ :3003    │ │
└────────────┘  └─────────┘  └──────────┘ │
    │                                      │
┌───▼────────┐  ┌─────────┐  ┌──────────┐ │
│ Automation │  │ Payment │  │ Analytics│ │
│ Service    │  │ Service │  │ Service  │ │
│ :3004      │  │ :3005   │  │ :3006    │ │
└────────────┘  └─────────┘  └──────────┘ │
    │                                      │
    └──────────────────────────────────────┘
                     │
         ┌───────────▼──────────┐
         │   PostgreSQL DB      │
         │   (Multi-Schema)     │
         └──────────────────────┘
```

---

## 📊 Database Architecture

### **PostgreSQL Multi-Schema Design**

**Schema Hierarchy:**
```
postgresql://
├── public (Shared)
│   ├── tenants
│   ├── industries
│   ├── subscription_plans
│   └── system_config
│
├── tenant_[id] (Per Tenant)
│   ├── users
│   ├── roles
│   ├── permissions
│   ├── appointments (dental/hospital)
│   ├── patients (dental/hospital)
│   ├── students (school)
│   ├── campaigns
│   ├── contacts
│   ├── messages
│   ├── analytics
│   └── audit_logs
│
└── admin (System)
    ├── super_admins
    ├── system_logs
    └── global_analytics
```

---

## 👥 User Role Hierarchy

### **4-Tier Role System**

**1. Super Admin** (Platform Level)
- Email: `rsingh.gen2@gmail.com`
- Access: ALL tenants, ALL features
- Manage: Tenants, Plans, System settings
- Dashboard: `/super-admin-dashboard`

**2. Admin** (Tenant Level)
- Access: Single tenant, ALL features
- Manage: Users, Settings, Billing
- Dashboard: `/admin-dashboard`

**3. Semi-Admin** (Department Level)
- Access: Limited features in single tenant
- Manage: Assigned departments/modules
- Dashboard: `/semi-admin-dashboard`

**4. Customer/User** (End User)
- Access: Limited to assigned features
- Manage: Own data only
- Dashboard: `/dashboard` or `/dental-dashboard`

---

## 🔐 Authentication & Authorization

### **JWT-Based Auth Flow**

```
User Login
    ↓
Validate Credentials
    ↓
Generate JWT Token
    ├── userId
    ├── tenantId
    ├── role
    ├── permissions[]
    └── expiresIn: 24h
    ↓
Return Token + Refresh Token
    ↓
Store in HTTP-Only Cookie
    ↓
Redirect to Role-Based Dashboard
```

### **Permission Matrix**

| Feature | Super Admin | Admin | Semi-Admin | Customer |
|---------|------------|-------|------------|----------|
| All Tenants | ✅ | ❌ | ❌ | ❌ |
| Tenant Settings | ✅ | ✅ | ❌ | ❌ |
| User Management | ✅ | ✅ | ✅ | ❌ |
| Billing | ✅ | ✅ | ❌ | ❌ |
| Automation | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | View Only |
| System Logs | ✅ | ❌ | ❌ | ❌ |

---

## 🌐 Microservices Breakdown

### **1. API Gateway** (Port 3000)
- Route requests to services
- Rate limiting
- JWT validation
- Load balancing
- CORS handling

### **2. Auth Service** (Port 3001)
- User authentication
- Token generation/validation
- Password reset
- Session management
- OAuth integration (future)

### **3. User Service** (Port 3002)
- User CRUD operations
- Profile management
- Role assignment
- Permission management

### **4. Tenant Service** (Port 3003)
- Tenant onboarding
- Schema creation
- Industry-specific setup
- Tenant settings
- Subscription management

### **5. Automation Service** (Port 3004)
- WhatsApp/SMS campaigns
- Contact management
- Message templates
- Scheduling
- Analytics

### **6. Payment Service** (Port 3005)
- Subscription billing
- Payment processing
- Invoice generation
- Payment history

### **7. Analytics Service** (Port 3006)
- Usage metrics
- Performance analytics
- Report generation
- Data aggregation

---

## 📁 Project Structure

```
agentfleet-ai/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/        # API clients
│   │   └── config/
│   └── package.json
│
├── backend/
│   ├── api-gateway/         # Port 3000
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── auth-service/        # Port 3001
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── user-service/        # Port 3002
│   ├── tenant-service/      # Port 3003
│   ├── automation-service/  # Port 3004
│   ├── payment-service/     # Port 3005
│   └── analytics-service/   # Port 3006
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
└── docker-compose.yml
```

---

## 🔄 Data Flow Example

### **User Login → Dashboard**

```
1. User enters credentials on /login
2. Frontend → API Gateway → Auth Service
3. Auth Service validates against tenant schema
4. Generate JWT with role & permissions
5. Return token + user profile
6. Frontend stores token
7. Check user role:
   - Super Admin → /super-admin-dashboard
   - Admin → /admin-dashboard
   - Semi-Admin → /semi-admin-dashboard
   - Customer (Dental) → /dental-dashboard
   - Customer (General) → /dashboard
8. Load dashboard data via respective services
```

---

## 🔧 Technology Stack

### **Backend:**
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 15+
- **ORM:** Prisma / TypeORM
- **Authentication:** JWT + bcrypt
- **API:** RESTful + GraphQL (future)
- **Queue:** Bull (Redis)
- **Cache:** Redis
- **Validation:** Joi / Zod

### **Frontend:**
- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State:** Context API / Zustand
- **API Client:** Axios
- **Forms:** React Hook Form
- **Validation:** Zod

### **DevOps:**
- **Containers:** Docker
- **Orchestration:** Docker Compose / Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** Winston + ELK Stack

---

## 🚀 Scalability Features

### **Horizontal Scaling:**
- Stateless microservices
- Load balancer ready
- Database read replicas
- Redis caching layer

### **Performance:**
- Connection pooling
- Query optimization
- Lazy loading
- CDN for static assets

### **Security:**
- JWT with short expiry
- Refresh token rotation
- Rate limiting per tenant
- SQL injection prevention
- XSS protection
- CORS configured

---

**Version:** 1.0  
**Updated:** July 23, 2026
