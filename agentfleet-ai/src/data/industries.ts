import type { LucideIcon } from 'lucide-react'
import {
  HeartPulse,
  GraduationCap,
  Cpu,
  Plane,
  Landmark,
  ShoppingBag,
  Factory,
  Building2,
  Zap,
  Clapperboard,
  Wheat,
  LayoutGrid,
} from 'lucide-react'

export interface Industry {
  slug: string
  name: string
  icon: LucideIcon
  tagline: string
  description: string
  highlights: string[]
}

export const industries: Industry[] = [
  {
    slug: 'healthcare-life-sciences',
    name: 'Healthcare & Life Sciences',
    icon: HeartPulse,
    tagline: 'Automate patient engagement and clinical operations.',
    description:
      'Deploy AI agents that handle appointment scheduling, patient follow-ups, insurance verification, and 24/7 triage — freeing clinical staff to focus on care while staying compliant.',
    highlights: [
      'Patient scheduling, reminders & no-show reduction',
      'Automated intake, follow-ups & post-visit care',
      'Insurance verification & prior-authorization support',
      'HIPAA-conscious workflows and secure data handling',
    ],
  },
  {
    slug: 'education',
    name: 'Education',
    icon: GraduationCap,
    tagline: 'Support students and staff around the clock.',
    description:
      'AI agents answer admissions questions, guide enrollment, deliver personalized tutoring prompts, and automate administrative tasks for schools, colleges, and training providers.',
    highlights: [
      'Admissions & enrollment assistance 24/7',
      'Student support desk and FAQ automation',
      'Personalized learning nudges & reminders',
      'Administrative workflow automation for staff',
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    icon: Cpu,
    tagline: 'Scale support and developer experience with AI.',
    description:
      'From tier-1 support deflection to onboarding and lead qualification, AI agents help SaaS and tech teams move faster while keeping response times instant.',
    highlights: [
      'Tier-1 technical support & ticket deflection',
      'Product onboarding & in-app guidance',
      'Lead qualification & demo scheduling',
      'Integration with your existing tooling & APIs',
    ],
  },
  {
    slug: 'hospitality-tourism',
    name: 'Hospitality & Tourism',
    icon: Plane,
    tagline: 'Delight guests before, during, and after their stay.',
    description:
      'AI agents manage bookings, answer traveler questions, handle upsells, and provide concierge-level service across chat, phone, and messaging channels.',
    highlights: [
      'Reservations, modifications & confirmations',
      'Multilingual guest concierge & FAQs',
      'Upsells, packages & local recommendations',
      'Post-stay feedback & review collection',
    ],
  },
  {
    slug: 'finance-insurance',
    name: 'Finance & Insurance',
    icon: Landmark,
    tagline: 'Qualify, quote, and service clients faster.',
    description:
      'Automate lead qualification, quote generation, policy renewals, and claims intake with AI agents that maintain accuracy and an audit-friendly trail.',
    highlights: [
      'Lead qualification & instant quotes',
      'Policy renewals & payment reminders',
      'Claims intake & status updates',
      'Compliance-aware, auditable interactions',
    ],
  },
  {
    slug: 'retail-ecommerce',
    name: 'Retail & E-commerce',
    icon: ShoppingBag,
    tagline: 'Convert shoppers and support customers 24/7.',
    description:
      'AI agents recommend products, answer order questions, recover abandoned carts, and handle returns — driving revenue while reducing support load.',
    highlights: [
      'Product discovery & personalized recommendations',
      'Order tracking, returns & exchanges',
      'Abandoned-cart recovery & upsells',
      'Round-the-clock customer support',
    ],
  },
  {
    slug: 'manufacturing-industrial',
    name: 'Manufacturing & Industrial',
    icon: Factory,
    tagline: 'Streamline operations and supplier coordination.',
    description:
      'Deploy agents for order processing, RFQ handling, supplier communication, and after-sales support to keep production and logistics running smoothly.',
    highlights: [
      'Order & RFQ processing automation',
      'Supplier & distributor coordination',
      'After-sales support & warranty handling',
      'Inventory and dispatch status updates',
    ],
  },
  {
    slug: 'real-estate-construction',
    name: 'Real Estate & Construction',
    icon: Building2,
    tagline: 'Qualify leads and manage projects effortlessly.',
    description:
      'AI agents qualify buyers and tenants, schedule viewings, follow up automatically, and keep clients informed on project milestones.',
    highlights: [
      'Buyer & tenant lead qualification',
      'Viewing & site-visit scheduling',
      'Automated follow-ups & nurturing',
      'Project milestone & status notifications',
    ],
  },
  {
    slug: 'energy-utilities',
    name: 'Energy & Utilities',
    icon: Zap,
    tagline: 'Serve customers and manage requests at scale.',
    description:
      'Automate billing inquiries, outage reporting, service requests, and usage guidance with AI agents built for high-volume utility operations.',
    highlights: [
      'Billing & payment inquiries',
      'Outage reporting & status updates',
      'New service requests & scheduling',
      'Energy-usage guidance & tips',
    ],
  },
  {
    slug: 'media-entertainment',
    name: 'Media & Entertainment',
    icon: Clapperboard,
    tagline: 'Engage audiences and monetize attention.',
    description:
      'AI agents handle subscriber support, content discovery, ticketing, and fan engagement across every channel your audience uses.',
    highlights: [
      'Subscriber & fan support',
      'Content discovery & recommendations',
      'Ticketing, events & access management',
      'Audience engagement & feedback',
    ],
  },
  {
    slug: 'agriculture-food',
    name: 'Agriculture & Food',
    icon: Wheat,
    tagline: 'Connect growers, buyers, and customers.',
    description:
      'From order intake and traceability queries to farmer support and distribution coordination, AI agents keep the food supply chain responsive.',
    highlights: [
      'Order intake & fulfillment support',
      'Traceability & sourcing inquiries',
      'Farmer & supplier assistance',
      'Distribution & delivery coordination',
    ],
  },
  {
    slug: 'other-common',
    name: 'Other / Common',
    icon: LayoutGrid,
    tagline: 'Flexible AI agents for any business need.',
    description:
      "Don't see your industry? Our AI agents adapt to any workflow — customer support, scheduling, lead generation, and automation tailored to how you work.",
    highlights: [
      'Customer support & FAQ automation',
      'Appointment & booking management',
      'Lead capture & qualification',
      'Fully customizable to your workflows',
    ],
  },
]
