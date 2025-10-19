# 🚀 Railway + Vercel Deployment - Step by Step

Follow these exact steps to deploy in 15 minutes!

---

## STEP 1: Deploy Backend to Railway (7 minutes)

### 1.1 Sign Up / Login to Railway

1. Go to: **https://railway.app**
2. Click "Login" (use GitHub - easiest)
3. Authorize Railway to access your GitHub

### 1.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: **AIInterviewCoach**
4. Click **"Deploy Now"**

Railway will start building immediately (this is OK, we'll add env vars next)

### 1.3 Add Environment Variables

1. In Railway dashboard, click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these ONE BY ONE:

```bash
DATABASE_URL
<your-neon-database-url>

PERPLEXITY_API_KEY
<your-perplexity-api-key>

SESSION_SECRET
<generate-random-32-char-string>

AGENT_DEPLOYER_PRIVATE_KEY
<your-wallet-private-key>

GAS_SPONSOR_ADDRESS
<your-gas-sponsor-address>

CHART_REGISTRY_ADDRESS
0x9E62826B28d72739524a00975905C4e618926690

AGENT_REPUTATION_ADDRESS
0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7

BASE_SEPOLIA_RPC
https://sepolia.base.org

ADMIN_KEY
<generate-random-admin-key>

NODE_ENV
production
```

5. Click **"Deploy"** or wait for auto-redeploy

### 1.4 Get Your Backend URL

1. Go to **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (example: `https://zkastro-production.up.railway.app`)

**⚠️ IMPORTANT: Save this URL! You'll need it for Vercel!**

### 1.5 Test Backend

Open in browser: `https://your-railway-url.railway.app/api/charts`

You should see:
- JSON response (empty array `[]` is OK)
- OR 401 error (this is OK - means server is running)

If you see `Cannot GET /`, that means it's working! API is at `/api/*`

✅ Backend deployed!

---

## STEP 2: Deploy Frontend to Vercel (5 minutes)

### 2.1 Sign Up / Login to Vercel

1. Go to: **https://vercel.com**
2. Click "Sign Up" or "Login"
3. Use **GitHub** (easiest)
4. Authorize Vercel

### 2.2 Import Project

1. Click **"Add New"** → **"Project"**
2. Find your GitHub repository: **AIInterviewCoach**
3. Click **"Import"**

### 2.3 Configure Build Settings

On the "Configure Project" screen:

**Framework Preset**: Select **"Vite"**

**Root Directory**: Leave as `.` (default)

**Build Command**: 
```
npm run build
```

**Output Directory**: 
```
dist/client
```

**Install Command**: 
```
npm install
```

### 2.4 Add Environment Variables

Still on the "Configure Project" screen, scroll to **"Environment Variables"**:

Click **"Add"** and enter:

**Variable 1:**
```
Name:  VITE_PRIVY_APP_ID
Value: cmgb15wpa00g0la0duq9rzaqw
```

**Variable 2:**
```
Name:  VITE_API_URL
Value: [YOUR-RAILWAY-URL-FROM-STEP-1.4]
```

Example: `https://zkastro-production.up.railway.app`

**⚠️ NO TRAILING SLASH!**

### 2.5 Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Vercel will show "Congratulations!"

### 2.6 Get Your Frontend URL

1. Click **"Visit"** or copy the URL
2. Example: `https://aiinterviewcoach.vercel.app`

✅ Frontend deployed!

---

## STEP 3: Update vercel.json (1 minute)

### 3.1 Edit vercel.json locally

Open `vercel.json` and find line 8:

```json
"destination": "https://your-backend-url.railway.app/api/:path*"
```

Replace with YOUR Railway URL:

```json
"destination": "https://zkastro-production.up.railway.app/api/:path*"
```

### 3.2 Commit and Push

```bash
git add vercel.json
git commit -m "Update backend URL for production"
git push
```

Vercel will auto-redeploy in ~30 seconds!

✅ Configuration updated!

---

## STEP 4: Test Everything (3 minutes)

### 4.1 Open Your Vercel URL

Go to: `https://your-app.vercel.app`

### 4.2 Test Authentication

1. Click "Login" or "Get Started"
2. Should see Privy login popup
3. Login with email or wallet

### 4.3 Test Chart Creation

1. Fill in birth details:
   - Date: Any date
   - Time: Any time
   - Location: Click "Auto-Detect" or enter manually

2. Click **"Generate My Chart"**

3. Watch for toast notifications (bottom-right):
   - 🔒 Calculating positions locally...
   - 🔐 Generating Zero-Knowledge proof...
   - ✅ ZK Proof Generated!
   - �� Sending to server...
   - ✅ Server Verified ZK Proof!
   - ⛓️ Recorded on Base Sepolia! ← Click the BaseScan link!
   - 🎉 Chart Created Successfully!

4. Click the **BaseScan link** in the toast
5. Verify transaction on blockchain

### 4.4 Test Predictions

1. Click **"Know Your Day"**
2. Wait for agent predictions (~10 seconds)
3. Select one prediction
4. Watch for toasts:
   - ✅ Prediction Selected!
   - ⛓️ Recorded on Base Sepolia! ← Click the link!

5. Click BaseScan link to verify reputation update

✅ Everything working!

---

## STEP 5: Add Custom Domain (Optional)

### On Vercel:

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for verification (~1 hour)

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Railway backend deployed
- [ ] Environment variables added to Railway
- [ ] Backend URL tested (`/api/charts`)
- [ ] Vercel frontend deployed
- [ ] Environment variables added to Vercel
- [ ] vercel.json updated with Railway URL
- [ ] Changes pushed to GitHub
- [ ] Login works (Privy)
- [ ] Chart creation works
- [ ] Toast notifications appear
- [ ] BaseScan links work
- [ ] On-chain transactions verified
- [ ] Agent selection works
- [ ] Reputation updates on-chain

---

## 🆘 TROUBLESHOOTING

### Railway Issues

**Build failing?**
```bash
# Check Railway logs:
# Click "Deployments" → Latest deployment → "View Logs"

# Common fixes:
# - Verify all env vars are set
# - Check DATABASE_URL is correct
# - Ensure Node version is 18+
```

**Server not responding?**
```bash
# Check if service is running:
# Railway Dashboard → Your service → Should show "Active"

# Check logs for errors
# Verify PORT is not hardcoded (Railway sets it)
```

### Vercel Issues

**Build failing?**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
# - Verify Framework is set to "Vite"
# - Check Output Directory is "dist/client"
# - Ensure VITE_ env vars are set
```

**Blank page after deploy?**
```bash
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Check browser console for errors
# Verify VITE_API_URL is correct (no trailing slash)
```

**API calls failing?**
```bash
# Check VITE_API_URL in Vercel environment variables
# Verify Railway backend is running
# Check CORS settings (should be OK by default)
```

**Privy auth not working?**
```bash
# Go to https://dashboard.privy.io
# Add your Vercel domain to allowed domains:
#   Settings → App URLs → Add: https://your-app.vercel.app
```

---

## 📊 YOUR LIVE URLS

After deployment, you'll have:

```
Frontend:       https://your-app.vercel.app
Backend:        https://your-app.railway.app
ChartRegistry:  https://sepolia.basescan.org/address/0x9E62826B28d72739524a00975905C4e618926690
AgentReputation: https://sepolia.basescan.org/address/0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7
```

---

## 🎉 SUCCESS!

Your ZKastro app is now live on the internet!

### Share Your Links:

```
Demo: https://your-app.vercel.app
GitHub: https://github.com/your-username/AIInterviewCoach
Contracts: https://sepolia.basescan.org/address/0x9E62...
```

### For Hackathon Judges:

1. Share your Vercel URL
2. Create a demo video
3. Document the on-chain features
4. Highlight ZK privacy
5. Show BaseScan verification

---

**Congratulations! You're deployed! 🚀**

