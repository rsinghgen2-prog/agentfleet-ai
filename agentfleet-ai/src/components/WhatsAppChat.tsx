import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send } from 'lucide-react'

const WhatsAppChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<'india' | 'international'>('india')
  const [message, setMessage] = useState('')
  const [showNumberSelect, setShowNumberSelect] = useState(false)

  const whatsappNumbers = {
    india: {
      number: '+916232444211',
      display: '+91 6232 444 211',
      flag: '🇮🇳',
      label: 'India',
    },
    international: {
      number: '+15483891326',
      display: '+1 (548) 389-1326',
      flag: '🇺🇸',
      label: 'International',
    },
  }

  const defaultMessages = [
    'Hello! I need help with AgentFleet AI',
    'I want to book a demo',
    'Tell me about pricing',
    'How does AgentFleet AI work?',
  ]

  const handleSendMessage = (customMessage?: string) => {
    const messageText = customMessage || message
    const phoneNumber = whatsappNumbers[selectedNumber].number
    const encodedMessage = encodeURIComponent(messageText)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    setMessage('')
    setIsOpen(false)
  }

  const handleQuickMessage = (msg: string) => {
    setMessage(msg)
    handleSendMessage(msg)
  }

  return (
    <>
      {/* WhatsApp Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all"
        aria-label="Open WhatsApp Chat"
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <MessageCircle size={28} className="text-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] glass-card rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-green-500 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle size={24} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AgentFleet AI</h3>
                    <p className="text-sm text-green-100">Typically replies instantly</p>
                  </div>
                </div>
              </div>

              {/* Number Selector */}
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setShowNumberSelect(!showNumberSelect)}
                  className="w-full flex items-center justify-between bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-all"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span>{whatsappNumbers[selectedNumber].flag}</span>
                    <span>{whatsappNumbers[selectedNumber].display}</span>
                  </span>
                  <span className="text-xs">{showNumberSelect ? '▲' : '▼'}</span>
                </button>

                {showNumberSelect && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <button
                      onClick={() => {
                        setSelectedNumber('india')
                        setShowNumberSelect(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        selectedNumber === 'india'
                          ? 'bg-green-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <span>{whatsappNumbers.india.flag}</span>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold">{whatsappNumbers.india.label}</div>
                        <div className="text-xs">{whatsappNumbers.india.display}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNumber('international')
                        setShowNumberSelect(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        selectedNumber === 'international'
                          ? 'bg-green-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <span>{whatsappNumbers.international.flag}</span>
                      <div className="text-left flex-1">
                        <div className="text-sm font-semibold">{whatsappNumbers.international.label}</div>
                        <div className="text-xs">{whatsappNumbers.international.display}</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 bg-background/95 backdrop-blur-sm min-h-[300px] max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {/* Welcome Message */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-200">
                      Hi there! 👋 How can we help you today?
                    </p>
                  </div>
                </div>

                {/* Quick Reply Buttons */}
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-gray-400 mb-2">Quick messages:</p>
                  {defaultMessages.map((msg, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickMessage(msg)}
                      className="w-full text-left px-4 py-2 glass-card rounded-lg hover:bg-white/10 transition-all text-sm text-gray-200"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-background border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && message && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 glass-card rounded-full focus:outline-none focus:border-green-500/50 transition-all text-white text-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!message}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    message
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by WhatsApp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default WhatsAppChat
