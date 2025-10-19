# 🔐 Environment Variables Guide

Complete list of all environment variables needed for ZKastro deployment.

---

## 📋 Quick Reference

### Backend Variables (Railway/Render)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# AI/LLM
PERPLEXITY_API_KEY=pplx-your-key-here

# Session & Auth
SESSION_SECRET=random-secret-min-32-chars

# Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
AGENT_DEPLOYER_PRIVATE_KEY=0xyour-private-key
GAS_SPONSOR_ADDRESS=0xyour-wallet-address
CHART_REGISTRY_ADDRESS=0x9E62826B28d72739524a00975905C4e618926690
AGENT_REPUTATION_ADDRESS=0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7

# Server
PORT=5000
NODE_ENV=production
ADMIN_KEY=random-admin-key
```

### Frontend Variables (Vercel)

```bash
# Authentication
VITE_PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw

# API
VITE_API_URL=https://your-backend.railway.app
```

---

## 📖 Detailed Variable Descriptions

### 1. DATABASE_URL
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: PostgreSQL database connection string  
**Get From**: [Neon Console](https://console.neon.tech)  
**Format**: `postgresql://user:password@host.neon.tech/database?sslmode=require`  
**Example**:
```
postgresql://your-neon-connection-string
```

---

### 2. PERPLEXITY_API_KEY
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: AI-powered prediction generation  
**Get From**: [Perplexity AI Settings](https://www.perplexity.ai/settings/api)  
**Format**: `pplx-xxxxx`  
**Example**: `your-perplexity-api-key-here`

---

### 3. VITE_PRIVY_APP_ID
**Where**: Frontend (Vercel)  
**Required**: ✅ Yes  
**Purpose**: User authentication  
**Get From**: [Privy Dashboard](https://dashboard.privy.io)  
**Format**: Alphanumeric string  
**Example**: `cmgb15wpa00g0la0duq9rzaqw`  
**Note**: Add your Vercel domain to Privy's allowed domains

---

### 4. SESSION_SECRET
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: Session encryption/signing  
**Generate**: Use random string generator  
**Format**: Minimum 32 characters  
**Example**: `zkastro-session-secret-change-in-production-12345678`  
**Security**: MUST be random and secret!

```bash
# Generate with Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 5. BASE_SEPOLIA_RPC
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: Connect to Base Sepolia blockchain  
**Default**: `https://sepolia.base.org`  
**Alternatives**:
- Alchemy: `https://base-sepolia.g.alchemy.com/v2/YOUR-KEY`
- Infura: `https://base-sepolia.infura.io/v3/YOUR-KEY`

---

### 6. AGENT_DEPLOYER_PRIVATE_KEY
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: Sign blockchain transactions  
**Get From**: Your MetaMask wallet  
**Format**: `0x` + 64 hex characters  
**Example**: `your-wallet-private-key-here`  
**Security**: ⚠️ **CRITICAL** - Never expose this! Never commit to git!

**How to Export from MetaMask**:
1. Open MetaMask
2. Click account menu → Account Details
3. Click "Export Private Key"
4. Enter password
5. Copy the key (starts with 0x)

---

### 7. GAS_SPONSOR_ADDRESS
**Where**: Backend  
**Required**: ✅ Yes (but can be same as deployer)  
**Purpose**: Address that pays gas fees  
**Get From**: Same wallet as AGENT_DEPLOYER_PRIVATE_KEY  
**Format**: `0x` + 40 hex characters  
**Example**: `0x2EDDFbD84A7D6c90CFd418d34228d5C077a83CF8`

---

### 8. CHART_REGISTRY_ADDRESS
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: ChartRegistry smart contract address  
**Current**: `0x9E62826B28d72739524a00975905C4e618926690`  
**Note**: Use this address (already deployed)  
**Verify**: [View on BaseScan](https://sepolia.basescan.org/address/0x9E62826B28d72739524a00975905C4e618926690)

---

### 9. AGENT_REPUTATION_ADDRESS
**Where**: Backend  
**Required**: ✅ Yes  
**Purpose**: AgentReputation smart contract address  
**Current**: `0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7`  
**Note**: Use this address (already deployed)  
**Verify**: [View on BaseScan](https://sepolia.basescan.org/address/0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7)

---

### 10. VITE_API_URL
**Where**: Frontend (Vercel)  
**Required**: ✅ Yes  
**Purpose**: Backend API endpoint  
**Get From**: Railway/Render deployment  
**Format**: `https://your-app.railway.app` (no trailing slash)  
**Example**: `https://zkastro-api.railway.app`  
**Note**: Get this AFTER deploying backend

---

### 11. PORT
**Where**: Backend  
**Required**: ⚠️ Optional (Railway/Render set automatically)  
**Purpose**: Server port  
**Default**: `5000`  
**Note**: Production hosts usually override this

---

### 12. NODE_ENV
**Where**: Backend  
**Required**: ⚠️ Optional  
**Purpose**: Environment mode  
**Values**: `development` | `production` | `staging`  
**Default**: `production` (set by hosting platform)

---

### 13. ADMIN_KEY
**Where**: Backend  
**Required**: ⚠️ Optional (for admin API routes)  
**Purpose**: Protect admin endpoints  
**Generate**: Random string  
**Example**: `zkastro-admin-key-change-in-production`  
**Used For**: `/api/admin/*` routes

```bash
# Generate:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

### 14. PAYMASTER_URL
**Where**: Backend  
**Required**: ❌ No  
**Purpose**: Gas sponsorship service  
**Default**: `https://paymaster.base.org`  
**Note**: Optional for gas abstraction

---

### 15. REPLIT_DOMAINS
**Where**: Backend  
**Required**: ❌ No (only if using Replit)  
**Purpose**: Enable Replit OIDC auth  
**Format**: `your-app.repl.co`  
**Note**: Only needed if deploying to Replit

---

## ✅ Deployment Checklist

### Before Backend Deployment (Railway/Render):

- [ ] `DATABASE_URL` - from Neon
- [ ] `PERPLEXITY_API_KEY` - from Perplexity
- [ ] `SESSION_SECRET` - generate random (32+ chars)
- [ ] `AGENT_DEPLOYER_PRIVATE_KEY` - from MetaMask
- [ ] `GAS_SPONSOR_ADDRESS` - from MetaMask
- [ ] `CHART_REGISTRY_ADDRESS` - use `0x9E62826B28d72739524a00975905C4e618926690`
- [ ] `AGENT_REPUTATION_ADDRESS` - use `0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7`
- [ ] `ADMIN_KEY` - generate random

### Before Frontend Deployment (Vercel):

- [ ] `VITE_PRIVY_APP_ID` - use `cmgb15wpa00g0la0duq9rzaqw`
- [ ] `VITE_API_URL` - get from Railway/Render after backend deploy
- [ ] Add Vercel domain to Privy dashboard

### After Deployment:

- [ ] Test chart creation
- [ ] Verify on-chain transactions
- [ ] Check BaseScan links work
- [ ] Test agent selection
- [ ] Monitor logs

---

## 🔒 Security Best Practices

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore:
   .env
   .env.local
   .env.production
   .env.*.local
   ```

2. **Use Different Keys for Each Environment**
   - Dev: Use test keys
   - Staging: Use separate keys
   - Production: Use production keys

3. **Rotate Secrets Regularly**
   - Change `SESSION_SECRET` monthly
   - Rotate API keys quarterly
   - Monitor for suspicious activity

4. **Restrict Access**
   - Limit who has access to production keys
   - Use secret management tools
   - Enable 2FA on all accounts

5. **Monitor Usage**
   - Track API calls
   - Monitor blockchain transactions
   - Set up alerts for unusual activity

---

## 📝 Environment Variable Template

### For Railway (Backend):

```bash
DATABASE_URL=
PERPLEXITY_API_KEY=
SESSION_SECRET=
BASE_SEPOLIA_RPC=https://sepolia.base.org
AGENT_DEPLOYER_PRIVATE_KEY=
GAS_SPONSOR_ADDRESS=
CHART_REGISTRY_ADDRESS=0x9E62826B28d72739524a00975905C4e618926690
AGENT_REPUTATION_ADDRESS=0xb4fa5aC142ecA14bEBB99B94c104F36bA2AE32B7
ADMIN_KEY=
NODE_ENV=production
```

### For Vercel (Frontend):

```bash
VITE_PRIVY_APP_ID=cmgb15wpa00g0la0duq9rzaqw
VITE_API_URL=
```

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Check IP whitelist in Neon

### "Unauthorized" errors
- Verify `SESSION_SECRET` is set
- Check `ADMIN_KEY` if using admin routes
- Verify Privy app ID

### "Transaction failed"
- Check wallet has Base Sepolia ETH
- Verify `AGENT_DEPLOYER_PRIVATE_KEY`
- Check RPC URL is working

### "Module not found"
- Verify all dependencies in `package.json`
- Check build command
- Review deployment logs

---

## 📞 Getting API Keys

1. **Neon (Database)**
   - Sign up: https://console.neon.tech
   - Create project
   - Copy connection string

2. **Perplexity AI**
   - Sign up: https://www.perplexity.ai
   - Go to Settings → API
   - Generate key

3. **Privy (Auth)**
   - Using existing: `cmgb15wpa00g0la0duq9rzaqw`
   - Or create new: https://dashboard.privy.io

4. **Base Sepolia ETH (Test)**
   - Faucet: https://www.alchemy.com/faucets/base-sepolia
   - Alternative: https://faucet.quicknode.com/base/sepolia

---

**All set! Use this guide when deploying to production.** 🚀

