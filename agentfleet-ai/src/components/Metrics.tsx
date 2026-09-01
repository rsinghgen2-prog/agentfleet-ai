import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

const Counter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2 })
      return controls.stop
    }
  }, [isInView, count, value])

  return (
    <motion.span ref={ref}>
      {rounded.get()}
      {suffix}
    </motion.span>
  )
}

const Metrics = () => {
  const metrics = [
    {
      value: 90,
      suffix: '%',
      title: 'Reduction in Repetitive Tasks',
      description: 'Free your team to focus on what matters',
    },
    {
      value: 70,
      suffix: '%',
      title: 'Faster Customer Response',
      description: 'Instant replies that delight customers',
    },
    {
      value: 24,
      suffix: '/7',
      title: 'Availability',
      description: 'Your business never closes',
    },
    {
      value: 3,
      suffix: 'X',
      title: 'Lead Conversion Improvement',
      description: 'Turn more prospects into customers',
    },
  ]

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Results That <span className="gradient-text">Matter</span>
          </h2>
          <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Real metrics from businesses using AgentFleet AI
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-8 text-center hover:border-primary/50 transition-all"
            >
              <div className="text-6xl font-bold gradient-text mb-4">
                <Counter value={metric.value} suffix={metric.suffix} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[var(--body-text)]">{metric.title}</h3>
              <p className="text-[var(--text-muted)]">{metric.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Metrics
