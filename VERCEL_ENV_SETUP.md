# 🚀 Vercel Environment Variables Setup

## Required Environment Variables for Vercel

Go to your Vercel dashboard and add these environment variables:

### 1. Database
```
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require&channel_binding=require
```

### 2. AI/LLM
```
PERPLEXITY_API_KEY=your-perplexity-api-key
```

### 3. Session & Auth
```
SESSION_SECRET=zkastro-session-secret-change-in-production-12345678
PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
PRIVY_APP_SECRET=your-privy-app-secret
```

### 4. Blockchain
```
BASE_SEPOLIA_RPC=https://sepolia.base.org
AGENT_DEPLOYER_PRIVATE_KEY=your-private-key-here
GAS_SPONSOR_ADDRESS=your-wallet-address-here
CHART_REGISTRY_ADDRESS=0x9E62826B28d72739524a00975905C4e618926690
AGENT_REPUTATION_ADDRESS=0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7
```

### 5. Farcaster Contract
```
FARCASTER_CONTRACT_ADDRESS=0xfbcbb9088301cb94946ad415d7d862a583f6289d
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

### 6. Server
```
NODE_ENV=production
```

---

## 📝 Steps to Add Environment Variables in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project: **zk-astro**
3. Click **Settings** → **Environment Variables**
4. Add each variable above:
   - Name: `DATABASE_URL`
   - Value: (paste the value)
   - Environment: Select **Production**, **Preview**, and **Development**
5. Click **Save**
6. **Redeploy** your app for changes to take effect

---

## 🔄 How to Redeploy:

After adding environment variables:

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**

OR

Push a new commit to trigger automatic redeployment.

---

## ⚠️ Important Notes:

- **DATABASE_URL is CRITICAL** - without it, the API will fail with 500 errors
- All environment variables must be added to Vercel separately from your local `.env`
- Use **Production** environment for all variables
- After adding variables, you MUST redeploy

---

## ✅ Verify It's Working:

After redeployment, check:

1. Visit: https://zk-astro.vercel.app/api/farcaster/check-data
2. Should return JSON (not a 500 error)
3. Check Vercel logs for any errors

---

## 🔒 Security Note:

Never commit `.env` files to git! These are sensitive credentials.
Only add them through Vercel dashboard.


