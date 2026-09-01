import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'HI', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 glass-card rounded-lg hover:border-primary/50 transition-all"
      >
        <Globe size={18} className="text-primary" />
        <span className="font-semibold">{currentLanguage?.flag} {language}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 glass-card rounded-lg overflow-hidden min-w-[180px] shadow-2xl border border-[var(--border)]"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as 'EN' | 'HI' | 'ES' | 'FR')
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-muted)] transition-all text-left ${
                  language === lang.code ? 'bg-primary/20' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--body-text)]">{lang.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{lang.code}</div>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSelector
