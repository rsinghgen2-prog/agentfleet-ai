import { motion } from 'framer-motion'
import { Heart, Smile, Home, Scale, UtensilsCrossed, Wrench, Shield } from 'lucide-react'

const Industries = () => {
  const industries = [
    {
      icon: Heart,
      title: 'Healthcare',
      description: 'Automate patient scheduling, follow-ups, and appointment reminders.',
    },
    {
      icon: Smile,
      title: 'Dental Clinics',
      description: 'Streamline patient communication and appointment management.',
    },
    {
      icon: Home,
      title: 'Real Estate',
      description: 'Qualify leads, schedule viewings, and follow up automatically.',
    },
    {
      icon: Scale,
      title: 'Law Firms',
      description: 'Manage client intake, consultations, and case follow-ups.',
    },
    {
      icon: UtensilsCrossed,
      title: 'Restaurants',
      description: 'Handle reservations, orders, and customer inquiries 24/7.',
    },
    {
      icon: Wrench,
      title: 'Home Services',
      description: 'Book appointments, dispatch teams, and update customers.',
    },
    {
      icon: Shield,
      title: 'Insurance Agencies',
      description: 'Qualify leads, provide quotes, and manage policy renewals.',
    },
  ]

  return (
    <section id="industries" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Every Industry</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Tailored AI solutions that understand your industry's unique needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card rounded-2xl p-6 hover:border-accent/50 transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-all">
                <industry.icon size={28} className="text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-[var(--body-text)]">{industry.title}</h3>
              <p className="text-[var(--text-muted)] text-sm">{industry.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Industries
