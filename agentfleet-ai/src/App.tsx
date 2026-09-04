import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppChat from './components/WhatsAppChat'
import Home from './pages/Home'
import BookDemo from './pages/BookDemo'
import MessageAutomation from './pages/MessageAutomation'
import Register from './pages/Register'
import Login from './pages/Login'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import EnhancedDashboard from './pages/EnhancedDashboard'
import DentalDashboard from './pages/DentalDashboard'
import IndustryDashboard from './pages/IndustryDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DentalClientOverview from './pages/DentalClientOverview'
import DentalClientStitchDashboard from './pages/DentalClientStitchDashboard'
import DentalClientPatients from './pages/DentalClientPatients'
import PatientProfile from './pages/PatientProfile'
import CustomerDetails from './pages/CustomerDetails'
import DentalClientSchedule from './pages/DentalClientSchedule'
import DentalClientInventory from './pages/DentalClientInventory'
import DentalClientPayments from './pages/DentalClientPayments'
import DentalClientSettings from './pages/DentalClientSettings'
import DentalClientShell from './components/dental/DentalClientShell'
import Settings from './pages/Settings'
import PatientConsultation from './pages/PatientConsultation'
import ClinicalWorkspace from './pages/ClinicalWorkspace'

type UserType = 'client' | 'super-admin' | 'registered-user'

// Protected Route Component
const ProtectedRoute = ({ children, allowedUserTypes }: { children: React.ReactNode; allowedUserTypes?: UserType[] }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userType = localStorage.getItem('userType') as UserType | null

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedUserTypes && (!userType || !allowedUserTypes.includes(userType))) {
    if (userType === 'client') return <Navigate to="/dental-client" replace />
    if (userType === 'super-admin') return <Navigate to="/dashboard" replace />
    return <Navigate to="/admin-dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-[var(--body-bg)] text-[var(--body-text)] overflow-x-hidden">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            } />
            <Route path="/book-demo" element={<BookDemo />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Require Login */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <IndustryDashboard />
              </ProtectedRoute>
            } />

            <Route path="/enhanced-dashboard" element={
              <ProtectedRoute>
                <EnhancedDashboard />
              </ProtectedRoute>
            } />

            <Route path="/old-dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/dental-dashboard" element={
              <ProtectedRoute allowedUserTypes={['super-admin']}>
                <DentalDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/dental-client" element={<ProtectedRoute allowedUserTypes={['client']}><DentalClientShell /></ProtectedRoute>}>
              <Route index element={<DentalClientStitchDashboard />} />
              <Route path="dashboard" element={<DentalClientStitchDashboard />} />
              <Route path="customers-overview" element={<DentalClientOverview />} />
              <Route path="patients" element={<DentalClientPatients />} />
              <Route path="patients/:id" element={<PatientProfile />} />
              <Route path="customers" element={<CustomerDetails />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="schedule" element={<DentalClientSchedule />} />
              <Route path="inventory" element={<DentalClientInventory />} />
              <Route path="payments" element={<DentalClientPayments />} />
              <Route path="settings" element={<DentalClientSettings />} />
              <Route path="consultation/:appointmentId" element={<PatientConsultation />} />
              <Route path="dental-chart" element={<ClinicalWorkspace kind="chart" />} />
              <Route path="treatment-plan" element={<ClinicalWorkspace kind="treatment" />} />
              <Route path="medical-history" element={<ClinicalWorkspace kind="history" />} />
              <Route path="documents" element={<ClinicalWorkspace kind="documents" />} />
              <Route path="communications" element={<ClinicalWorkspace kind="communications" />} />
            </Route>
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/automation" element={
              <ProtectedRoute>
                <MessageAutomation />
              </ProtectedRoute>
            } />

            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
          </Routes>
          {/* WhatsApp Chat Widget - Available on all pages */}
          <WhatsAppChat />
        </div>
      </Router>
    </LanguageProvider>
  )
}

export default App
