# 🌐 API Documentation - AgentFleet AI

## Base URLs

```
API Gateway:         http://localhost:3000
Auth Service:        http://localhost:3001
User Service:        http://localhost:3002
Tenant Service:      http://localhost:3003
Automation Service:  http://localhost:3004
Payment Service:     http://localhost:3005
Analytics Service:   http://localhost:3006
```

---

## 🔐 Authentication

All API requests (except login/register) require JWT token in header:
```http
Authorization: Bearer {access_token}
```

---

## 📋 Auth Service API

### **1. Login**

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenantSlug": "dental-clinic-123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "admin",
      "permissions": ["users.read", "appointments.create"]
    },
    "tenant": {
      "id": "uuid",
      "slug": "dental-clinic-123"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    },
    "dashboardRoute": "/admin-dashboard"
  }
}
```

**Dashboard Routes by Role:**
- `super_admin` → `/super-admin-dashboard`
- `admin` → `/admin-dashboard`
- `semi_admin` → `/semi-admin-dashboard`
- `doctor/dentist` → `/dental-dashboard`
- `teacher` → `/school-dashboard`
- `customer` → `/dashboard`

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (missing fields)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (account suspended)
- `404` - Not Found (tenant not found)

---

### **2. Super Admin Login**

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "rsingh.gen2@gmail.com",
  "password": "Aug@2026"
}
```

**Notes:**
- No `tenantSlug` required
- Has access to ALL tenants
- Returns `isSuperAdmin: true` in token
- All permissions granted

---

### **3. Refresh Token**

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token_here"
  }
}
```

---

### **4. Logout**

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 User Service API

### **1. Get Current User**

**Endpoint:** `GET /api/v1/users/me`

**Headers:**
```http
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": "admin",
    "department": null,
    "permissions": [...],
    "isActive": true,
    "lastLoginAt": "2026-07-23T10:00:00Z"
  }
}
```

---

### **2. List Users (Admin/Semi-Admin)**

**Endpoint:** `GET /api/v1/users`

**Query Parameters:**
```
?page=1
&limit=20
&role=customer
&search=john
&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### **3. Create User (Admin Only)**

**Endpoint:** `POST /api/v1/users`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "fullName": "Jane Smith",
  "phone": "+1234567890",
  "role": "semi_admin",
  "department": "Reception",
  "permissions": ["appointments.read", "patients.read"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "fullName": "Jane Smith"
  }
}
```

---

### **4. Update User**

**Endpoint:** `PATCH /api/v1/users/:userId`

**Request Body:**
```json
{
  "fullName": "Jane Doe",
  "phone": "+0987654321",
  "permissions": ["appointments.read", "appointments.create"]
}
```

---

### **5. Delete User (Soft Delete)**

**Endpoint:** `DELETE /api/v1/users/:userId`

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## 🏢 Tenant Service API

### **1. Create Tenant (Super Admin)**

**Endpoint:** `POST /api/v1/tenants`

**Request Body:**
```json
{
  "name": "SmileCare Dental Clinic",
  "slug": "smilecare-dental",
  "industryCode": "dental",
  "subscriptionPlanCode": "starter",
  "email": "admin@smilecare.com",
  "phone": "+1234567890",
  "address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "postalCode": "10001"
  },
  "adminUser": {
    "email": "admin@smilecare.com",
    "password": "AdminPass123!",
    "fullName": "Dr. John Smith"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "SmileCare Dental Clinic",
      "slug": "smilecare-dental",
      "schemaName": "tenant_uuid",
      "subscriptionStatus": "trial"
    },
    "admin": {
      "id": "uuid",
      "email": "admin@smilecare.com",
      "tempPassword": "AdminPass123!"
    }
  }
}
```

**What Happens:**
1. Create record in `public.tenants`
2. Create new schema: `tenant_{uuid}`
3. Execute `tenant-schema.sql` in new schema
4. Create admin user in tenant schema
5. Send welcome email

---

### **2. List Tenants (Super Admin)**

**Endpoint:** `GET /api/v1/tenants`

**Query Parameters:**
```
?page=1
&limit=20
&industryCode=dental
&subscriptionStatus=active
&search=smile
```

---

### **3. Get Tenant Details**

**Endpoint:** `GET /api/v1/tenants/:tenantId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "SmileCare Dental",
    "slug": "smilecare-dental",
    "industry": {
      "name": "Dental Clinic",
      "code": "dental"
    },
    "subscription": {
      "plan": "Starter",
      "status": "active",
      "startsAt": "2026-01-01",
      "endsAt": "2027-01-01"
    },
    "stats": {
      "totalUsers": 12,
      "totalPatients": 458,
      "messagesThisMonth": 2450
    }
  }
}
```

---

### **4. Update Tenant**

**Endpoint:** `PATCH /api/v1/tenants/:tenantId`

---

### **5. Suspend Tenant (Super Admin)**

**Endpoint:** `POST /api/v1/tenants/:tenantId/suspend`

---

## 💬 Automation Service API

### **1. Send Campaign**

**Endpoint:** `POST /api/v1/campaigns`

**Request Body:**
```json
{
  "name": "Monthly Newsletter",
  "messageType": "whatsapp",
  "messageContent": "Hello {name}, your appointment is on {date}",
  "targetContacts": ["uuid1", "uuid2"],
  "scheduledAt": "2026-07-25T10:00:00Z"
}
```

---

### **2. List Campaigns**

**Endpoint:** `GET /api/v1/campaigns`

---

### **3. Campaign Stats**

**Endpoint:** `GET /api/v1/campaigns/:campaignId/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1000,
    "delivered": 950,
    "failed": 50,
    "read": 720,
    "deliveryRate": 95.0,
    "readRate": 72.0,
    "totalCost": 45.50
  }
}
```

---

## 💳 Payment Service API

### **1. Create Invoice**

**Endpoint:** `POST /api/v1/invoices`

---

### **2. Process Payment**

**Endpoint:** `POST /api/v1/payments`

**Request Body:**
```json
{
  "invoiceId": "uuid",
  "amount": 500.00,
  "currency": "USD",
  "paymentMethod": "card",
  "paymentProvider": "stripe",
  "cardToken": "tok_visa"
}
```

---

## 📊 Analytics Service API

### **1. Dashboard Stats**

**Endpoint:** `GET /api/v1/analytics/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "todayAppointments": 24,
    "waitingPatients": 5,
    "totalPatients": 1247,
    "monthlyRevenue": 125480,
    "messagesSent": 2450,
    "deliveryRate": 98.5
  }
}
```

---

## 🔒 Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional details"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Invalid or expired token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## 🚀 Rate Limiting

**Limits per IP:**
- Login: 5 requests / 15 minutes
- Registration: 3 requests / hour
- API calls: 100 requests / minute
- Campaign creation: 10 requests / hour

---

**Version:** 1.0  
**Last Updated:** July 23, 2026
