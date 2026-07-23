# 🚀 AgentFleet AI

**Modern Multi-Tenant SaaS Platform** for WhatsApp & SMS Automation with AI-powered messaging, multi-language support, and industry-specific dashboards.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vitejs.dev/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Documentation](#-documentation)
- [Architecture](#-architecture)
- [Super Admin](#-super-admin)
- [Screenshots](#-screenshots)
- [License](#-license)

---

## ✨ Features

### 🎯 **Core Features**
- 📱 **WhatsApp & SMS Automation** - Bulk messaging with template support
- 🤖 **AI-Powered Messaging** - Intelligent message scheduling and personalization
- 🌍 **Multi-Language Support** - English, Hindi, Spanish, French
- 💰 **Smart Currency Conversion** - Auto-detect location, display in local currency
- 🔐 **Advanced Authentication** - JWT-based with Remember Me & Auto-logout
- 📊 **Real-time Analytics** - Performance metrics and engagement tracking

### 🏥 **Industry-Specific Dashboards**
- **Dental Clinics** - Patient management, appointments, treatment tracking
- **Hospitals** - Healthcare-focused workflows
- **Schools** - Student and parent communication
- **Retail** - Customer engagement campaigns
- **Custom** - Extensible for any industry

### 💳 **Subscription Management**
- **Free Plan** - 100 messages/day
- **Starter Plan** - $299/month - 1,000 messages/day
- **Growth Plan** - $799/month - 10,000 messages/day
- **Scale Plan** - $1,999/month - Unlimited messages
- Payment gateway: Card & UPI support

### 👑 **Admin Features**
- **Super Admin** - Full system access with all features unlocked
- **Role-Based Access Control (RBAC)** - Admin, Semi-Admin, Customer roles
- **Multi-Tenant Architecture** - Isolated data per organization
- **Booking System** - Zoom integration for demos

---

## 🛠 Tech Stack

### **Frontend**
- ⚛️ React 18.3 with TypeScript
- ⚡ Vite 8.x for blazing-fast builds
- 🎨 Tailwind CSS for styling
- 🎭 Framer Motion for animations
- 🧭 React Router for navigation
- 🎯 Lucide React for icons

### **Backend** (Architecture designed)
- 🟢 Node.js with Express.js
- 🐘 PostgreSQL with schema-based multi-tenancy
- 🔒 JWT authentication
- 🐳 Docker containerization
- 📦 Microservices architecture (7 services)

### **APIs & Integrations**
- 🌍 IP Geolocation (ipapi.co)
- 💱 Live Exchange Rates (exchangerate-api.com)
- 🎥 Zoom API for meeting scheduling
- 📧 Email services
- 💬 WhatsApp Business API

---

## 🚀 Getting Started

### **Prerequisites**
```bash
Node.js >= 18.x
npm >= 9.x
```

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/rsinghgen2-prog/agentfleet-ai.git
cd agentfleet-ai
```

2. **Install dependencies**
```bash
cd agentfleet-ai
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

5. **Preview production build**
```bash
npm run preview
```

### **Access the Application**
- Development: `http://localhost:5173`
- Production: Your deployed URL

---

## 📚 Documentation

Comprehensive documentation is available in the repository:

- 📖 [**SUMMARY.md**](SUMMARY.md) - Project overview
- 🏗️ [**ARCHITECTURE.md**](backend/ARCHITECTURE.md) - System architecture
- 💾 [**DATABASE_MODELS.md**](backend/DATABASE_MODELS.md) - Database schemas
- 🔌 [**API_DOCUMENTATION.md**](backend/API_DOCUMENTATION.md) - API reference
- 🎨 [**ENHANCED_DASHBOARD.md**](ENHANCED_DASHBOARD.md) - Dashboard features
- 🏥 [**DENTAL_DASHBOARD.md**](DENTAL_DASHBOARD.md) - Healthcare dashboard
- 👑 [**SUPER_ADMIN.md**](SUPER_ADMIN.md) - Admin features
- 💱 [**CURRENCY_FEATURE.md**](CURRENCY_FEATURE.md) - Currency conversion
- 🚀 [**DEPLOYMENT_GUIDE.md**](backend/DEPLOYMENT_GUIDE.md) - Deployment instructions

---

## 🏗️ Architecture

### **Multi-Tenant Strategy**
```
Shared Database + Separate Schema per Tenant
├── Public Schema (Global)
│   ├── Tenants
│   ├── Industries
│   ├── Plans
│   └── Super Admins
└── Tenant Schemas (Isolated)
    ├── Users
    ├── Patients/Students/Customers
    ├── Campaigns
    ├── Messages
    └── Analytics
```

### **Microservices**
1. **Auth Service** - Authentication & authorization
2. **User Service** - User management
3. **Tenant Service** - Multi-tenant operations
4. **Automation Service** - Message automation
5. **Payment Service** - Billing & subscriptions
6. **Analytics Service** - Metrics & reporting
7. **API Gateway** - Routing & load balancing

---

## 👑 Super Admin

**Default Super Admin Credentials:**
```
Email: rsingh.gen2@gmail.com
Password: Aug@2026
```

**Super Admin Features:**
- ✅ All features unlocked (no payment required)
- ✅ Unlimited messages
- ✅ Access to all industries/tenants
- ✅ System-wide analytics
- ✅ User management
- ✅ Special visual indicators (red badge)

---

## 📸 Screenshots

### Landing Page
Modern glassmorphism design with 11 sections and multi-language support.

### Dashboard
Professional sidebar navigation with performance metrics and engagement tracking.

### Payment Gateway
Smart currency conversion with Card & UPI support.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Rohit Singh**
- GitHub: [@rsinghgen2-prog](https://github.com/rsinghgen2-prog)
- Email: rsingh.gen2@gmail.com

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Framer Motion for smooth animations
- All open-source contributors

---

**Built with ❤️ using React + TypeScript + Vite**
