import { motion } from 'framer-motion'
import { Clock, Phone, MessageSquare, Mail, Database, Target, Calendar, BarChart3 } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Your AI workforce never sleeps',
    },
    {
      icon: Phone,
      title: 'Voice AI',
      description: 'Natural phone conversations',
    },
    {
      icon: MessageSquare,
      title: 'SMS Automation',
      description: 'Instant text responses',
    },
    {
      icon: Mail,
      title: 'Email Automation',
      description: 'Smart email management',
    },
    {
      icon: Database,
      title: 'CRM Integration',
      description: 'Seamless data sync',
    },
    {
      icon: Target,
      title: 'Lead Qualification',
      description: 'Intelligent lead scoring',
    },
    {
      icon: Calendar,
      title: 'Scheduling Automation',
      description: 'Effortless appointment booking',
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Real-time insights',
    },
  ]

  return (
    <section id="features" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--body-bg)] via-primary/5 to-[var(--body-bg)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Everything you need to run a modern, automated business
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/50 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <feature.icon size={24} className="text-white" />
              </div>
              <h3 className="font-bold mb-2 text-[var(--body-text)]">{feature.title}</h3>
              <p className="text-[var(--text-muted)] text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
