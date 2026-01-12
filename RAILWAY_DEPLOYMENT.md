# 🚂 Railway Deployment Guide for Astrolabe

Complete step-by-step guide to deploy Astrolabe on Railway.

## 🎯 Quick Answer: Where to Get Railway URL

**To find your Railway URL for `VITE_API_URL`:**

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click your **project** → Click your **service** (the deployed app)
3. Click **"Settings"** tab (top navigation)
4. Scroll to **"Domains"** section
5. You'll see your URL: `https://your-app-name-production.up.railway.app`
6. **Copy this URL** - this is what you use for `VITE_API_URL`!

**If no domain is shown:**
- Click **"Generate Domain"** button in the Domains section
- Railway will create a URL for you automatically

---

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code pushed to GitHub
3. **Neon Database**: PostgreSQL database (free tier available)
4. **API Keys**: Perplexity/OpenAI, Privy, etc.

---

## 🚀 Step 1: Create New Project on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `AbhishekDubey013/ZKAstro`
5. Select branch: **`astrolabe`**

---

## ⚙️ Step 2: Configure Build Settings

Railway will auto-detect the project, but verify these settings:

### Build Command
```
npm install && npm run build
```

### Start Command
```
npm start
```

### Health Check Path
```
/api/charts
```

**Note**: Railway will use `railway.json` automatically if present.

---

## 🔐 Step 3: Add Environment Variables

Go to your Railway project → **Variables** tab → Add all these:

