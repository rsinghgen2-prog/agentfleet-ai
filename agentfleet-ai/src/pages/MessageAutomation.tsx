import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  MessageSquare,
  Send,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  ArrowLeft,
  Download,
  Trash2
} from 'lucide-react'
import { DashboardService, type MessageCampaign, type MessageCampaignRecipient } from '../services/dashboardService'

const MessageAutomation = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'send' | 'campaigns' | 'analytics'>('send')
  const [messageType, setMessageType] = useState<'whatsapp' | 'sms'>('whatsapp')
  const [uploadMethod, setUploadMethod] = useState<'file' | 'manual'>('file')
  const [contacts, setContacts] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([])
  const [feedback, setFeedback] = useState('')
  const [messageData, setMessageData] = useState({
    subject: '',
    message: '',
    scheduleType: 'now',
    scheduleDate: '',
    scheduleTime: '',
  })

  // Check if user is registered
  useEffect(() => {
    const registration = localStorage.getItem('userRegistration')
    if (!registration) {
      // Redirect to registration if not registered
      navigate('/register')
    }
  }, [navigate])

  const loadCampaigns = async () => {
    try { setCampaigns(await DashboardService.getMessageCampaigns()) }
    catch (error) { setFeedback(error instanceof Error ? error.message : 'Unable to load campaigns') }
  }
  useEffect(() => { void loadCampaigns() }, [])

  // Load user subscription status from localStorage
  const [userSubscription] = useState(() => {
    const registration = localStorage.getItem('userRegistration')
    const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true'

    if (isSuperAdmin) {
      return {
        isSubscribed: true,
        plan: 'Super Admin',
        messagesUsedToday: 0,
        messageLimit: 999999999,
        resetTime: 'N/A',
      }
    }

    if (registration) {
      const data = JSON.parse(registration)
      return {
        isSubscribed: data.plan !== 'free',
        plan: data.plan === 'free' ? 'Free' : data.plan === 'starter' ? 'Starter' : 'Growth',
        messagesUsedToday: 45,
        messageLimit: data.plan === 'free' ? 100 : 999999,
        resetTime: '24 hours',
      }
    }
    return {
      isSubscribed: false,
      plan: 'Free',
      messagesUsedToday: 45,
      messageLimit: 100,
      resetTime: '24 hours',
    }
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) { setFeedback('Upload a CSV file with Name, Phone, Email columns.'); return }
    const rows = (await file.text()).split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const parsed = rows.slice(1).map((line) => { const [name = '', phone = '', email = ''] = line.split(',').map((value) => value.trim()); return { name, phone, email: email || null } }).filter((contact) => contact.phone.length >= 5)
    setContacts(parsed); setFeedback(parsed.length ? `${parsed.length} contacts loaded.` : 'No valid contacts found in the CSV.')
  }

  const handleSendMessage = async () => {
    const totalRecipients = contacts.length
    const remainingMessages = userSubscription.messageLimit - userSubscription.messagesUsedToday

    if (!userSubscription.isSubscribed && totalRecipients > remainingMessages) {
      setFeedback(`You can only send ${remainingMessages} more messages today.`)
      return
    }

    if (!messageData.message) {
      setFeedback('Enter a message before continuing.')
      return
    }

    if (contacts.length === 0) {
      setFeedback('Add at least one valid contact before continuing.')
      return
    }
    const scheduledAt = messageData.scheduleType === 'later' && messageData.scheduleDate && messageData.scheduleTime ? new Date(`${messageData.scheduleDate}T${messageData.scheduleTime}`).toISOString() : null
    try {
      const campaign = await DashboardService.createMessageCampaign({ name: messageData.subject.trim() || `Campaign ${new Date().toLocaleDateString('en-IN')}`, channel: messageType, message: messageData.message.trim(), recipients: contacts as MessageCampaignRecipient[], scheduledAt })
      const queued = scheduledAt ? campaign : (await DashboardService.queueMessageCampaign(campaign.id)).campaign
      setCampaigns((current) => [queued, ...current]); setFeedback(scheduledAt ? 'Campaign scheduled.' : 'Campaign queued for provider delivery.'); setMessageData({ subject: '', message: '', scheduleType: 'now', scheduleDate: '', scheduleTime: '' }); setContacts([])
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Unable to save campaign') }
  }

  const deleteCampaign = async (id: string) => { try { await DashboardService.deleteMessageCampaign(id); setCampaigns((current) => current.filter((campaign) => campaign.id !== id)); setFeedback('Campaign deleted.') } catch (error) { setFeedback(error instanceof Error ? error.message : 'Unable to delete campaign') } }

  const downloadTemplate = () => {
    const csvContent = "Name,Phone,Email\nJohn Doe,+1234567890,john@example.com\nJane Smith,+1234567891,jane@example.com"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_template.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-background px-4 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} /> Back to Home
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Message <span className="gradient-text">Automation</span>
              </h1>
              <p className="text-gray-400">Send WhatsApp & SMS campaigns to your customers</p>
            </div>

            {/* Subscription Status */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${userSubscription.isSubscribed ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                <div>
                  <p className="font-semibold text-white">{userSubscription.plan} Plan</p>
                  {!userSubscription.isSubscribed && (
                    <p className="text-sm text-gray-400">
                      {userSubscription.messagesUsedToday}/{userSubscription.messageLimit} messages used today
                    </p>
                  )}
                  {userSubscription.isSubscribed && (
                    <p className="text-sm text-green-400">Unlimited Messages</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="glass-card rounded-xl p-2 mb-8 flex gap-2">
          {[
            { id: 'send', label: 'Send Message', icon: Send },
            { id: 'campaigns', label: 'Campaigns', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Message Type Selection */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="text-primary" size={24} />
                Select Message Type
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setMessageType('whatsapp')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    messageType === 'whatsapp'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 hover:border-green-500/50'
                  }`}
                >
                  <div className="text-4xl mb-2">💬</div>
                  <h4 className="font-bold text-lg mb-1">WhatsApp</h4>
                  <p className="text-sm text-gray-400">Rich media, high engagement</p>
                </button>
                <button
                  onClick={() => setMessageType('sms')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    messageType === 'sms'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-4xl mb-2">📱</div>
                  <h4 className="font-bold text-lg mb-1">SMS</h4>
                  <p className="text-sm text-gray-400">Universal, reliable delivery</p>
                </button>
              </div>
            </div>

            {/* Upload Contacts */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="text-primary" size={24} />
                Upload Contacts
              </h3>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    uploadMethod === 'file'
                      ? 'bg-gradient-primary'
                      : 'glass-card hover:border-primary/50'
                  }`}
                >
                  Upload CSV
                </button>
                <button
                  onClick={() => setUploadMethod('manual')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    uploadMethod === 'manual'
                      ? 'bg-gradient-primary'
                      : 'glass-card hover:border-primary/50'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  onClick={downloadTemplate}
                  className="ml-auto px-4 py-2 glass-card rounded-lg hover:border-primary/50 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Download Template
                </button>
              </div>

              {uploadMethod === 'file' ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-all">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={48} className="mx-auto mb-4 text-primary" />
                    <p className="font-semibold mb-2">Click to upload CSV or Excel file</p>
                    <p className="text-sm text-gray-400">Supports CSV, XLSX (Max 10MB)</p>
                  </label>
                </div>
              ) : (
                <textarea
                  placeholder="Enter contacts manually (one per line)&#10;Format: Name, Phone, Email&#10;Example: John Doe, +1234567890, john@example.com"
                  className="w-full h-32 px-4 py-3 glass-card rounded-lg text-white resize-none"
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter(line => line.trim())
                    const parsed = lines.map(line => {
                      const parts = line.split(',').map(p => p.trim())
                      return { name: parts[0], phone: parts[1], email: parts[2] }
                    })
                    setContacts(parsed)
                  }}
                />
              )}

              {contacts.length > 0 && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 flex items-center gap-2">
                    <CheckCircle size={20} />
                    {contacts.length} contacts uploaded successfully
                  </p>
                </div>
              )}
            </div>

            {/* Message Composer */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="text-primary" size={24} />
                Compose Message
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    placeholder="e.g., Summer Sale 2026"
                    className="w-full px-4 py-3 glass-card rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Message</label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    placeholder="Enter your message here...&#10;&#10;Use variables: {name}, {email}, {phone}"
                    rows={6}
                    className="w-full px-4 py-3 glass-card rounded-lg text-white resize-none"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Character count: {messageData.message.length} |
                    {messageType === 'sms' ? ' SMS limit: 160 characters' : ' WhatsApp: No limit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-primary" size={24} />
                Schedule
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setMessageData({ ...messageData, scheduleType: 'now' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    messageData.scheduleType === 'now'
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-primary/50'
                  }`}
                >
                  <Zap className="mb-2" size={24} />
                  <p className="font-semibold">Send Now</p>
                </button>
                <button
                  onClick={() => setMessageData({ ...messageData, scheduleType: 'later' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    messageData.scheduleType === 'later'
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-primary/50'
                  }`}
                >
                  <Clock className="mb-2" size={24} />
                  <p className="font-semibold">Schedule</p>
                </button>
              </div>

              {messageData.scheduleType === 'later' && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <input
                    type="date"
                    value={messageData.scheduleDate}
                    onChange={(e) => setMessageData({ ...messageData, scheduleDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-4 py-3 glass-card rounded-lg text-white"
                  />
                  <input
                    type="time"
                    value={messageData.scheduleTime}
                    onChange={(e) => setMessageData({ ...messageData, scheduleTime: e.target.value })}
                    className="px-4 py-3 glass-card rounded-lg text-white"
                  />
                </div>
              )}
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendMessage}
              className="w-full py-4 bg-gradient-primary rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              <Send size={20} />
              {messageData.scheduleType === 'now' ? 'Send Message' : 'Schedule Message'}
            </motion.button>
            {feedback && <p role="status" className="text-center text-sm text-gray-300">{feedback}</p>}

            {!userSubscription.isSubscribed && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Free plan: {userSubscription.messageLimit - userSubscription.messagesUsedToday} messages remaining today.
                  <button
                    onClick={() => navigate('/pricing')}
                    className="underline hover:text-yellow-300"
                  >
                    Upgrade for unlimited
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6">Campaign History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Campaign</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Recipients</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Delivered</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-semibold">{campaign.name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          campaign.channel === 'whatsapp' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {campaign.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </span>
                      </td>
                      <td className="py-4 px-4">{campaign.recipient_count}</td>
                      <td className="py-4 px-4">-</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          campaign.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400">{new Date(campaign.scheduled_at || campaign.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => void deleteCampaign(campaign.id)} disabled={!['draft', 'cancelled'].includes(campaign.status)} aria-label={`Delete ${campaign.name}`} className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:cursor-not-allowed disabled:opacity-40">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Total Sent', value: '3,250', color: 'text-blue-400', bg: 'bg-blue-500/20' },
                { label: 'Delivered', value: '3,180', color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Opened', value: '2,890', color: 'text-purple-400', bg: 'bg-purple-500/20' },
                { label: 'Clicked', value: '1,456', color: 'text-orange-400', bg: 'bg-orange-500/20' },
              ].map((stat, index) => (
                <div key={index} className="glass-card rounded-2xl p-6">
                  <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                  <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-4">Delivery Rate</h3>
              <div className="h-64 flex items-center justify-center text-gray-400">
                Chart placeholder - Integrate with your analytics library
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default MessageAutomation
