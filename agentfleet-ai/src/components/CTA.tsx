import { motion } from 'framer-motion'
import { ArrowRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CTA = () => {
  const navigate = useNavigate()
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--body-bg)] via-primary/10 to-[var(--body-bg)]" />
      
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-12 text-center border-2 border-primary/30 hover:border-primary/50 transition-all"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Ready to Build Your{' '}
            <span className="gradient-text">AI Workforce?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto"
          >
            Join hundreds of businesses already saving time and increasing revenue with AgentFleet AI
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/book-demo')}
              className="px-8 py-4 bg-gradient-primary text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/50 transition-all"
            >
              <Calendar size={20} /> Schedule Free Consultation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/book-demo')}
              className="px-8 py-4 glass-card rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:border-primary/50 transition-all"
            >
              Request Demo <ArrowRight size={20} />
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-sm text-[var(--text-muted)]"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
