# WhatsApp Chat Widget - Documentation

## 📱 Overview

A beautiful, fully-functional WhatsApp chat widget has been added to the AgentFleet AI website. Users can instantly connect with your team via WhatsApp from any page.

---

## ✨ Features

### 1. Floating Chat Button
- **Position:** Bottom-right corner (fixed)
- **Design:** Green circular button with WhatsApp icon
- **Animation:** Smooth entrance, hover scale effect
- **Visibility:** Available on all pages (Home & Book Demo)

### 2. Dual WhatsApp Numbers
Users can choose which number to contact:

**India Number:**
- Number: +91 6232 444 211
- Display: +91 6232 444 211
- Flag: 🇮🇳
- Label: India

**International Number:**
- Number: +1 (548) 389-1326
- Display: +1 (548) 389-1326
- Flag: 🇺🇸
- Label: International

### 3. Number Selection
- Dropdown selector in chat header
- Shows current selected number
- Easy switching between numbers
- Visual indicators (flags, labels)

### 4. Quick Reply Messages
Pre-configured messages for instant communication:
1. "Hello! I need help with AgentFleet AI"
2. "I want to book a demo"
3. "Tell me about pricing"
4. "How does AgentFleet AI work?"

### 5. Custom Message Input
- Text input field for custom messages
- Send button (enabled when text is entered)
- Enter key support for quick sending
- Character limit: unlimited

### 6. WhatsApp Integration
- Direct WhatsApp link generation
- Pre-filled message text
- Opens in new tab
- Works on desktop and mobile
- Uses official WhatsApp API (`wa.me`)

---

## 🎨 Design

### Colors
- **Primary Green:** `#22C55E` (WhatsApp green)
- **Hover Green:** `#16A34A`
- **Background:** Dark glassmorphism
- **Text:** White/Light gray

### Components
- **Button:** 64px circular, green background
- **Chat Window:** 384px width, rounded corners
- **Header:** Green background with white text
- **Messages:** Dark background with glassmorphism
- **Input:** Rounded full, dark background

### Animations
- Entrance: Scale from 0 to 1
- Exit: Scale to 0.95 with fade
- Hover: Scale to 1.1
- Tap: Scale to 0.9

---

## 🔧 How It Works

### User Flow
1. **User clicks WhatsApp button** → Chat window opens
2. **User selects country** → India or International
3. **User chooses action:**
   - **Option A:** Click quick reply message
   - **Option B:** Type custom message and click send
4. **WhatsApp opens** → New tab with pre-filled message
5. **User continues** → In WhatsApp app/web

### Technical Implementation
```typescript
// WhatsApp URL Format
https://wa.me/{phone_number}?text={encoded_message}

// Example
https://wa.me/916232444211?text=Hello!%20I%20need%20help%20with%20AgentFleet%20AI
```

### State Management
- `isOpen`: Chat window visibility
- `selectedNumber`: Current WhatsApp number ('india' | 'international')
- `message`: User's custom message text
- `showNumberSelect`: Number dropdown visibility

---

## 📱 Mobile Responsive

### Mobile Optimizations
- Chat window: `max-w-[calc(100vw-3rem)]`
- Touch-friendly buttons
- Swipe gestures support
- Native WhatsApp app integration
- Adaptive font sizes

---

## 🚀 Usage Examples

### Quick Message
1. Click WhatsApp button
2. Click "I want to book a demo"
3. WhatsApp opens with: "I want to book a demo"

### Custom Message
1. Click WhatsApp button
2. Type: "Can you help me with pricing for 50+ employees?"
3. Click send button
4. WhatsApp opens with custom message

### Change Number
1. Click WhatsApp button
2. Click number dropdown
3. Select "International" 🇺🇸
4. Send message to international number

---

## 🎯 Benefits

### For Users
✅ Instant communication
✅ Familiar WhatsApp interface
✅ Choose preferred number
✅ Quick pre-written messages
✅ Works on all devices

### For Business
✅ Direct customer communication
✅ Multiple contact points
✅ 24/7 availability indicator
✅ Professional appearance
✅ Easy to track conversations

---

## 🔒 Privacy & Security

- No data collection by widget
- Direct WhatsApp connection
- No message storage
- End-to-end encryption (WhatsApp native)
- GDPR compliant

---

## 📊 Performance

- **Size:** ~3.5 kB (gzipped)
- **Load Time:** Instant
- **Dependencies:** Framer Motion (already included)
- **Impact:** Minimal (lazy-loaded on user interaction)

---

## 🎨 Customization Options

You can easily customize:
1. **Colors:** Change green to match brand
2. **Quick Messages:** Edit pre-defined messages
3. **Numbers:** Update WhatsApp numbers
4. **Position:** Move to different corner
5. **Timing:** Auto-open after X seconds

---

## 🐛 Troubleshooting

**Issue:** WhatsApp doesn't open
- **Solution:** Check phone number format (no spaces, dashes)

**Issue:** Message not pre-filled
- **Solution:** Ensure URL encoding is correct

**Issue:** Widget not visible
- **Solution:** Check z-index and fixed positioning

---

## 📝 Future Enhancements

Possible additions:
- [ ] Chat history storage
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File attachments
- [ ] Multi-language support
- [ ] Analytics tracking
- [ ] Chatbot responses
- [ ] Business hours indicator

---

**Version:** 1.0
**Last Updated:** July 23, 2026
**Status:** ✅ Production Ready
