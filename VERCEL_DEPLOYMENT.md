# Vercel Deployment Guide - Farcaster Mini App with Privy

## 🚀 Prerequisites

1. ✅ Vercel account (https://vercel.com)
2. ✅ Privy account (https://privy.io)
3. ✅ GitHub repository (optional but recommended)
4. ✅ Neon PostgreSQL database
5. ✅ Perplexity API key
6. ✅ Arbitrum Sepolia RPC URL

---

## 📋 Step 1: Get Privy App Secret

1. Go to https://dashboard.privy.io
2. Select your app (or create one)
3. Go to **Settings** → **Basics**
4. Copy your **App ID** (you already have: `cmgb15wpa00g0la0duq9rzaqw`)
5. Go to **Settings** → **API Keys**
6. Create a new **Server API Key** or copy existing one
7. Save this as `PRIVY_APP_SECRET`

**Important:** Enable Farcaster login in Privy dashboard:
- Go to **Settings** → **Login Methods**
- Enable **Farcaster**
- Save changes

---

## 📋 Step 2: Prepare Environment Variables

You'll need these environment variables for Vercel:

```bash
# Database
DATABASE_URL=your_neon_postgres_url

# Privy Authentication
PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
PRIVY_APP_SECRET=your_privy_app_secret_here

# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key

# Arbitrum Stylus
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
AGENT_DEPLOYER_PRIVATE_KEY=your_private_key_here
FARCASTER_CONTRACT_ADDRESS=0xfbcbb9088301cb94946ad415d7d862a583f6289d

# Node Environment
NODE_ENV=production
```

---

## 📋 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set up project name
# - Override settings? No (we have vercel.json)

# Add environment variables
vercel env add DATABASE_URL
vercel env add PRIVY_APP_ID
vercel env add PRIVY_APP_SECRET
vercel env add PERPLEXITY_API_KEY
vercel env add ARBITRUM_SEPOLIA_RPC
vercel env add AGENT_DEPLOYER_PRIVATE_KEY
vercel env add FARCASTER_CONTRACT_ADDRESS
vercel env add NODE_ENV

# Deploy to production
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`
4. Add environment variables (see Step 2)
5. Click **Deploy**

---

## 📋 Step 4: Configure Privy for Production

1. Go to https://dashboard.privy.io
2. Select your app
3. Go to **Settings** → **Domains**
4. Add your Vercel domain:
   - `your-app-name.vercel.app`
   - Or your custom domain
5. Save changes

**Important:** Privy needs to whitelist your domain for authentication to work!

---

## 📋 Step 5: Test Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app/farcaster-miniapp`
2. Click **Sign in with Wallet**
3. Connect wallet or Farcaster account
4. Enter birth details
5. Get daily prediction
6. Test chat feature

---

## 🔧 Troubleshooting

### Issue: "Failed to verify Privy token"

**Solution:**
- Check `PRIVY_APP_SECRET` is set correctly in Vercel
- Verify domain is whitelisted in Privy dashboard
- Check browser console for errors

### Issue: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` is set in Vercel
- Check Neon database is accessible
- Run migrations if needed

### Issue: "CORS errors"

**Solution:**
- Check `vercel.json` has correct CORS headers
- Verify API routes are accessible
- Check browser console for specific errors

### Issue: "Privy login modal doesn't open"

**Solution:**
- Check Privy App ID is correct
- Verify Farcaster is enabled in Privy dashboard
- Check browser console for Privy SDK errors

---

## 📊 Monitoring

### Vercel Dashboard

- **Deployments:** See all deployments and logs
- **Analytics:** Track page views and performance
- **Logs:** View serverless function logs

### Privy Dashboard

- **Users:** See authenticated users
- **Analytics:** Track login methods
- **Logs:** View authentication events

---

## 🔐 Security Checklist

- ✅ `PRIVY_APP_SECRET` is set as environment variable (not in code)
- ✅ `AGENT_DEPLOYER_PRIVATE_KEY` is set as environment variable
- ✅ Database URL uses SSL
- ✅ CORS is configured properly
- ✅ Privy domain is whitelisted
- ✅ Rate limiting is enabled (if needed)

---

## 🚀 Custom Domain (Optional)

1. Go to Vercel project settings
2. Click **Domains**
3. Add your custom domain
4. Configure DNS records as shown
5. Update Privy dashboard with new domain
6. Wait for DNS propagation

---

## 📱 Farcaster Integration

### To use as Farcaster Mini App:

1. Deploy to Vercel (get URL)
2. Share URL in Farcaster:
   ```
   Check out my astrology mini app!
   https://your-app-name.vercel.app/farcaster-miniapp
   ```
3. Users click link → Opens in Farcaster browser
4. Users sign in with Privy (wallet or Farcaster)
5. Users get personalized predictions!

### To create Farcaster Frame (optional):

If you also want to create Frame posts:
1. Use `@farcaster/frame-sdk` for Frame posts
2. Keep Privy for mini app authentication
3. Frame posts can link to mini app

---

## 🎯 Post-Deployment Checklist

- ✅ App loads at Vercel URL
- ✅ Privy login works
- ✅ Birth data can be saved
- ✅ Predictions are generated
- ✅ Chat feature works
- ✅ Rating system works
- ✅ On-chain transactions work (if enabled)
- ✅ Mobile responsive
- ✅ Works in Farcaster browser

---

## 📚 Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables
vercel env pull

# Redeploy
vercel --prod

# Remove deployment
vercel rm your-deployment-url
```

---

## 🆘 Support

- **Vercel Docs:** https://vercel.com/docs
- **Privy Docs:** https://docs.privy.io
- **Farcaster Docs:** https://docs.farcaster.xyz

---

## ✅ Summary

Your Farcaster Mini App is now:

- ✅ Deployed on Vercel
- ✅ Using Privy for authentication
- ✅ Supporting wallet + Farcaster login
- ✅ Fully serverless
- ✅ Production-ready
- ✅ Scalable

**Next Steps:**
1. Share your mini app URL in Farcaster
2. Get users to try it
3. Monitor analytics
4. Iterate based on feedback

🎉 **Congratulations! Your mini app is live!** 🎉

