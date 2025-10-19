# 🚀 Production Deployment Guide

Complete guide for deploying ZKastro to production.

---

## 📋 Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Vercel        │────────▶│   Railway/Render │────────▶│  Neon Postgres  │
│   (Frontend)    │         │   (Backend API)  │         │   (Database)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Base Sepolia    │
                            │  (Blockchain)    │
                            └──────────────────┘
```

---

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)
- ✅ **Recommended for hackathon**
- ✅ Free tier available
- ✅ Easy setup
- ✅ Auto-deploy from GitHub

### Option 2: Vercel (Frontend) + Render (Backend)
- ✅ Alternative backend option
- ✅ Free tier (with sleep)
- ✅ Good for demos

### Option 3: Full Stack on Replit
- ✅ Simplest deployment
- ✅ One-click deploy
- ✅ Good for quick demos

---

## 📦 Part 1: Backend Deployment (Railway)

### Step 1: Prepare Backend

```bash
# Create Railway-specific files
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create Procfile (alternative)
echo "web: npm start" > Procfile
```

### Step 2: Deploy to Railway

1. **Sign up**: https://railway.app (use GitHub)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Select branch (main/master)

3. **Configure Build**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `/` (or leave empty)

4. **Add Environment Variables** (see section below)

5. **Deploy**: Railway will auto-build and deploy

6. **Get URL**: Copy your backend URL (e.g., `https://your-app.railway.app`)

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Update API URL

```bash
# Update vercel.json with your Railway backend URL
# Replace "https://your-backend-url.railway.app" with actual URL
```

### Step 2: Deploy to Vercel

1. **Sign up**: https://vercel.com (use GitHub)

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select branch (main/master)

3. **Configure Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist/client`
   - Install Command: `npm install`

4. **Environment Variables** (see section below)

5. **Deploy**: Vercel will auto-deploy

6. **Custom Domain** (optional): Add your domain in project settings

---

## 🔐 Environment Variables

### Backend Environment Variables (Railway/Render)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Perplexity AI
PERPLEXITY_API_KEY=pplx-your-key-here

# Session & Auth
SESSION_SECRET=random-secret-min-32-chars
PORT=5000

# Base Sepolia Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
AGENT_DEPLOYER_PRIVATE_KEY=0xyour-private-key-here
GAS_SPONSOR_ADDRESS=0xyour-wallet-address-here
PAYMASTER_URL=https://paymaster.base.org
ADMIN_KEY=random-admin-key-here

# Smart Contract Addresses
CHART_REGISTRY_ADDRESS=0x9E62826B28d72739524a00975905C4e618926690
AGENT_REPUTATION_ADDRESS=0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7

# Optional: Replit Auth (if using Replit)
REPLIT_DOMAINS=your-repl.repl.co
```

### Frontend Environment Variables (Vercel)

```bash
# Privy Authentication
VITE_PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw

# Backend API URL (from Railway)
VITE_API_URL=https://your-backend.railway.app

# Optional: Analytics
VITE_GA_ID=G-XXXXXXXXXX
```

---

## 📝 Complete Environment Variable List

### Required Variables

| Variable | Where | Purpose | Example |
|----------|-------|---------|---------|
| `DATABASE_URL` | Backend | PostgreSQL connection | `postgresql://...` |
| `PERPLEXITY_API_KEY` | Backend | AI predictions | `pplx-...` |
| `SESSION_SECRET` | Backend | Session encryption | Random 32+ chars |
| `BASE_SEPOLIA_RPC` | Backend | Blockchain RPC | `https://sepolia.base.org` |
| `AGENT_DEPLOYER_PRIVATE_KEY` | Backend | Deployer wallet | `0x...` |
| `CHART_REGISTRY_ADDRESS` | Backend | ChartRegistry contract | `0x9E62...` |
| `AGENT_REPUTATION_ADDRESS` | Backend | AgentReputation contract | `0xb4fa...` |
| `VITE_PRIVY_APP_ID` | Frontend | Auth provider | `cmgb15...` |
| `VITE_API_URL` | Frontend | Backend API URL | `https://...` |

