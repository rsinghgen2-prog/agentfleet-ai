# Automatic Localization - Pricing Section

## 🌍 Overview

The Pricing section now automatically adapts to the user's location, displaying content in their local language and currency without any manual selection needed.

---

## ✨ Features

### Automatic Language Detection
Based on browser location detection:
- **India Users** → See content in Hindi (हिंदी)
- **Other Countries** → See content in English

### What Gets Localized

#### 1. Section Title
**English:**
```
Simple, Transparent Pricing
```

**Hindi:**
```
सरल, पारदर्शी मूल्य निर्धारण
```

#### 2. Subtitle
**English:**
```
Choose the plan that fits your business needs
```

**Hindi:**
```
अपनी व्यावसायिक आवश्यकताओं के अनुरूप योजना चुनें
```

#### 3. Plan Names
| English | Hindi |
|---------|-------|
| Starter | शुरुआती |
| Growth | विकास |
| Scale | स्केल |

#### 4. Plan Descriptions
**Starter:**
- EN: "Perfect for small businesses getting started"
- HI: "शुरुआत करने वाले छोटे व्यवसायों के लिए एकदम सही"

**Growth:**
- EN: "Ideal for growing teams"
- HI: "बढ़ती टीमों के लिए आदर्श"

**Scale:**
- EN: "For businesses ready to scale"
- HI: "स्केल करने के लिए तैयार व्यवसायों के लिए"

#### 5. Feature Lists
All features are translated:

**Example - Starter Plan:**
```
English:
- 2 AI Agents
- 1,000 interactions/month
- Email & SMS automation
- Basic CRM integration
- Email support

Hindi:
- 2 AI एजेंट
- 1,000 इंटरैक्शन/माह
- ईमेल और SMS स्वचालन
- बेसिक CRM एकीकरण
- ईमेल सहायता
```

#### 6. Call-to-Action Buttons
- EN: "Get Started"
- HI: "शुरू करें"

#### 7. Recommended Badge
- EN: "Recommended"
- HI: "अनुशंसित"

#### 8. USD Equivalent Text
- EN: "(USD equivalent)"
- HI: "(USD के बराबर)"

#### 9. Tax Information
**English:**
```
All prices are exclusive of applicable taxes. Sales tax will be added at checkout.
Special discounts available for annual subscriptions. Contact us for details.
```

**Hindi:**
```
सभी कीमतें लागू करों को छोड़कर हैं। चेकआउट पर GST जोड़ा जाएगा।
वार्षिक सदस्यता पर विशेष छूट उपलब्ध है। विवरण के लिए हमसे संपर्क करें।
```

---

## 🎯 How It Works

### Detection Flow
```
1. User visits page
   ↓
2. IP geolocation API checks location
   ↓
3. If India → Set currency = INR, language = Hindi
   ↓
4. If Other → Set currency = USD, language = English
   ↓
5. All content updates automatically
```

### Technical Implementation
```typescript
// Currency state drives language
const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')

// Location detection
useEffect(() => {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      if (data.country_code === 'IN') {
        setCurrency('INR')  // Also triggers Hindi
      }
    })
}, [])

// Conditional rendering
{currency === 'INR' ? plan.nameHI : plan.nameEN}
```

---

## 🔄 Manual Override

Users can still manually switch currency (and language) using the toggle:
- Click USD → Switch to English
- Click INR → Switch to Hindi

---

## 📊 Localized Content Matrix

| Element | English | Hindi |
|---------|---------|-------|
| Title | Simple, Transparent Pricing | सरल, पारदर्शी मूल्य निर्धारण |
| Subtitle | Choose the plan... | अपनी व्यावसायिक... |
| Plan 1 | Starter | शुरुआती |
| Plan 2 | Growth | विकास |
| Plan 3 | Scale | स्केल |
| Button | Get Started | शुरू करें |
| Badge | Recommended | अनुशंसित |
| Tax Note | Sales tax | GST |

---

## 🌟 Benefits

### For Indian Users
✅ Familiar language (Hindi)
✅ Local currency (₹)
✅ GST mentioned specifically
✅ Better user experience

### For International Users
✅ English content
✅ USD pricing
✅ Sales tax information
✅ Standard format

---

## 🎨 User Experience

### India User Journey
1. Visits page from India
2. Sees pricing in Hindi automatically
3. Prices shown in ₹ (Rupees)
4. All features in Hindi
5. Can switch to English if preferred

### International User Journey
1. Visits page from USA/UK/etc
2. Sees pricing in English automatically
3. Prices shown in $ (Dollars)
4. All features in English
5. Can switch to INR if needed

---

## 📱 Compatibility

- Works on all browsers
- Mobile responsive
- No additional libraries needed
- Fallback to English if detection fails
- Manual override always available

---

## 🔧 Customization

To add more languages, update the plan objects:
```typescript
{
  nameEN: 'Starter',
  nameHI: 'शुरुआती',
  nameES: 'Iniciador',  // Spanish
  nameFR: 'Débutant',   // French
  // etc...
}
```

---

## ✅ What's Different Now

**Before:**
- Static "Simple, Transparent Pricing" for all users
- English only
- Manual currency selection required

**After:**
- Dynamic title based on location
- Hindi for India, English for others
- Automatic currency AND language
- Seamless localization

---

**Version:** 2.0
**Languages:** English, Hindi (हिंदी)
**Auto-Detection:** ✅ Enabled
**Manual Override:** ✅ Available
