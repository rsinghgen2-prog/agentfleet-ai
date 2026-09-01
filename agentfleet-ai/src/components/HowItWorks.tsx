import { motion } from 'framer-motion'
import { Plug, Settings, Rocket, TrendingUp } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: Plug,
      title: 'Connect Your Business',
      description: 'Integrate AgentFleet with your existing systems in minutes - no technical expertise required.',
      step: '01',
    },
    {
      icon: Settings,
      title: 'Configure Your AI Fleet',
      description: 'Customize each AI agent to match your business needs, workflows, and brand voice.',
      step: '02',
    },
    {
      icon: Rocket,
      title: 'Launch Automation',
      description: 'Activate your AI workforce and watch them start handling tasks immediately.',
      step: '03',
    },
    {
      icon: TrendingUp,
      title: 'Watch Productivity Grow',
      description: 'Monitor performance, gain insights, and scale your operations effortlessly.',
      step: '04',
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--body-bg)] via-secondary/5 to-[var(--body-bg)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Get started in four simple steps and transform your business today
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent transform -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all group">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-2xl shadow-lg shadow-primary/50">
                    {step.step}
                  </div>
                  
                  <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <step.icon size={32} className="text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-[var(--body-text)]">{step.title}</h3>
                  <p className="text-[var(--text-muted)]">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
