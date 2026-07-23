import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Building2, Calendar, Lock, CheckCircle, X, ArrowLeft } from 'lucide-react'

interface CurrencyInfo {
  code: string
  symbol: string
  rate: number
  country: string
}

const Payment = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card')
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })
  const [upiId, setUpiId] = useState('')
  const [currency, setCurrency] = useState<CurrencyInfo>({
    code: 'USD',
    symbol: '$',
    rate: 1,
    country: 'Unknown'
  })

  // Detect currency from location
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Check cached currency first
        const cachedCurrency = localStorage.getItem('userCurrency')
        if (cachedCurrency) {
          setCurrency(JSON.parse(cachedCurrency))
          return
        }

        // Fetch location
        const locationResponse = await fetch('https://ipapi.co/json/')
        const locationData = await locationResponse.json()

        const countryCode = locationData.country_code
        const countryName = locationData.country_name

        let currencyInfo: CurrencyInfo = {
          code: 'USD',
          symbol: '$',
          rate: 1,
          country: countryName
        }

        if (countryCode === 'IN') {
          const rateResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
          const rateData = await rateResponse.json()
          currencyInfo = {
            code: 'INR',
            symbol: '₹',
            rate: rateData.rates.INR,
            country: 'India'
          }
        }

        setCurrency(currencyInfo)
      } catch (error) {
        console.error('Error detecting currency:', error)
      }
    }

    detectCurrency()
  }, [])

  useEffect(() => {
    const registration = localStorage.getItem('userRegistration')
    if (!registration) {
      navigate('/register')
      return
    }

    const data = JSON.parse(registration)
    setUserData(data)

    // If already paid or free plan, redirect
    if (data.paymentCompleted || data.plan === 'free') {
      navigate('/dashboard')
    }
  }, [navigate])

  const getPlanPrice = () => {
    if (!userData) return 0

    // Base prices in USD
    let priceUSD = 0
    switch (userData.plan) {
      case 'starter': priceUSD = 299; break
      case 'growth': priceUSD = 799; break
      case 'scale': priceUSD = 1999; break
      default: priceUSD = 0
    }

    return priceUSD
  }

  const formatPrice = (priceUSD: number) => {
    const convertedPrice = priceUSD * currency.rate
    return `${currency.symbol}${convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    if (e.target.name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }

    if (e.target.name === 'expiryDate') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4)
      }
      if (value.length > 5) return
    }

    if (e.target.name === 'cvv') {
      value = value.replace(/\D/g, '')
      if (value.length > 3) return
    }

    setCardData({ ...cardData, [e.target.name]: value })
  }

  const handleSkipPayment = () => {
    // Update to free plan
    const updatedData = {
      ...userData,
      plan: 'free',
      paymentCompleted: false,
      isSubscribed: false
    }
    localStorage.setItem('userRegistration', JSON.stringify(updatedData))
    navigate('/dashboard')
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryDate || !cardData.cvv) {
        alert('Please fill in all card details')
        return
      }
    } else {
      if (!upiId) {
        alert('Please enter UPI ID')
        return
      }
    }

    // Simulate payment processing
    setTimeout(() => {
      const updatedData = {
        ...userData,
        paymentCompleted: true,
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString(),
        isSubscribed: true
      }
      localStorage.setItem('userRegistration', JSON.stringify(updatedData))

      // Show success and redirect
      alert('Payment successful! Welcome to your premium plan.')
      navigate('/dashboard')
    }, 1500)
  }

  if (!userData) return null

  const price = getPlanPrice()

  return (
    <div className="min-h-screen bg-background px-4 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/register')}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Plan Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Complete Your <span className="gradient-text">Subscription</span>
              </h1>
              <p className="text-gray-400">
                You're almost there! Complete payment to activate your plan.
              </p>
            </div>

            {/* Plan Card */}
            <div className="glass-card rounded-2xl p-6 border-2 border-primary/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold capitalize">{userData.plan} Plan</h3>
                <CheckCircle className="text-green-400" size={24} />
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Plan:</span>
                  <span className="text-white font-semibold capitalize">{userData.plan}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Billing Cycle:</span>
                  <span className="text-white font-semibold">Monthly</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Total Amount:</span>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{formatPrice(price)}</p>
                    <p className="text-xs text-gray-400">
                      {currency.code} • Detected from {currency.country}
                    </p>
                    {currency.code !== 'USD' && (
                      <p className="text-xs text-gray-500 mt-1">
                        ≈ ${price} USD (Live rate: 1 USD = {currency.symbol}{currency.rate.toFixed(2)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skip Payment */}
            <button
              onClick={handleSkipPayment}
              className="w-full p-4 glass-card rounded-lg hover:border-yellow-500/50 transition-all flex items-center justify-center gap-2 text-yellow-400"
            >
              <X size={20} />
              Skip Payment & Use Free Plan (100 messages/day)
            </button>

            <p className="text-sm text-gray-500 text-center">
              💡 You can upgrade to a paid plan anytime from your dashboard
            </p>
          </motion.div>

          {/* Right: Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Payment Details</h2>

            {/* Payment Method Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-gradient-primary'
                    : 'glass-card hover:border-primary/50'
                }`}
              >
                💳 Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-gradient-primary'
                    : 'glass-card hover:border-primary/50'
                }`}
              >
                📱 UPI
              </button>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              {paymentMethod === 'card' ? (
                <>
                  {/* Card Number */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardData.cardNumber}
                        onChange={handleCardInputChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Card Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Cardholder Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="cardName"
                        value={cardData.cardName}
                        onChange={handleCardInputChange}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Expiry Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="expiryDate"
                          value={cardData.expiryDate}
                          onChange={handleCardInputChange}
                          placeholder="MM/YY"
                          className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">CVV</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="cvv"
                          value={cardData.cvv}
                          onChange={handleCardInputChange}
                          placeholder="123"
                          className="w-full pl-12 pr-4 py-3 glass-card rounded-lg text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* UPI ID */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="w-full px-4 py-3 glass-card rounded-lg text-white"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: Google Pay, PhonePe, Paytm, BHIM
                    </p>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="p-6 border-2 border-dashed border-white/20 rounded-xl text-center">
                    <div className="w-48 h-48 mx-auto bg-white/5 rounded-lg flex items-center justify-center mb-4">
                      <p className="text-gray-500">QR Code</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      Scan to pay {formatPrice(price)}
                    </p>
                  </div>
                </>
              )}

              {/* Security Info */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <Lock size={16} />
                  Your payment information is secure and encrypted
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
              >
                Pay {formatPrice(price)}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Payment
