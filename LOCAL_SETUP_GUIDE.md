# 💻 Local Setup Guide - V.P.S. Dental Dashboard

## 🚀 Quick Start (5 Minutes)

### Prerequisites:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### Setup Commands:

```bash
# 1. Clone repository
git clone https://github.com/rsinghgen2-prog/agentfleet-ai.git
cd agentfleet-ai

# 2. Install dependencies (takes 1-2 minutes)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Navigate to: http://localhost:5173
```

**🎉 That's it! Your dashboard is running locally!**

---

## 🔑 Login Credentials

### Dental Client Admin:
```
Email: rsingh.gen3@gmail.com
Password: Aug@2026
```

### Super Admin (Platform Owner):
```
Email: rsingh.gen2@gmail.com
Password: Aug@2026
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173

# Production Build
npm run build        # Build for production (output: dist/ folder)
npm run preview      # Preview production build at http://localhost:4173

# Code Quality
npm run lint         # Check code quality
```

---

## 🧪 Testing the Application

### 1. Homepage
- Open: `http://localhost:5173`
- You should see the AgentFleet AI landing page
- Multi-language selector works
- Click "Login" button

### 2. Login
- Use dental client credentials
- Dashboard loads after successful login

### 3. Dashboard Features to Test

✅ **New Patient Booking:**
- Click "New Patient Booking" button (top-right)
- Fill out the form
- Submit and see success message
- Dashboard refreshes automatically

✅ **Theme Toggle:**
- Click Sun ☀️ icon → Light mode
- Click Moon 🌙 icon → Dark mode
- Refresh page → Theme persists

✅ **Calendar:**
- Current month displayed (July 2026)
- Today's date highlighted (26th)
- Appointment dates marked

✅ **Footer:**
- Scroll to bottom
- Full Kanpur clinic address
- Contact information
- Working hours

---

## 📦 Building for Production

```bash
# Build the project
npm run build

# The dist/ folder contains everything you need
# You can:
# 1. Copy dist/ to any web server
# 2. Use 'npm run preview' to test locally
# 3. Deploy to hosting service
```

---

## 🌐 Access from Other Devices (Same Network)

To test on your phone or tablet:

```bash
# Start dev server
npm run dev

# Look for the Network URL in terminal output:
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/  ← Use this on your phone

# Make sure both devices are on the same WiFi network
```

---

## 🔧 Customization

### Change Port

If port 5173 is already in use:

```bash
# Option 1: Use custom port flag
npm run dev -- --port 3000

# Option 2: Edit vite.config.ts
# Add: server: { port: 3000 }
```

### Change Clinic Information

Edit `src/config/clientConfig.ts`:

```typescript
export const dentalClient = {
  brandName: 'Your Clinic Name',
  clientName: 'Dr. Your Name',
  address: 'Your Full Address',
  phone: '+91-XXXXXXXXXX',
  email: 'your@email.com'
}
```

### Change Theme Colors

Edit `tailwind.config.js` to customize the sky blue theme.

---

## 🐛 Troubleshooting

### Problem: "Port 5173 is already in use"

**Solution:**
```bash
# Use a different port
npm run dev -- --port 3000
```

### Problem: "npm install" fails

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problem: Build fails

**Solution:**
```bash
# 1. Check Node version (must be 18+)
node --version

# 2. If version is old, download from https://nodejs.org/

# 3. Clear Vite cache
rm -rf node_modules/.vite

# 4. Rebuild
npm run build
```

### Problem: Dark mode not working

**Solution:**
- Open browser console (F12)
- Check for errors
- Clear browser cache (Ctrl+Shift+Delete)
- Reload page

### Problem: Booking modal doesn't open

**Solution:**
- Make sure you're logged in as dental client
- Check browser console for errors
- Clear cache and reload

---

## 🗄️ Backend Setup (Optional)

The frontend works perfectly with mock data. But if you want to connect to a real database:

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/

### 2. Create Database
```sql
CREATE DATABASE agentfleet_ai;
CREATE SCHEMA tenant_vps_dental;
```

### 3. Run Seed Data
```bash
# Execute the SQL file
psql -d agentfleet_ai -f backend/database/seed-data.sql
```

### 4. Configure Backend
```bash
cd backend/patient-service
npm install

# Create .env file with:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentfleet_ai
DB_USER=postgres
DB_PASSWORD=your_password
```

### 5. Start Backend
```bash
npm run dev
# Backend runs at http://localhost:4000
```

### 6. Connect Frontend to Backend
Create `agentfleet-ai/.env`:
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 📚 Documentation

- **Booking System:** See `BOOKING_SYSTEM_IMPLEMENTATION.md`
- **Completed Features:** See `COMPLETED_FEATURES.md`
- **Multi-tenant Architecture:** See `MULTI_TENANT_ARCHITECTURE.md`

---

## ✅ Quick Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Login works
- [ ] Dashboard displays
- [ ] "New Patient Booking" button visible
- [ ] Booking modal works
- [ ] Theme toggle works
- [ ] Footer displays with address

---

## 🎉 You're All Set!

Your V.P.S. Dental Dashboard is running on your local PC!

### Test These Features:
1. ✅ New Patient Booking system
2. ✅ Dark/Light theme toggle  
3. ✅ Dynamic calendar
4. ✅ Patient management
5. ✅ Professional footer

**Happy developing!** 🚀
