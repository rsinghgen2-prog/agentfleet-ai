import { useState, useEffect } from 'react'
import { Menu, X, Bot, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import LanguageSelector from './LanguageSelector'

const Navbar = () => {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    // Check login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const user = localStorage.getItem('currentUser') || ''
    setIsLoggedIn(loggedIn)
    setCurrentUser(user)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      // Update active section based on scroll position
      const sections = ['solutions', 'industries', 'features', 'pricing', 'how-it-works']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetBottom = offsetTop + element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Solutions', href: '#solutions' },
    { name: 'Industries', href: '#industries' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'How It Works', href: '#how-it-works' },
  ]

  const handleBookDemo = () => {
    window.location.href = '/book-demo'
  }

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('currentUser')
    setIsLoggedIn(false)
    setCurrentUser('')
    navigate('/')
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-card py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold gradient-text">AgentFleet AI</span>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const sectionId = link.href.replace('#', '')
              const isActive = activeSection === sectionId

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`transition-colors relative group whitespace-nowrap ${
                    isActive ? 'text-[var(--body-text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--body-text)]'
                  }`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-primary transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </a>
              )
            })}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* Login/Logout Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-[var(--text-muted)] text-sm hidden xl:flex items-center">
                  <User size={16} className="inline mr-1" />
                  {currentUser.split('@')[0]}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 glass-card rounded-lg font-semibold hover:border-red-500/50 text-red-400 transition-all flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-4 py-2 glass-card rounded-lg font-semibold hover:border-primary/50 transition-all flex items-center gap-2"
              >
                <User size={16} />
                Login
              </motion.button>
            )}

            {/* Language selector sits right next to Book a Demo */}
            <LanguageSelector />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookDemo}
              className="px-5 xl:px-6 py-2 bg-gradient-primary text-white rounded-lg font-semibold whitespace-nowrap hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Book a Demo
            </motion.button>
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[var(--body-text)] p-2"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 glass-card rounded-lg p-4"
            >
              {navLinks.map((link) => {
                const sectionId = link.href.replace('#', '')
                const isActive = activeSection === sectionId

                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-3 transition-colors ${
                      isActive ? 'text-[var(--body-text)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--body-text)]'
                    }`}
                  >
                    {link.name}
                  </a>
                )
              })}

              <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-3">
                {isLoggedIn ? (
                  <>
                    <span className="text-[var(--text-muted)] text-sm flex items-center">
                      <User size={16} className="inline mr-1" />
                      {currentUser.split('@')[0]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full px-4 py-2 glass-card rounded-lg font-semibold hover:border-red-500/50 text-red-400 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      navigate('/login')
                    }}
                    className="w-full px-4 py-2 glass-card rounded-lg font-semibold hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                  >
                    <User size={16} />
                    Login
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleBookDemo()
                  }}
                  className="w-full px-6 py-2 bg-gradient-primary text-white rounded-lg font-semibold"
                >
                  Book a Demo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

export default Navbar
