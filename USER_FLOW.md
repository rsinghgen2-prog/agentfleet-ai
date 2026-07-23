# 🔄 User Flow - AgentFleet AI

## Complete Navigation & Authentication Flow

---

## 🏠 Default Page: Homepage

### **Landing Page** (`/`)
**Status:** Public - No authentication required

**What Users See:**
- Full landing page with Navbar
- 11 sections:
  1. Hero section
  2. Solutions
  3. Industries
  4. Features
  5. Pricing
  6. How It Works
  7. Testimonials
  8. FAQ
  9. CTA
  10. Newsletter
  11. Footer
- WhatsApp Chat Widget
- Language Selector
- "Login" button in Navbar
- "Book a Demo" button

**User Actions:**
- Browse all content freely
- Click "Login" → Redirects to `/login`
- Click "Book a Demo" → Redirects to `/book-demo`
- Change language (EN, HI, ES, FR)
- Chat via WhatsApp widget

---

## 🔐 Login Flow

### **Step 1: User Clicks Login**
From homepage, user clicks "Login" button in Navbar → Redirects to `/login`

### **Step 2: Login Page** (`/login`)
**Status:** Public

**Form Fields:**
- Email address
- Password
- "Back to Home" button

**Login Types:**

#### **A. Super Admin Login**
**Credentials:**
- Email: `rsingh.gen2@gmail.com`
- Password: `Aug@2026`

**Result:**
- ✅ Login successful
- Sets: `isLoggedIn=true`, `isSuperAdmin=true`
- Redirects to: `/dashboard`
- Has access to ALL features

#### **B. Regular User Login**
**Requirements:**
- Must have registered first
- Email and password must match

**Industry-Based Redirect:**

| Industry | Dashboard Route |
|----------|----------------|
| Dental | `/dental-dashboard` |
| Healthcare | `/dental-dashboard` |
| School | `/school-dashboard` |
| Education | `/school-dashboard` |
| Other | `/dashboard` |

**Payment Status Check:**
- If `plan !== 'free'` AND `paymentCompleted === false`
  → Redirects to `/payment` first
- Otherwise → Redirects to appropriate dashboard

---

## 🛡️ Protected Routes

### **Routes Requiring Login:**

All these routes check `localStorage.getItem('isLoggedIn')`

If NOT logged in → Redirect to `/login`

**Protected Pages:**
1. `/dashboard` - General dashboard
2. `/dental-dashboard` - Dental clinic dashboard
3. `/automation` - Message automation tool
4. `/payment` - Payment page

### **Public Routes:**

Can be accessed without login:
1. `/` - Homepage (default)
2. `/login` - Login page
3. `/register` - Registration page
4. `/book-demo` - Demo booking page

---

## 📊 Dashboard Access

### **After Successful Login:**

**1. Super Admin** (`rsingh.gen2@gmail.com`)
```
Login → /dashboard
- Full platform access
- Can manage all tenants
- All features unlocked
- Shows "SUPER ADMIN" badge
```

**2. Dental/Healthcare User**
```
Login → /dental-dashboard
- Beautiful dental-specific dashboard
- Real-time stats (appointments, patients, revenue)
- Today's appointments list
- Quick actions (New Appointment, Add Patient, etc.)
- Recent patients panel
- Performance metrics
```

**3. Regular User (Other Industries)**
```
Login → /dashboard
- General dashboard
- Service tiles based on subscription
- Message automation access
- Analytics (if subscribed)
- Campaign management
```

---

## 🔄 Complete User Journey

### **Scenario 1: New User Registration**

```
1. User lands on homepage (/)
2. Browses content
3. Clicks "Login" → /login
4. Sees "No account? Register" link
5. Clicks Register → /register
6. Fills 3-step registration form:
   - Step 1: Personal Info
   - Step 2: Business Info (Industry selection)
   - Step 3: Plan Selection (Free/Starter/Growth/Scale)
7. Submits form
8. If Free plan → Redirects to /automation
9. If Paid plan → Redirects to /payment
10. After payment (or skip) → Redirects to dashboard
```

