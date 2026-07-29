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
import DentalClientStitchDashboard from './pages/DentalClientStitchDashboard'
import DentalClientPatients from './pages/DentalClientPatients'
import DentalClientSchedule from './pages/DentalClientSchedule'
import DentalClientInventory from './pages/DentalClientInventory'
import DentalClientSettings from './pages/DentalClientSettings'
import DentalClientShell from './components/dental/DentalClientShell'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-background overflow-x-hidden">
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
              <ProtectedRoute>
                <DentalDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/dental-client" element={<ProtectedRoute><DentalClientShell /></ProtectedRoute>}>
              <Route index element={<DentalClientStitchDashboard />} />
              <Route path="patients" element={<DentalClientPatients />} />
              <Route path="schedule" element={<DentalClientSchedule />} />
              <Route path="inventory" element={<DentalClientInventory />} />
              <Route path="settings" element={<DentalClientSettings />} />
            </Route>

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
