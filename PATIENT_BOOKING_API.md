# Patient Booking API — Complete Guide

**Version:** 1.0  
**Deployed:** Cloudflare Workers (Hyperdrive + Neon Postgres)  
**Last Updated:** 2026-09-03  
**Status:** ✅ Production Ready  

---

## Overview

The Patient Booking API enables seamless patient registration and appointment scheduling from **any client** (mobile apps, web portals, third-party integrations, kiosks). It supports multi-tenant isolation, duplicate detection, and atomic transactions.

---

## Endpoints

### 1. **Create Patient Booking** ⭐ PRIMARY ENDPOINT

```
POST /api/v1/patients/bookings
```

**Purpose:** Create a new patient + appointment in one atomic transaction with automatic duplicate detection.

#### Authentication
- **Required:** Yes (JWT Bearer token)
- **Header:** `Authorization: Bearer <jwt_token>`
- **Scoped by:** Tenant ID (extracted from JWT)

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9000000001",
  "email": "john@example.com",
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "appointmentDate": "2026-09-10",
  "appointmentTime": "14:30",
  "duration": 30,
  "appointmentType": "Checkup",
  "status": "scheduled",
  "reason": "Regular dental checkup",
  "notes": "Patient has sensitive teeth",
  "followUpRequired": true,
  "followUpDate": "2026-10-10"
}
```

#### Field Validation

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `firstName` | string | ✅ | 1-100 chars, trimmed |
| `lastName` | string | ✅ | 1-100 chars, trimmed |
| `phone` | string | ✅ | 1-50 chars, any format (will be stored as-is) |
| `email` | string | ✅ | Valid email format |
| `dateOfBirth` | string | ❌ | ISO date (YYYY-MM-DD) |
| `gender` | string | ❌ | Max 30 chars |
| `appointmentDate` | string | ✅ | ISO date (YYYY-MM-DD) |
| `appointmentTime` | string | ✅ | 24-hour format (HH:mm or HH:mm:ss) |
| `duration` | number | ❌ | 5-480 minutes, default 30 |
| `appointmentType` | string | ✅ | 1-100 chars (e.g., "Checkup", "Cleaning") |
| `status` | enum | ❌ | `scheduled` \| `confirmed`, default `scheduled` |
| `reason` | string | ❌ | Max 2000 chars |
| `notes` | string | ❌ | Max 5000 chars |
| `followUpRequired` | boolean | ❌ | Default false |
| `followUpDate` | string | ❌ | ISO date (YYYY-MM-DD) |

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "appointmentId": "660e8400-e29b-41d4-a716-446655440111",
    "appointmentDate": "2026-09-10",
    "appointmentTime": "14:30",
    "patientStatus": "created",
    "patientName": "John Doe",
    "patientPhone": "+91-9000000001",
    "patientEmail": "john@example.com",
    "message": "New patient created and booking confirmed."
  }
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `patientId` | UUID of the patient (new or existing) |
| `appointmentId` | UUID of the created appointment |
| `appointmentDate` | Confirmed appointment date |
| `appointmentTime` | Confirmed appointment time |
| `patientStatus` | `created` = new patient, `existing` = reused patient |
| `patientName` | Full name of the patient |
| `patientPhone` | Phone number on record |
| `patientEmail` | Email on record |
| `message` | User-friendly confirmation message |

#### Error Responses

**400 Bad Request — Validation Failed**
```json
{
  "success": false,
  "message": "Validation failed",
  "issues": [
    {
      "code": "invalid_string",
      "expected": "email",
      "received": "string",
      "path": ["email"],
      "message": "Invalid email"
    }
  ]
}
```

**409 Conflict — Appointment Slot Taken**
```json
{
  "success": false,
  "message": "Appointment slot is already booked"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to create booking"
}
```

---

### 2. **Create Patient Only**

```
POST /api/v1/patients
```

**Purpose:** Register a new patient without creating an appointment.

#### Request Body
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+91-9000000002",
  "dateOfBirth": "1985-05-20",
  "gender": "Female",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "notes": "Referred by Dr. X"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+91-9000000002",
    "created_at": "2026-09-03T10:00:00.000Z"
  }
}
```

---

### 3. **Create Appointment Only**

```
POST /api/v1/appointments
```

**Purpose:** Create an appointment for an existing patient.

#### Request Body
```json
{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "appointmentDate": "2026-09-10",
  "appointmentTime": "14:30",
  "duration": 30,
  "appointmentType": "Cleaning",
  "status": "confirmed"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "appointment_date": "2026-09-10",
    "appointment_time": "14:30",
    "status": "confirmed",
    "created_at": "2026-09-03T10:00:00.000Z"
  }
}
```

---

### 4. **Get Patients List**

```
GET /api/v1/patients?search=john&limit=25&offset=0
```

