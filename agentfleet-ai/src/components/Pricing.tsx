import { motion } from 'framer-motion'
import { Check, Zap, Globe } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const Pricing = () => {
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [isIndia, setIsIndia] = useState(false)
  const { language } = useLanguage()

  useEffect(() => {
    // Detect user location for currency only
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_code === 'IN') {
          setCurrency('INR')
          setIsIndia(true)
        }
      })
      .catch(() => {
        // Default to USD if detection fails
        setCurrency('USD')
      })
  }, [])

  const plans = [
    {
      nameEN: 'Starter',
      nameHI: 'शुरुआती',
      nameES: 'Inicial',
      nameFR: 'Débutant',
      priceUSD: '$299',
      priceINR: '₹24,999',
      descriptionEN: 'Perfect for small businesses getting started',
      descriptionHI: 'शुरुआत करने वाले छोटे व्यवसायों के लिए एकदम सही',
      descriptionES: 'Perfecto para pequeñas empresas que están comenzando',
      descriptionFR: 'Parfait pour les petites entreprises qui démarrent',
      featuresEN: [
        '2 AI Agents',
        '1,000 interactions/month',
        'Email & SMS automation',
        'Basic CRM integration',
        'Email support',
      ],
      featuresHI: [
        '2 AI एजेंट',
        '1,000 इंटरैक्शन/माह',
        'ईमेल और SMS स्वचालन',
        'बेसिक CRM एकीकरण',
        'ईमेल सहायता',
      ],
      featuresES: [
        '2 Agentes IA',
        '1,000 interacciones/mes',
        'Automatización de correo y SMS',
        'Integración CRM básica',
        'Soporte por correo',
      ],
      featuresFR: [
        '2 Agents IA',
        '1,000 interactions/mois',
        'Automatisation email & SMS',
        'Intégration CRM basique',
        'Support email',
      ],
      highlighted: false,
    },
    {
      nameEN: 'Growth',
      nameHI: 'विकास',
      nameES: 'Crecimiento',
      nameFR: 'Croissance',
      priceUSD: '$799',
      priceINR: '₹66,999',
      descriptionEN: 'Ideal for growing teams',
      descriptionHI: 'बढ़ती टीमों के लिए आदर्श',
      descriptionES: 'Ideal para equipos en crecimiento',
      descriptionFR: 'Idéal pour les équipes en croissance',
      featuresEN: [
        '5 AI Agents',
        '5,000 interactions/month',
        'Voice AI included',
        'Advanced CRM integration',
        'Custom workflows',
        'Priority support',
        'Analytics dashboard',
      ],
      featuresHI: [
        '5 AI एजेंट',
        '5,000 इंटरैक्शन/माह',
        'वॉयस AI शामिल',
        'उन्नत CRM एकीकरण',
        'कस्टम वर्कफ़्लो',
        'प्राथमिकता सहायता',
        'एनालिटिक्स डैशबोर्ड',
      ],
      featuresES: [
        '5 Agentes IA',
        '5,000 interacciones/mes',
        'IA de voz incluida',
        'Integración CRM avanzada',
        'Flujos personalizados',
        'Soporte prioritario',
        'Panel de análisis',
      ],
      featuresFR: [
        '5 Agents IA',
        '5,000 interactions/mois',
        'IA vocale incluse',
        'Intégration CRM avancée',
        'Workflows personnalisés',
        'Support prioritaire',
        'Tableau de bord analytique',
      ],
      highlighted: true,
    },
    {
      nameEN: 'Scale',
      nameHI: 'स्केल',
      nameES: 'Escala',
      nameFR: 'Échelle',
      priceUSD: '$1,999',
      priceINR: '₹1,66,999',
      descriptionEN: 'For businesses ready to scale',
      descriptionHI: 'स्केल करने के लिए तैयार व्यवसायों के लिए',
      descriptionES: 'Para empresas listas para escalar',
      descriptionFR: 'Pour les entreprises prêtes à évoluer',
      featuresEN: [
        'Unlimited AI Agents',
        'Unlimited interactions',
        'Dedicated account manager',
        'Custom AI training',
        'White-label options',
        'API access',
        '24/7 phone support',
        'Custom integrations',
      ],
      featuresHI: [
        'असीमित AI एजेंट',
        'असीमित इंटरैक्शन',
        'समर्पित खाता प्रबंधक',
        'कस्टम AI प्रशिक्षण',
        'व्हाइट-लेबल विकल्प',
        'API एक्सेस',
        '24/7 फोन सहायता',
        'कस्टम एकीकरण',
      ],
      featuresES: [
        'Agentes IA ilimitados',
        'Interacciones ilimitadas',
        'Gerente de cuenta dedicado',
        'Entrenamiento IA personalizado',
        'Opciones de marca blanca',
        'Acceso API',
        'Soporte telefónico 24/7',
        'Integraciones personalizadas',
      ],
      featuresFR: [
        'Agents IA illimités',
        'Interactions illimitées',
        'Gestionnaire de compte dédié',
        'Formation IA personnalisée',
        'Options marque blanche',
        'Accès API',
        'Support téléphonique 24/7',
        'Intégrations personnalisées',
      ],
      highlighted: false,
    },
  ]

  // Helper function to get content based on language
  const getLocalizedContent = (plan: typeof plans[0], key: string) => {
    const langKey = `${key}${language}` as keyof typeof plan
    return plan[langKey] || plan[`${key}EN` as keyof typeof plan]
  }

  return (
    <section id="pricing" className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {language === 'HI' ? (
              <>सरल, <span className="gradient-text">पारदर्शी मूल्य निर्धारण</span></>
            ) : language === 'ES' ? (
              <>Precios <span className="gradient-text">Simples y Transparentes</span></>
            ) : language === 'FR' ? (
              <>Prix <span className="gradient-text">Simple et Transparent</span></>
            ) : (
              <>Simple, <span className="gradient-text">Transparent Pricing</span></>
            )}
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            {language === 'HI'
              ? 'अपनी व्यावसायिक आवश्यकताओं के अनुरूप योजना चुनें'
              : language === 'ES'
              ? 'Elija el plan que se adapte a las necesidades de su negocio'
              : language === 'FR'
              ? 'Choisissez le forfait adapté aux besoins de votre entreprise'
              : 'Choose the plan that fits your business needs'
            }
          </p>

          {/* Currency Switcher */}
          <div className="flex items-center justify-center gap-4">
            <div className="glass-card rounded-full p-1 inline-flex">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  currency === 'USD'
                    ? 'bg-gradient-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  currency === 'INR'
                    ? 'bg-gradient-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                INR (₹)
              </button>
            </div>
            {isIndia && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Globe size={16} className="text-accent" />
                <span>Detected location: India</span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className={`glass-card rounded-2xl p-8 relative ${
                plan.highlighted ? 'border-primary shadow-2xl shadow-primary/20' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-primary rounded-full text-sm font-semibold flex items-center gap-1">
                  <Zap size={16} /> {
                    language === 'HI' ? 'अनुशंसित' :
                    language === 'ES' ? 'Recomendado' :
                    language === 'FR' ? 'Recommandé' :
                    'Recommended'
                  }
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-white">
                {getLocalizedContent(plan, 'name')}
              </h3>
              <p className="text-gray-400 mb-6">
                {getLocalizedContent(plan, 'description')}
              </p>

              <div className="mb-6">
                <span className="text-5xl font-bold gradient-text">
                  {currency === 'USD' ? plan.priceUSD : plan.priceINR}
                </span>
                <span className="text-gray-400">/month</span>
              </div>

              {currency === 'INR' && (
                <div className="mb-4 text-sm text-gray-500">
                  ({plan.priceUSD} {
                    language === 'HI' ? 'USD के बराबर' :
                    language === 'ES' ? 'USD equivalente' :
                    language === 'FR' ? 'USD équivalent' :
                    'USD equivalent'
                  })
                </div>
              )}

              <ul className="space-y-3 mb-8">
                {(getLocalizedContent(plan, 'features') as string[]).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-primary hover:shadow-lg hover:shadow-primary/50'
                    : 'glass-card hover:border-primary/50'
                }`}
              >
                {
                  language === 'HI' ? 'शुरू करें' :
                  language === 'ES' ? 'Empezar' :
                  language === 'FR' ? 'Commencer' :
                  'Get Started'
                }
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Pricing Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-sm text-gray-500"
        >
          {language === 'HI' ? (
            <>
              <p>सभी कीमतें लागू करों को छोड़कर हैं। चेकआउट पर {currency === 'INR' ? 'GST' : 'Sales tax'} जोड़ा जाएगा।</p>
              <p className="mt-2">वार्षिक सदस्यता पर विशेष छूट उपलब्ध है। विवरण के लिए हमसे संपर्क करें।</p>
            </>
          ) : language === 'ES' ? (
            <>
              <p>Todos los precios excluyen los impuestos aplicables. {currency === 'INR' ? 'GST' : 'Impuesto sobre ventas'} se agregará al finalizar la compra.</p>
              <p className="mt-2">Descuentos especiales disponibles para suscripciones anuales. Contáctenos para más detalles.</p>
            </>
          ) : language === 'FR' ? (
            <>
              <p>Tous les prix sont hors taxes applicables. {currency === 'INR' ? 'GST' : 'Taxe de vente'} sera ajoutée lors du paiement.</p>
              <p className="mt-2">Remises spéciales disponibles pour les abonnements annuels. Contactez-nous pour plus de détails.</p>
            </>
          ) : (
            <>
              <p>All prices are exclusive of applicable taxes. {currency === 'INR' ? 'GST' : 'Sales tax'} will be added at checkout.</p>
              <p className="mt-2">Special discounts available for annual subscriptions. Contact us for details.</p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing
