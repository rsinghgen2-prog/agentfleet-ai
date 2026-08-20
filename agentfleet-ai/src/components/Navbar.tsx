import { useState, useEffect } from 'react'
import { Menu, X, Bot, User, LogOut, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import LanguageSelector from './LanguageSelector'
import { industries } from '../data/industries'

const Navbar = () => {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false)
  const [isMobileIndustriesOpen, setIsMobileIndustriesOpen] = useState(false)
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
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'How It Works', href: '#how-it-works' },
  ]

  const goToIndustry = (slug: string) => {
    setIsIndustriesOpen(false)
    setIsMobileIndustriesOpen(false)
    setIsMobileMenuOpen(false)
    window.location.hash = `#industry-${slug}`
    document.getElementById('industry-detail')?.scrollIntoView({ behavior: 'smooth' })
  }

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
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">AgentFleet AI</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => {
              const sectionId = link.href.replace('#', '')
              const isActive = activeSection === sectionId

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`transition-colors relative group ${
                    isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-gradient-primary transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </a>
              )
            })}

            {/* Industries Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsIndustriesOpen(true)}
              onMouseLeave={() => setIsIndustriesOpen(false)}
            >
              <button
                onClick={() => setIsIndustriesOpen((open) => !open)}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors relative group"
              >
                Industries
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isIndustriesOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {isIndustriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[34rem] glass-card rounded-2xl p-3 grid grid-cols-2 gap-1"
                  >
                    {industries.map((industry) => {
                      const Icon = industry.icon
                      return (
                        <button
                          key={industry.slug}
                          onClick={() => goToIndustry(industry.slug)}
                          className="flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all group"
                        >
                          <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-all">
                            <Icon size={16} className="text-accent" />
                          </span>
                          <span className="text-sm font-medium">{industry.name}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <LanguageSelector />

            {/* Login/Logout Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm hidden md:block">
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

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookDemo}
              className="px-6 py-2 bg-gradient-primary rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Book a Demo
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 glass-card rounded-lg p-4"
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
                      isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </a>
                )
              })}

              {/* Mobile Industries submenu */}
              <button
                onClick={() => setIsMobileIndustriesOpen((open) => !open)}
                className="w-full flex items-center justify-between py-3 text-gray-300 hover:text-white transition-colors"
              >
                Industries
                <ChevronDown
                  size={18}
                  className={`transition-transform ${isMobileIndustriesOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {isMobileIndustriesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-2 border-l border-white/10 ml-1"
                  >
                    {industries.map((industry) => {
                      const Icon = industry.icon
                      return (
                        <button
                          key={industry.slug}
                          onClick={() => goToIndustry(industry.slug)}
                          className="w-full flex items-center gap-3 text-left py-2.5 px-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          <Icon size={16} className="text-accent shrink-0" />
                          {industry.name}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleBookDemo}
                className="w-full mt-4 px-6 py-2 bg-gradient-primary rounded-lg font-semibold"
              >
                Book a Demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}

export default Navbar
