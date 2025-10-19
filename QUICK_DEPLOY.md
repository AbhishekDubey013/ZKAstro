# 🚀 Quick Deployment Guide

Get ZKastro live in 15 minutes!

---

## ⚡ Fast Track: Deploy Now

### Step 1: Deploy Backend (5 min)

**Option A: Railway** (Recommended)

1. Go to: https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add environment variables (copy from below)
5. Deploy!
6. Copy your Railway URL: `https://your-app.railway.app`

**Option B: Render**

1. Go to: https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repo
4. Use `render.yaml` configuration
5. Add secrets in dashboard
6. Deploy!

### Step 2: Deploy Frontend (3 min)

**Vercel** (Recommended)

1. Go to: https://vercel.com
2. Import your GitHub repository
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist/client`
6. Add these environment variables:
   ```
   VITE_PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
   VITE_API_URL=<your-railway-url-from-step-1>
   ```
7. Deploy!

### Step 3: Update Backend URL (1 min)

1. Edit `vercel.json` line 8
2. Replace `https://your-backend-url.railway.app` with actual URL
3. Commit and push (auto-redeploys)

---

## 📋 Required Environment Variables

### Backend (Railway/Render)

```bash
DATABASE_URL=postgresql://your-neon-connection-string

PERPLEXITY_API_KEY=your-perplexity-api-key-here

SESSION_SECRET=zkastro-session-production-secret-min-32-chars-change-this

AGENT_DEPLOYER_PRIVATE_KEY=your-wallet-private-key-here

GAS_SPONSOR_ADDRESS=0x2EDDFbD84A7D6c90CFd418d34228d5C077a83CF8

CHART_REGISTRY_ADDRESS=0x9E62826B28d72739524a00975905C4e618926690

AGENT_REPUTATION_ADDRESS=0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7

BASE_SEPOLIA_RPC=https://sepolia.base.org

ADMIN_KEY=zkastro-admin-production-key-change-this

NODE_ENV=production
```

### Frontend (Vercel)

```bash
VITE_PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
VITE_API_URL=https://your-railway-app.railway.app
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: Visit `https://your-backend/api/charts`
- [ ] Frontend loads: Visit your Vercel URL
- [ ] Login works (Privy)
- [ ] Create test chart
- [ ] Check toast notifications
- [ ] Verify BaseScan links
- [ ] Test agent selection
- [ ] Check on-chain transactions

---

## 🎯 Your Live URLs

Once deployed, you'll have:

```
Frontend:  https://zkastro.vercel.app
Backend:   https://zkastro.railway.app
ChartReg:  https://sepolia.basescan.org/address/0x9E62826B28d72739524a00975905C4e618926690
AgentRep:  https://sepolia.basescan.org/address/0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7
```

---

## 🆘 Quick Fixes

**Backend not starting?**
- Check Railway/Render logs
- Verify all environment variables are set
- Check DATABASE_URL is correct

**Frontend 404?**
- Hard refresh (Cmd+Shift+R)
- Check build output directory is `dist/client`
- Verify vercel.json is committed

**API calls failing?**
- Update VITE_API_URL in Vercel
- Check backend is running
- Verify CORS settings

**Privy auth failing?**
- Add Vercel domain to Privy dashboard
- Check VITE_PRIVY_APP_ID is correct

---

## 📞 Support

- Full docs: See `DEPLOYMENT.md`
- Environment variables: See `ENV_VARIABLES.md`
- Issues? Check logs in dashboard

---

**That's it! Your app should be live! 🎉**
