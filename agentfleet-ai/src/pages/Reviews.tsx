import { motion } from 'framer-motion'
import { Star, ExternalLink, PenSquare, Quote } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

type ReviewSource = 'google' | 'facebook'

interface Review {
  name: string
  initials: string
  rating: number
  content: string
  context: string
  source: ReviewSource
}

const GOOGLE_URL =
  'https://www.google.com/maps/search/?api=1&query=The+Crown+Multispeciality+Dental+Clinic+Implant+Center+Kidwai+Nagar+Kanpur'
const FACEBOOK_URL = 'https://www.facebook.com/thecrowndental09/'

const reviews: Review[] = [
  {
    name: 'Rajesh Singh',
    initials: 'RS',
    rating: 5,
    content:
      'Excellent dental clinic! Dr. Apurva placed my dental implants and the entire process was painless. The team is very professional and caring. Highly recommended!',
    context: 'Dental Implants',
    source: 'google',
  },
  {
    name: 'Priya Agarwal',
    initials: 'PA',
    rating: 5,
    content:
      'Dr. Priyanka did my root canal treatment and I was scared but it was completely pain-free. The clinic has modern equipment and the staff is very friendly.',
    context: 'Root Canal',
    source: 'google',
  },
  {
    name: 'Amit Kumar',
    initials: 'AK',
    rating: 5,
    content:
      'Got my smile makeover done here and the results exceeded my expectations. Veneers look completely natural. Best dental clinic in Kanpur!',
    context: 'Smile Makeover',
    source: 'facebook',
  },
  {
    name: 'Neha Verma',
    initials: 'NV',
    rating: 5,
    content:
      'Very hygienic clinic with a warm, welcoming team. My kids are no longer afraid of the dentist thanks to the gentle pediatric care here.',
    context: 'Pediatric Dentistry',
    source: 'facebook',
  },
]

const SummaryCard = ({
  source,
  rating,
  count,
  writeUrl,
  readUrl,
}: {
  source: string
  rating: number
  count: number
  writeUrl: string
  readUrl: string
}) => (
  <div className="glass-card rounded-2xl p-8 text-center">
    <h3 className="text-2xl font-bold text-white mb-2">{source}</h3>
    <div className="text-5xl font-bold gradient-text mb-2">{rating.toFixed(1)}</div>
    <div className="flex justify-center gap-1 mb-2">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-400 text-sm mb-6">Based on {count}+ patient reviews on {source}</p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href={writeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 bg-gradient-primary rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/40 transition-all"
      >
        <PenSquare size={16} /> Write a Review
      </a>
      <a
        href={readUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 glass-card rounded-lg font-semibold text-sm inline-flex items-center justify-center gap-2 hover:border-accent/50 transition-all"
      >
        <ExternalLink size={16} /> Read Reviews
      </a>
    </div>
  </div>
)

const ReviewCard = ({ review, index }: { review: Review; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -8 }}
    className="glass-card rounded-2xl p-8 relative"
  >
    <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
    <div className="flex gap-1 mb-4">
      {[...Array(review.rating)].map((_, i) => (
        <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-300 mb-6 leading-relaxed">"{review.content}"</p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-white">
        {review.initials}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white">{review.name}</h4>
        <p className="text-sm text-gray-400">{review.context}</p>
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
          review.source === 'google'
            ? 'bg-[#4285F4]/15 text-[#8ab4f8]'
            : 'bg-[#1877F2]/15 text-[#7aa7f5]'
        }`}
      >
        {review.source}
      </span>
    </div>
  </motion.div>
)

const Reviews = () => {
  const googleReviews = reviews.filter((review) => review.source === 'google')
  const facebookReviews = reviews.filter((review) => review.source === 'facebook')

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              What Our <span className="gradient-text">Patients Say</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Real stories from real patients, brought together from Google and Facebook.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <SummaryCard
              source="Google"
              rating={5.0}
              count={50}
              writeUrl={GOOGLE_URL}
              readUrl={GOOGLE_URL}
            />
            <SummaryCard
              source="Facebook"
              rating={5.0}
              count={30}
              writeUrl={FACEBOOK_URL}
              readUrl={FACEBOOK_URL}
            />
          </div>

          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Google Reviews</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {googleReviews.map((review, index) => (
                <ReviewCard key={review.name} review={review} index={index} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Facebook Reviews</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facebookReviews.map((review, index) => (
                <ReviewCard key={review.name} review={review} index={index} />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Reviews
