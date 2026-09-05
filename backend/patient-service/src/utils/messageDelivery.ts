export type MessageDeliveryProvider = 'twilio' | 'vonage' | null

export function messageDeliveryProvider(): MessageDeliveryProvider {
  const provider = process.env.MESSAGE_DELIVERY_PROVIDER?.toLowerCase()
  return provider === 'twilio' || provider === 'vonage' ? provider : null
}

export function messageDeliveryStatus() {
  const provider = messageDeliveryProvider()
  return { provider, configured: provider !== null }
}