**Query Parameters:**
- `search` (optional): Filter by first name, last name, phone, or email
- `limit` (optional, default 25): Results per page (max 100)
- `offset` (optional, default 0): Pagination offset

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+91-9000000001",
      "last_visit": "2026-08-25",
      "next_appointment": "2026-09-10"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 25,
    "offset": 0
  }
}
```

---

## Duplicate Detection Logic

### How It Works

When a booking is submitted, the API checks for an **existing patient** by:

```sql
SELECT id FROM patients 
WHERE is_active 
AND (email = $1 OR phone = $2)
```

**Result:**
- ✅ **Match found:** Reuses existing patient, creates new appointment
- ❌ **No match:** Creates new patient, then creates appointment

### Examples

#### Scenario 1: New Patient
```
Request: email="alice@example.com", phone="+91-9000000010"
Database: (no match)
Result: ✅ New patient created + appointment created
Response: patientStatus = "created"
```

#### Scenario 2: Existing Patient — Same Email/Phone
```
Request 1: email="bob@example.com", phone="+91-9000000020" → New patient
Request 2: email="bob@example.com", phone="+91-9000000020" → Same request
Result: ✅ Reuses patient from Request 1, creates new appointment
Response: patientStatus = "existing"
Message: "Booking confirmed for existing patient Bob Smith."
```

#### Scenario 3: Existing Patient — Phone Only Match
```
Request: email="new@example.com", phone="+91-9000000020" (phone matched existing)
Result: ✅ Reuses existing patient by phone
Response: patientStatus = "existing"
Database: Patient record shows new email = "new@example.com" (if not set before)
```

### Important Notes

⚠️ **OR Logic (Email OR Phone):** If either email OR phone matches, the patient is reused. This is intentional for re-booking scenarios but means:

- A patient can be looked up by phone alone
- A patient can be looked up by email alone
- **Name mismatches are allowed** (fuzzy matching)

For **strict deduplication**, consider adding:
1. Name verification (Levenshtein distance < 2)
2. Blocking logic instead of reusing
3. Admin approval flow

---

## API Usage Examples

### cURL Examples

**1. Create Booking (New Patient)**
```bash
curl -X POST https://your-api.example.com/api/v1/patients/bookings \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9000000001",
    "email": "john@example.com",
    "appointmentDate": "2026-09-10",
    "appointmentTime": "14:30",
    "appointmentType": "Checkup"
  }'
```

**2. Create Booking (Existing Patient)**
```bash
# Same request as above — API detects duplicate by phone/email
# Returns patientStatus: "existing" and reuses patient ID
```

### JavaScript/TypeScript

```typescript
const bookPatient = async (patientData) => {
  const response = await fetch('/api/v1/patients/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patientData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Booking failed:', result.message);
    return;
  }

  const { patientStatus, patientName, message } = result.data;
  
  if (patientStatus === 'existing') {
    alert(`⚠️ ${message} (Patient: ${patientName})`);
  } else {
    alert(`✅ ${message}`);
  }

  return result.data;
};
```

### React Component Example

```typescript
import { useState } from 'react';

export const BookingForm = () => {
  const [loading, setLoading] = useState(false);
  const [patientStatus, setPatientStatus] = useState<'created' | 'existing' | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/patients/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setPatientStatus(result.data.patientStatus);
        // Show confirmation UI based on patientStatus
        if (result.data.patientStatus === 'existing') {
          showWarning(`Booking for existing patient: ${result.data.patientName}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
      {patientStatus === 'existing' && (
        <p className="warning">⚠️ This email/phone is already registered. Creating a new appointment.</p>
      )}
    </form>
  );
};
```

---

## Security & Deployment

### Authentication
- All endpoints require a valid JWT token
- Token must be passed in `Authorization: Bearer <token>` header
- Tokens are issued by the `/api/v1/auth/*` endpoints

### Multi-Tenancy
- Tenant ID is extracted from the JWT token
- Patient records are isolated per tenant (schema-scoped in PostgreSQL)
- Cross-tenant data access is impossible at the database level

### CORS
- Configured for web portals (see `CORS_ORIGIN` env var)
- Mobile apps connect directly (no CORS restriction)

### Rate Limiting
- Implement at the API Gateway level (optional)
- No per-endpoint rate limits in the service itself

### Data Validation
- Input validation via Zod schema on every endpoint
- SQL injection protected via parameterized queries
- Email format validated before insert

---

## Deployment Checklist

- [ ] JWT signing keys are configured (auth-service)
- [ ] Database connection string set (Neon + Hyperdrive)
- [ ] CORS_ORIGIN env var configured for web portals
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are strong (32+ chars)
- [ ] Email/phone formats are documented for clients
- [ ] Error messages are localized (optional)
- [ ] Logging/monitoring set up for failed bookings
- [ ] Admin dashboard displays booking stats

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid/missing JWT | Ensure token is valid and passed in `Authorization` header |
| `400 Validation failed` | Invalid email/phone format | Check input field formats match schema |
| `409 Conflict` | Slot already booked | Choose a different date/time |
| `500 Internal Server Error` | Database/service error | Check logs, may be transient |
| Patient duplicated | Name/phone mismatch | API may have reused patient by email/phone alone |

---

## Future Enhancements

1. **Strict Name Matching:** Option to reject fuzzy name matches
2. **SMS/Email Confirmation:** Auto-send confirmation to patient's phone/email
3. **Payment Integration:** Collect deposit/payment at booking time
4. **Waiting List:** Auto-queue patient if preferred slot is full
5. **Bulk Booking:** Import multiple patients from CSV
6. **Booking History:** Audit trail of who booked what, when

---

## Support

For API issues, check the logs on Cloudflare Dashboard → Workers → Logs  
For database issues, check Neon Dashboard → Monitoring

