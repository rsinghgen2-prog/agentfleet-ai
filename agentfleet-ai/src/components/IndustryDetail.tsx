import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { industries } from '../data/industries'

const slugFromHash = () => {
  const hash = window.location.hash.replace('#industry-', '').replace('#', '')
  return industries.some((industry) => industry.slug === hash) ? hash : industries[0].slug
}

const IndustryDetail = () => {
  const [activeSlug, setActiveSlug] = useState(slugFromHash)

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith('#industry-')) {
        setActiveSlug(slugFromHash())
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const active = industries.find((industry) => industry.slug === activeSlug) ?? industries[0]
  const ActiveIcon = active.icon

  return (
    <section id="industry-detail" className="py-20 px-4 relative scroll-mt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Explore by <span className="gradient-text">Industry</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Select an industry to see how AgentFleet AI adapts to its unique needs.
          </p>
        </motion.div>

        {/* Industry selector chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {industries.map((industry) => {
            const Icon = industry.icon
            const isActive = industry.slug === active.slug
            return (
              <a
                key={industry.slug}
                href={`#industry-${industry.slug}`}
                onClick={() => setActiveSlug(industry.slug)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-primary text-white shadow-lg shadow-primary/40'
                    : 'glass-card text-gray-300 hover:text-white hover:border-accent/50'
                }`}
              >
                <Icon size={16} />
                {industry.name}
              </a>
            )
          })}
        </div>

        {/* Detail card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-3xl p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                  <ActiveIcon size={32} className="text-accent" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">{active.name}</h3>
                <p className="text-lg text-accent font-medium mb-4">{active.tagline}</p>
                <p className="text-gray-300 leading-relaxed mb-8">{active.description}</p>
                <a
                  href="/book-demo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all"
                >
                  Book a Demo <ArrowRight size={18} />
                </a>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">
                  What our AI agents handle
                </h4>
                <ul className="space-y-4">
                  {active.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <CheckCircle2 size={22} className="text-accent shrink-0 mt-0.5" />
                      <span className="text-gray-200">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

export default IndustryDetail
