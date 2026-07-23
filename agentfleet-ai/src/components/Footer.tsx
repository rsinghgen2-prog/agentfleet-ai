import { Bot, Mail, Phone, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

const Footer = () => {
  const footerLinks = {
    Company: [
      { name: 'About', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    Solutions: [
      { name: 'Reception Agent', href: '#solutions' },
      { name: 'Sales Agent', href: '#solutions' },
      { name: 'Support Agent', href: '#solutions' },
      { name: 'Analytics', href: '#solutions' },
    ],
    Resources: [
      { name: 'Pricing', href: '#pricing' },
      { name: 'Documentation', href: '#' },
      { name: 'Case Studies', href: '#' },
      { name: 'API', href: '#' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' },
    ],
  }

  return (
    <footer className="relative py-16 px-4 border-t border-white/10">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-black/50" />
      
      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 mb-4 cursor-pointer"
            >
              <Bot className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold gradient-text">AgentFleet AI</span>
            </motion.div>
            <p className="text-gray-400 mb-4">
              Your AI Workforce, Ready on Day One.
            </p>
            <div className="flex gap-4">
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="https://agentfleet.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:border-primary/50 transition-all"
              >
                <Globe size={20} className="text-primary" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="mailto:contact@agentfleet.ai"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:border-primary/50 transition-all"
              >
                <Mail size={20} className="text-primary" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                href="tel:+1234567890"
                className="w-10 h-10 rounded-lg glass-card flex items-center justify-center hover:border-primary/50 transition-all"
              >
                <Phone size={20} className="text-primary" />
              </motion.a>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-gray-400">
          <p>&copy; 2026 AgentFleet AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
