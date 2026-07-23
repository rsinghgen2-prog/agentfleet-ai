import { motion } from 'framer-motion'
import { Play, ArrowRight, Bot, Zap, Clock, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()
  const floatingAgents = [
    { icon: Bot, color: 'text-primary', delay: 0 },
    { icon: Zap, color: 'text-secondary', delay: 0.2 },
    { icon: Clock, color: 'text-accent', delay: 0.4 },
    { icon: Users, color: 'text-primary', delay: 0.6 },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-4 px-4 py-2 glass-card rounded-full text-sm"
          >
            <span className="gradient-text font-semibold">Your AI Workforce, Ready on Day One.</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Deploy Your AI{' '}
            <span className="gradient-text">Workforce</span> in Minutes
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl"
          >
            AgentFleet AI gives your business an intelligent fleet of AI agents that answer customers,
            schedule appointments, follow up on leads, and automate operations 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/book-demo')}
              className="px-8 py-4 bg-gradient-primary rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Book a Demo <ArrowRight size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 glass-card rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:border-primary/50 transition-all"
            >
              <Play size={20} /> Watch Video
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative h-[500px] hidden lg:block"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Central Hub */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-2xl shadow-primary/50"
            >
              <Bot size={48} className="text-white" />
            </motion.div>

            {/* Floating Agents */}
            {floatingAgents.map((agent, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: Math.cos((index * Math.PI) / 2) * 200,
                  y: Math.sin((index * Math.PI) / 2) * 200,
                }}
                transition={{
                  delay: agent.delay,
                  duration: 0.5,
                }}
                className="absolute"
              >
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: agent.delay,
                  }}
                  className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <agent.icon size={32} className={agent.color} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
