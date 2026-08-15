import { motion } from 'framer-motion'
import {
  Anchor,
  Activity,
  Sparkles,
  Wand2,
  Baby,
  AlignHorizontalDistributeCenter,
  ShieldPlus,
  Stethoscope,
  Siren,
} from 'lucide-react'

const DentalServices = () => {
  const services = [
    {
      icon: Anchor,
      title: 'Dental Implants',
      description: 'Permanent tooth replacement with titanium implants.',
      href: '#',
    },
    {
      icon: Activity,
      title: 'Root Canal Centre',
      description: 'Painless root canal with latest rotary technology.',
      href: '#',
    },
    {
      icon: Sparkles,
      title: 'Smile Makeover',
      description: 'Transform your smile with veneers & aesthetic design.',
      href: '#',
    },
    {
      icon: Wand2,
      title: 'Cosmetic Dentistry',
      description: 'Whitening, bonding, contouring & aesthetic corrections.',
      href: '#',
    },
    {
      icon: Baby,
      title: 'Pediatric Dentistry',
      description: 'Gentle dental care for children in a friendly environment.',
      href: '#',
    },
    {
      icon: AlignHorizontalDistributeCenter,
      title: 'Orthodontics',
      description: 'Braces & aligners for perfectly aligned teeth.',
      href: '#',
    },
    {
      icon: ShieldPlus,
      title: 'Gum Care',
      description: 'Periodontal treatment for healthy gums.',
      href: '#',
    },
    {
      icon: Stethoscope,
      title: 'Oral Surgery',
      description: 'Surgical extractions, wisdom tooth removal & more.',
      href: '#',
    },
    {
      icon: Siren,
      title: 'Emergency Dentistry',
      description: 'Same-day care for dental emergencies.',
      href: '#',
    },
  ]

  return (
    <section id="dental-services" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(6,182,212,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive Dental Care <span className="gradient-text">Under One Roof</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            From dental implants to pediatric dentistry — every treatment delivered with precision,
            technology & care.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass-card rounded-2xl p-6 hover:border-accent/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-all">
                <service.icon size={28} className="text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">{service.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{service.description}</p>
              <a
                href={service.href}
                className="text-accent text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Learn More →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DentalServices
