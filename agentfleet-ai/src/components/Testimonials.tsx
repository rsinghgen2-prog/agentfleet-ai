import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Owner, Dental Excellence',
      content: 'AgentFleet AI transformed our practice. We went from missing 30% of calls to answering every single one. Our patient satisfaction scores have never been higher.',
      rating: 5,
      image: '👩‍⚕️',
    },
    {
      name: 'Michael Chen',
      role: 'CEO, ProRealty Group',
      content: 'The lead qualification agent alone has doubled our conversion rate. It handles initial inquiries perfectly and schedules viewings while we sleep. Game changer!',
      rating: 5,
      image: '👨‍💼',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Partner, Rodriguez & Associates Law',
      content: 'Our client intake process is now seamless. The AI handles initial consultations, gathers information, and schedules appointments. We saved thousands on administrative costs.',
      rating: 5,
      image: '👩‍⚖️',
    },
  ]

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">Businesses</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            See what our customers have to say about AgentFleet AI
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass-card rounded-2xl p-8 hover:border-primary/50 transition-all relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-[var(--text-muted)] mb-6 leading-relaxed">"{testimonial.content}"</p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-2xl">
                  {testimonial.image}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--body-text)]">{testimonial.name}</h4>
                  <p className="text-sm text-[var(--text-muted)]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
