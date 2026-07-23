# Deployment Guide - AgentFleet AI

This guide will help you deploy the AgentFleet AI application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- Git installed
- All dependencies installed (`npm install`)
- Production build tested locally (`npm run build && npm run preview`)

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Deployment Options

### 1. Vercel (Recommended)

**Quick Deploy:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Or via Git:**
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite settings
6. Click "Deploy"

### 2. Netlify

**Via Netlify CLI:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

**Or via Git:**
1. Push to GitHub/GitLab/Bitbucket
2. Visit [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

### 3. GitHub Pages

```bash
# Install gh-pages
npm install -g gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

**Configure vite.config.ts:**
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

### 4. AWS S3 + CloudFront

```bash
# Build the project
npm run build

# Install AWS CLI
# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://agentfleet-ai

# Upload files
aws s3 sync dist/ s3://agentfleet-ai --delete

# Configure bucket for static website hosting
aws s3 website s3://agentfleet-ai --index-document index.html

# Set up CloudFront for CDN (recommended)
```

### 5. Cloudflare Pages

1. Push code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
3. Navigate to Pages
4. Click "Create a project"
5. Connect to GitHub
6. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
7. Click "Save and Deploy"

### 6. Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t agentfleet-ai .
docker run -p 80:80 agentfleet-ai
```

## Environment Variables

If you add environment variables in the future:

1. Create `.env.production` file
2. Prefix variables with `VITE_`
3. Example: `VITE_API_URL=https://api.agentfleet.ai`
4. Access in code: `import.meta.env.VITE_API_URL`

## Performance Optimization

The build is already optimized with:
- ✅ Code splitting
- ✅ Minification
- ✅ Tree shaking
- ✅ Asset optimization

**Additional optimizations:**
- Enable GZIP/Brotli compression on your server
- Set up CDN for static assets
- Configure caching headers
- Use lazy loading for routes (if adding routing)

## Post-Deployment Checklist

- [ ] Test on multiple devices
- [ ] Verify all animations work
- [ ] Check mobile responsiveness
- [ ] Test all navigation links
- [ ] Verify SEO meta tags
- [ ] Test page load speed
- [ ] Check browser console for errors
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Configure custom domain
- [ ] Set up SSL certificate

## Troubleshooting

**Build fails:**
- Clear `node_modules` and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version is 18+

**Blank page after deployment:**
- Check browser console for errors
- Verify base path in `vite.config.ts`
- Ensure all assets are properly referenced

**Styles not loading:**
- Verify Tailwind CSS is properly configured
- Check that `index.css` is imported in `main.tsx`
- Clear browser cache

## Support

For deployment issues, check:
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- Platform-specific documentation

---

Good luck with your deployment! 🚀