### **Required - Database**
```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
```
**Get from**: [Neon Console](https://console.neon.tech) → Your project → Connection string

### **Required - AI/LLM (Choose ONE)**
```bash
# Option 1: Perplexity (recommended for cost)
PERPLEXITY_API_KEY=pplx-your-key-here

# Option 2: OpenAI
OPENAI_API_KEY=sk-your-key-here

# Option 3: Generic LLM API
LLM_API_KEY=your-key-here
```

### **Required - Session & Auth**
```bash
SESSION_SECRET=your-random-secret-min-32-chars-change-this-in-production
PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
PRIVY_APP_SECRET=your-privy-app-secret
```

**Get Privy keys**: [Privy Dashboard](https://dashboard.privy.io)

### **Required - Blockchain (Arbitrum Sepolia)**
```bash
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
AGENT_DEPLOYER_PRIVATE_KEY=0x-your-private-key-without-0x-prefix
GAS_SPONSOR_ADDRESS=0x-your-wallet-address
CHART_REGISTRY_ADDRESS=0x61fabb1f3770274fb056b4b6c8088975dc641c97
AGENT_REPUTATION_ADDRESS=0x-your-reputation-contract-address
```

**Note**: Use a dedicated wallet with testnet ETH for `AGENT_DEPLOYER_PRIVATE_KEY`

### **Required - Agent Payment Wallets**
```bash
AURIGA_WALLET_ADDRESS=0x-auriga-agent-wallet-address
NOVA_WALLET_ADDRESS=0x-nova-agent-wallet-address
```

### **Required - Platform Wallet (Fallback)**
```bash
RECEIVER_ADDRESS=0x-platform-wallet-for-payments
# OR
PLATFORM_WALLET=0x-platform-wallet-for-payments
```

### **Required - Server Configuration**
```bash
NODE_ENV=production
PORT=5000
```

**Note**: Railway sets `PORT` automatically, but include it for safety.

### **Optional - CORS Origins**
```bash
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=https://www.astrolabes.xyz,https://astrolabes.xyz
```

**Note**: Railway and Vercel domains are auto-allowed. Only add this if using custom domains.

### **Optional - Admin**
```bash
ADMIN_KEY=your-secure-admin-key-for-agent-creation
```

### **Optional - Agent Factory (if using)**
```bash
AGENT_FACTORY_ADDRESS=0x-your-agent-factory-contract
```

---

## 🌐 Step 4: Get Your Railway URL

### **Finding Your Railway URL**

1. Go to your Railway project dashboard
2. Click on your **service** (the deployed app)
3. Look at the top of the page - you'll see:
   - **"Settings"** tab
   - **"Deployments"** tab
   - **"Metrics"** tab
   - **"Variables"** tab

4. Click on **"Settings"** tab
5. Scroll down to **"Domains"** section
6. You'll see one of these:

   **Option A: Auto-generated Railway domain**
   ```
   https://your-app-name-production.up.railway.app
   ```
   OR
   ```
   https://your-app-name.railway.app
   ```

   **Option B: Custom domain** (if you added one)
   ```
   https://www.astrolabes.xyz
   ```

### **Generate Railway Domain (If Not Visible)**

If you don't see a domain:

1. In **Settings** → **Domains** section
2. Click **"Generate Domain"** button
3. Railway will create: `https://your-app-name-production.up.railway.app`
4. **Copy this URL** - this is your `VITE_API_URL`!

### **Example Railway URLs**

Your Railway URL will look like one of these:
- `https://astrolabe-production-abc123.up.railway.app`
- `https://zkastro-production-xyz789.up.railway.app`
- `https://your-app-name.railway.app`

**This is the URL you'll use for `VITE_API_URL`!**

---

## 🌐 Step 5: Configure Custom Domain (Optional)

If you want to use `www.astrolabes.xyz` instead of Railway's domain:

1. Go to Railway project → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `www.astrolabes.xyz`
4. Follow DNS instructions

### DNS Configuration for GoDaddy

If using GoDaddy domain (`astrolabes.xyz`):

1. **Go to GoDaddy DNS Management**
2. **Add CNAME Record**:
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `your-app.railway.app` (from Railway)
   - **TTL**: 1 hour

3. **Add A Record** (for root domain):
   - **Type**: A
   - **Name**: `@`
   - **Value**: Railway's IP (get from Railway dashboard)
   - **TTL**: 1 hour

**OR** use Railway's domain directly: `your-app.railway.app`

---

## 🔧 Step 6: Update Frontend API URL

### **Where to Find Your Railway URL**

1. **Railway Dashboard** → Your Project → Your Service
2. **Settings** tab → Scroll to **"Domains"** section
3. **Copy the URL** shown (e.g., `https://astrolabe-production-abc123.up.railway.app`)

### **Set Frontend Environment Variable**

If deploying frontend separately (e.g., Vercel, GoDaddy), set:

**Option A: Using Railway's auto-generated domain**
```bash
VITE_API_URL=https://astrolabe-production-abc123.up.railway.app
```
*(Replace with YOUR actual Railway URL from Step 4)*

**Option B: Using custom domain**
```bash
VITE_API_URL=https://www.astrolabes.xyz
```

### **How to Set in Different Platforms**

**Vercel:**
1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add: `VITE_API_URL` = `https://your-railway-url.railway.app`
3. Redeploy

**GoDaddy (Static Hosting):**
1. Build locally with: `VITE_API_URL=https://your-railway-url.railway.app npm run build`
2. Upload `dist/` folder to GoDaddy

**Local Development:**
1. Create `.env` file in project root
2. Add: `VITE_API_URL=https://your-railway-url.railway.app`

---

## 📦 Step 7: Deploy

1. Railway will auto-deploy on push to `astrolabe` branch
2. Or manually trigger: **Settings** → **Deployments** → **Redeploy**
3. Watch logs: **Deployments** → Click deployment → **View Logs**

---

## ✅ Step 8: Verify Deployment

### Check Health Endpoint
```bash
curl https://your-app.railway.app/api/charts
```

Should return: `{"message": "Charts endpoint"}` or similar

### Check API Endpoints
```bash
# Agents stats
curl https://your-app.railway.app/api/agents/stats

# Should return JSON with agent data
```

---

## 🐛 Troubleshooting

### **404 on `/api/agents/stats`**

**Problem**: Frontend trying to reach API but getting 404

**Solution 1**: Update frontend `VITE_API_URL`:
```bash
# In your frontend build (Vercel/GoDaddy)
VITE_API_URL=https://your-app.railway.app
```

**Solution 2**: Check Railway logs for errors:
```bash
# Railway Dashboard → Deployments → View Logs
```

**Solution 3**: Verify CORS settings in `server/index.ts`:
- Add your domain to `allowedOrigins` array
- Or use environment variable for origins

### **Database Connection Error**

**Problem**: `DATABASE_URL must be set`

**Solution**: 
1. Check Railway Variables → `DATABASE_URL` is set
2. Verify Neon database is running
3. Check connection string format

### **Port Already in Use**

**Problem**: Railway can't bind to port

**Solution**: Railway sets `PORT` automatically. Don't override it.

### **Build Fails**

**Problem**: `npm run build` fails

**Solution**:
1. Check Railway logs for specific error
2. Verify all dependencies in `package.json`
3. Check Node.js version (should be 20+)

---

## 📊 Monitoring

### View Logs
- Railway Dashboard → **Deployments** → Click deployment → **View Logs**

### Metrics
- Railway Dashboard → **Metrics** tab
- CPU, Memory, Network usage

### Alerts
- Railway Dashboard → **Settings** → **Notifications**
- Set up email/Slack alerts for deployment failures

---

## 🔄 Continuous Deployment

Railway auto-deploys on:
- Push to `astrolabe` branch
- Manual redeploy from dashboard

To disable auto-deploy:
- **Settings** → **Deployments** → **Auto Deploy** → Toggle off

---

## 💰 Cost Estimate

**Railway Pricing** (as of 2024):
- **Hobby Plan**: $5/month (500 hours free)
- **Pro Plan**: $20/month (unlimited hours)

**Neon Database**:
- **Free Tier**: 0.5 GB storage, shared CPU
- **Launch Plan**: $19/month (10 GB, dedicated CPU)

**Total Estimated**: $5-25/month depending on usage

---

## 🔒 Security Checklist

- [ ] `SESSION_SECRET` is random and secure (32+ chars)
- [ ] `ADMIN_KEY` is strong and unique
- [ ] `AGENT_DEPLOYER_PRIVATE_KEY` is from dedicated wallet
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] API keys are not exposed in logs
- [ ] CORS origins are restricted to your domains
- [ ] Environment variables are set in Railway (not in code)

---

## 📝 Quick Reference

### Railway Dashboard URLs
- **Projects**: https://railway.app/dashboard
- **Your Project**: https://railway.app/project/{project-id}
- **Variables**: https://railway.app/project/{project-id}/variables
- **Deployments**: https://railway.app/project/{project-id}/deployments

### Important Files
- `railway.json` - Railway configuration
- `package.json` - Build/start scripts
- `server/index.ts` - Main server entry
- `.env` - Local development (NOT used in Railway)

---

## 🎉 Success!

Once deployed, your API will be available at:
- **Railway Domain**: `https://your-app.railway.app`
- **Custom Domain**: `https://www.astrolabes.xyz` (if configured)

Update your frontend to point to this URL!