### **Scenario 2: Returning User Login**

```
1. User lands on homepage (/)
2. Clicks "Login" button
3. Enters credentials
4. System checks:
   - Is Super Admin? → /dashboard
   - Industry = Dental? → /dental-dashboard
   - Payment pending? → /payment
   - Otherwise → /dashboard
5. User sees their personalized dashboard
6. Can navigate to other protected routes
```

### **Scenario 3: User Tries to Access Protected Page**

```
1. User (not logged in) tries to visit /dashboard directly
2. ProtectedRoute component checks login status
3. isLoggedIn === false
4. Automatic redirect to /login
5. After successful login → Redirects back to /dashboard
```

### **Scenario 4: User Logs Out**

```
1. User clicks "Logout" in Navbar
2. System clears:
   - localStorage.removeItem('isLoggedIn')
   - localStorage.removeItem('currentUser')
   - localStorage.removeItem('isSuperAdmin')
3. Redirects to homepage (/)
4. User sees "Login" button again
5. Can browse public content
```

---

## 🎯 Navigation Map

```
Homepage (/)
├── Login (/login)
│   ├── Super Admin → Dashboard (/dashboard)
│   ├── Dental User → Dental Dashboard (/dental-dashboard)
│   ├── Regular User → Dashboard (/dashboard)
│   └── Payment Pending → Payment (/payment) → Dashboard
│
├── Register (/register)
│   ├── Free Plan → Automation (/automation)
│   └── Paid Plan → Payment (/payment) → Dashboard
│
├── Book Demo (/book-demo)
│   └── Public page
│
└── Protected Routes (Require Login)
    ├── /dashboard
    ├── /dental-dashboard
    ├── /automation
    └── /payment
```

---

## 🔒 Security Features

### **ProtectedRoute Component**

```typescript
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
```

### **Login Status in Navbar**

**When Logged In:**
- Shows username (email prefix)
- Shows "Logout" button
- Can access all protected routes

**When Logged Out:**
- Shows "Login" button
- Cannot access protected routes
- Only sees public pages

---

## 🎨 User Experience

### **Seamless Flow:**

1. **Default:** Always lands on homepage
2. **Browse:** Can explore all content freely
3. **Login:** One click to login page
4. **Redirect:** Automatic redirect to appropriate dashboard
5. **Protection:** Can't access dashboards without login
6. **Logout:** Returns to homepage, not dashboard

### **No Confusion:**

- ✅ Homepage is default, not dashboard
- ✅ Login required for dashboards
- ✅ Industry-specific dashboards
- ✅ Clear navigation
- ✅ Protected routes enforce security

---

## 📱 Mobile Experience

**Same flow on mobile:**
- Homepage loads first
- Mobile menu with login button
- Protected routes work the same
- Responsive dashboards

---

## ✅ Testing the Flow

### **Test 1: New Visitor**
```
1. Visit site (should land on homepage)
2. Try to go to /dashboard directly
3. Should redirect to /login
4. Login or register
5. Should land on appropriate dashboard
```

### **Test 2: Super Admin**
```
1. Land on homepage
2. Click Login
3. Enter: rsingh.gen2@gmail.com / Aug@2026
4. Should redirect to /dashboard
5. Should see "SUPER ADMIN" badge
```

### **Test 3: Dental User**
```
1. Register with industry = "Dental"
2. Complete registration
3. Login
4. Should redirect to /dental-dashboard
5. Should see dental-specific interface
```

### **Test 4: Logout**
```
1. From any dashboard
2. Click Logout
3. Should redirect to homepage (/)
4. Try to access /dashboard
5. Should redirect to /login
```

---

## 🎯 Key Benefits

✅ **Default Homepage** - Not dashboard  
✅ **Protected Dashboards** - Login required  
✅ **Industry-Specific** - Automatic routing  
✅ **Secure** - No unauthorized access  
✅ **User-Friendly** - Clear navigation  
✅ **Mobile-Ready** - Responsive design  

---

**Version:** 2.0  
**Updated:** July 23, 2026  
**Status:** ✅ Production Ready
