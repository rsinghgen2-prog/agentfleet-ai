# 🚀 Quick Start Guide - AgentFleet AI

## Get Started in 3 Steps

### Step 1: Navigate to the Project
```bash
cd agentfleet-ai
```

### Step 2: Install Dependencies (if not already installed)
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```

**🎉 That's it!** Open your browser to: **http://localhost:5173/**

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production (output: `dist/` folder) |
| `npm run preview` | Preview production build locally |

---

## 🎯 What You'll See

When you open http://localhost:5173/, you'll experience:

1. **Hero Section** - Animated AI workforce introduction
2. **Problems** - Business pain points
3. **Solutions** - 6 specialized AI agents
4. **How It Works** - 4-step process
5. **Industries** - Industry-specific solutions
6. **Features** - Platform capabilities
7. **Metrics** - Animated success stats
8. **Pricing** - 3-tier pricing plans
9. **Testimonials** - Customer reviews
10. **CTA** - Call-to-action section
11. **Footer** - Navigation and links

---

## 🛠️ Making Changes

### Edit Components
All components are in `src/components/`

```bash
src/components/
├── Navbar.tsx
├── Hero.tsx
├── Problems.tsx
├── Solutions.tsx
├── HowItWorks.tsx
├── Industries.tsx
├── Features.tsx
├── Metrics.tsx
├── Pricing.tsx
├── Testimonials.tsx
├── CTA.tsx
└── Footer.tsx
```

### Edit Styles
- Global styles: `src/index.css`
- Tailwind config: `tailwind.config.js`

### Edit Content
Simply open any component file and modify the text, icons, or data arrays.

---

## 🎨 Customization Examples

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#4F46E5',    // Change this
  secondary: '#8B5CF6',  // And this
  accent: '#06B6D4',     // And this
}
```

### Add/Remove Sections
Edit `src/App.tsx`:
```typescript
<Hero />
<Problems />
{/* Add your new section here */}
<Solutions />
```

### Modify Pricing Plans
Edit `src/components/Pricing.tsx` - find the `plans` array

---

## 🚀 Deploy to Production

### Quick Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Build Locally
```bash
npm run build
```
Output will be in `dist/` folder

See `DEPLOYMENT.md` for more deployment options!

---

## 📚 Learn More

- **README.md** - Complete documentation
- **DEPLOYMENT.md** - Deployment guides
- **PROJECT_OVERVIEW.md** - Business model
- **SUMMARY.md** - Project summary

---

## 🆘 Troubleshooting

### Port 5173 already in use?
```bash
# Kill the process or use a different port
npm run dev -- --port 3000
```

### Styles not loading?
```bash
# Clear cache and restart
rm -rf node_modules dist
npm install
npm run dev
```

### Build errors?
```bash
# Ensure you're using Node.js 18+
node --version

# Reinstall dependencies
npm install
```

---

## 🎉 You're All Set!

Enjoy building with **AgentFleet AI**!

**Questions?** Check the documentation files or the code comments.

**Ready to deploy?** See `DEPLOYMENT.md`

---

**Built with ❤️ using React + TypeScript + Tailwind CSS + Framer Motion**