### Optional Variables

| Variable | Where | Purpose | Default |
|----------|-------|---------|---------|
| `PORT` | Backend | Server port | `5000` |
| `ADMIN_KEY` | Backend | Admin API auth | Random string |
| `GAS_SPONSOR_ADDRESS` | Backend | Gas payer wallet | Deployer address |
| `PAYMASTER_URL` | Backend | Gas paymaster | `https://paymaster.base.org` |
| `REPLIT_DOMAINS` | Backend | Replit auth | Only if using Replit |

---

## 🔒 Security Checklist

### Before Deployment:

- [ ] Change `SESSION_SECRET` to random 32+ character string
- [ ] Change `ADMIN_KEY` to random string
- [ ] Never commit `.env` file to git
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Review CORS settings in backend
- [ ] Set up rate limiting (if needed)
- [ ] Add monitoring/logging

### Production `.gitignore`:

```
.env
.env.local
.env.production
node_modules/
dist/
*.log
```

---

## 🧪 Testing Deployment

### 1. Test Backend

```bash
# Check health
curl https://your-backend.railway.app/api/charts

# Should return JSON (or 401 if auth required)
```

### 2. Test Frontend

1. Open: `https://your-app.vercel.app`
2. Login with Privy
3. Create chart (watch for toasts)
4. Make prediction
5. Select agent
6. Verify on-chain links work

### 3. Test On-Chain

1. Create chart
2. Click BaseScan link in toast
3. Verify transaction exists
4. Check contract interactions

---

## 🚨 Troubleshooting

### Backend Issues

**Error: "Connection refused"**
- Check Railway logs
- Verify environment variables
- Check database connection

**Error: "Module not found"**
- Check `package.json` dependencies
- Verify build command
- Check Node version

**Error: "Port already in use"**
- Railway handles ports automatically
- Don't hardcode PORT in code

### Frontend Issues

**Error: "Failed to fetch"**
- Check `VITE_API_URL` in Vercel
- Verify backend is running
- Check CORS settings

**Error: "Privy auth failed"**
- Verify `VITE_PRIVY_APP_ID`
- Add Vercel domain to Privy dashboard
- Check redirect URLs

**Blank page**
- Hard refresh (Cmd+Shift+R)
- Check browser console
- Verify build output directory

---

## 📊 Monitoring & Logs

### Railway Logs

```bash
# View live logs in Railway dashboard
# Or use CLI:
railway logs
```

### Vercel Logs

```bash
# View in Vercel dashboard
# Or use CLI:
vercel logs
```

### Database Monitoring

```bash
# Neon dashboard: https://console.neon.tech
# Monitor:
# - Connection count
# - Query performance
# - Storage usage
```

---

## 🎉 Post-Deployment

### Update Documentation

1. Update README with live URLs
2. Document API endpoints
3. Add demo credentials (if applicable)

### Share Links

```
Frontend: https://zkastro.vercel.app
Backend API: https://zkastro-api.railway.app
ChartRegistry: https://sepolia.basescan.org/address/0x9E62...
AgentReputation: https://sepolia.basescan.org/address/0xb4fa...
```

### Monitor

- Set up uptime monitoring (UptimeRobot, Better Uptime)
- Enable error tracking (Sentry)
- Monitor API usage
- Check gas usage on Base Sepolia

---

## 💡 Tips for Hackathon Demo

1. **Test before demo**: Create fresh chart 1 hour before
2. **Have backup**: Keep local server ready
3. **Screenshot toasts**: Capture on-chain notifications
4. **Prepare BaseScan tabs**: Pre-open contract pages
5. **Check mobile**: Test on phone
6. **Clear cache**: Hard refresh before demo
7. **Have fallback**: If live fails, show video

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Neon Console: https://console.neon.tech
- Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia
- BaseScan: https://sepolia.basescan.org
- Privy Dashboard: https://dashboard.privy.io

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check `railway logs` or `vercel logs`
- Review environment variables
- Test locally first: `npm run dev`

---

**Good luck with your hackathon! 🚀**

