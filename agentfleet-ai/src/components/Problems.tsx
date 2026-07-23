import { motion } from 'framer-motion'
import { PhoneOff, Clock, TrendingDown, Calendar, FileText, Users } from 'lucide-react'

const Problems = () => {
  const problems = [
    {
      icon: PhoneOff,
      title: 'Missed Calls',
      description: 'Lost revenue from unanswered customer inquiries',
    },
    {
      icon: Clock,
      title: 'Slow Response Times',
      description: 'Customers waiting hours or days for replies',
    },
    {
      icon: TrendingDown,
      title: 'Lost Leads',
      description: 'Opportunities slipping through the cracks',
    },
    {
      icon: Calendar,
      title: 'Manual Scheduling',
      description: 'Time wasted on back-and-forth appointment booking',
    },
    {
      icon: FileText,
      title: 'Administrative Overhead',
      description: 'Repetitive tasks consuming valuable time',
    },
    {
      icon: Users,
      title: 'Staff Shortages',
      description: 'Unable to scale customer service efficiently',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Growing Businesses Are{' '}
            <span className="gradient-text">Drowning in Repetitive Work</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Don't let operational inefficiencies hold your business back
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card rounded-2xl p-6 hover:border-red-500/50 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/20 transition-all">
                <problem.icon size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{problem.title}</h3>
              <p className="text-gray-400">{problem.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Problems
