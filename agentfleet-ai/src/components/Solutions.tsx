import { motion } from 'framer-motion'
import { Headphones, TrendingUp, Calendar, LifeBuoy, Megaphone, BarChart } from 'lucide-react'

const Solutions = () => {
  const agents = [
    {
      icon: Headphones,
      title: 'Reception Agent',
      description: 'Answers calls and handles customer inquiries instantly, ensuring no customer is left waiting.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: TrendingUp,
      title: 'Sales Agent',
      description: 'Qualifies and nurtures leads automatically, converting prospects into customers.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Calendar,
      title: 'Scheduling Agent',
      description: 'Books appointments automatically with intelligent calendar management and reminders.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: LifeBuoy,
      title: 'Support Agent',
      description: 'Resolves customer issues instantly with AI-powered troubleshooting and knowledge base.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Megaphone,
      title: 'Marketing Agent',
      description: 'Runs campaigns and follow-ups automatically, keeping your audience engaged.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: BarChart,
      title: 'Analytics Agent',
      description: 'Provides business insights and reporting with real-time data analysis.',
      color: 'from-cyan-500 to-blue-500',
    },
  ]

  return (
    <section id="solutions" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Your <span className="gradient-text">AI Fleet</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            A complete workforce of specialized AI agents ready to transform your business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all group cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${agent.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl transition-all`}>
                <agent.icon size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[var(--body-text)]">{agent.title}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed">{agent.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Solutions
