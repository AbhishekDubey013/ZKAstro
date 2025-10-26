# Farcaster Authentication Issue & Solution

## 🚨 Current Problem

**Your Farcaster miniapp is NOT using real wallet authentication!**

### What's Happening Now:

```typescript
// In farcaster-routes.ts line 46 & 62:
const userId = req.session?.userId || "demo-user"; // ❌ HARDCODED!
```

**Everyone is using the SAME user ID: `"demo-user"`**

This means:
- ❌ All users see the same birth data
- ❌ All users see the same predictions
- ❌ No real user separation
- ❌ No wallet authentication
- ❌ No privacy

---

## 🔍 How It SHOULD Work

### Farcaster Frame Authentication Flow:

```
1. User opens Farcaster miniapp
   ↓
2. Farcaster sends user's FID (Farcaster ID) in frame message
   ↓
3. Backend verifies frame signature
   ↓
4. Extract user's wallet address or FID
   ↓
5. Use wallet address as userId in database
   ↓
6. Each user has their own data
```

---

## 📊 Database Mapping

### Current Schema (Correct):

```typescript
export const farcasterUsers = zkastroSchema.table("farcaster_users", {
  id: varchar("id").primaryKey(),
  userId: text("user_id").unique().notNull(), // ✅ This should be wallet address
  dob: text("dob").notNull(),
  tob: text("tob").notNull(),
  location: text("location").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### How Data SHOULD Be Mapped:

```
userId (wallet address) → Birth Data
─────────────────────────────────────
0x1234...abcd → { dob: "1990-01-01", tob: "10:30", ... }
0x5678...efgh → { dob: "1985-05-15", tob: "14:20", ... }
0x9abc...ijkl → { dob: "1992-08-20", tob: "09:00", ... }
```

Currently ALL users map to:
```
"demo-user" → { dob: "...", tob: "...", ... } ❌ EVERYONE SHARES THIS!
```

---

## 🔧 Solution: Implement Farcaster Frame Auth

### Step 1: Install Farcaster Frame SDK

```bash
npm install @farcaster/frame-sdk
npm install @farcaster/frame-host
```

### Step 2: Update Frontend (farcaster-miniapp.tsx)

```typescript
import { FrameSDK } from '@farcaster/frame-sdk';

// Initialize Frame SDK
const frameSDK = new FrameSDK();

// Get user's Farcaster ID and wallet
const context = await frameSDK.context;
const userFid = context.user?.fid; // Farcaster ID
const userAddress = context.user?.verifiedAddresses?.[0]; // Wallet address

// Send to backend
const response = await fetch("/api/farcaster/save-birth-data", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "X-Farcaster-FID": userFid.toString(),
    "X-Wallet-Address": userAddress
  },
  body: JSON.stringify(birthData)
});
```

### Step 3: Update Backend (farcaster-routes.ts)

```typescript
// Add middleware to extract user from Farcaster frame
function getFarcasterUser(req: Request): string {
  // Try to get wallet address from header
  const walletAddress = req.headers['x-wallet-address'];
  if (walletAddress && typeof walletAddress === 'string') {
    return walletAddress.toLowerCase();
  }
  
  // Try to get FID from header
  const fid = req.headers['x-farcaster-fid'];
  if (fid && typeof fid === 'string') {
    return `fid:${fid}`;
  }
  
  // Fallback for testing (but log warning)
  console.warn('⚠️  No Farcaster user found, using demo-user');
  return "demo-user";
}

// Update all routes:
router.get("/check-data", async (req: Request, res: Response) => {
  try {
    const userId = getFarcasterUser(req); // ✅ Use real user
    
    const user = await db.query.farcasterUsers.findFirst({
      where: eq(farcasterUsers.userId, userId)
    });

    res.json({ hasData: !!user });
  } catch (error) {
    console.error("Error checking user data:", error);
    res.status(500).json({ error: "Failed to check user data" });
  }
});
```

### Step 4: Update On-Chain Registration

```typescript
// In save-birth-data route:
const userId = getFarcasterUser(req); // Get real wallet address

// Use the USER'S wallet address for on-chain registration
// NOT the deployer's wallet!
const userWalletAddress = userId.startsWith('0x') 
  ? userId 
  : ethers.Wallet.createRandom().address; // Fallback

const commitmentBytes = ethers.zeroPadValue(
  ethers.toBeHex(BigInt(`0x${commitment}`)), 
  32
);

// Register on-chain with USER's address
const tx = await contract.registerUser(commitmentBytes, {
  gasLimit: 300_000
});
```

---

## 🎯 Alternative: Use Privy (Easier)

Your project already has Privy! Use it for Farcaster auth:

### Step 1: Configure Privy for Farcaster

```typescript
// In privy-provider.tsx
import { PrivyProvider } from '@privy-io/react-auth';

<PrivyProvider
  appId={process.env.VITE_PRIVY_APP_ID}
  config={{
    loginMethods: ['farcaster', 'wallet'],
    appearance: {
      theme: 'light',
      accentColor: '#676FFF',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
  }}
>
  {children}
</PrivyProvider>
```

### Step 2: Use Privy in Farcaster Miniapp

```typescript
import { usePrivy } from '@privy-io/react-auth';

export default function FarcasterMiniapp() {
  const { user, authenticated, login } = usePrivy();
  
  // Get user's wallet address
  const walletAddress = user?.wallet?.address;
  const farcasterFid = user?.farcaster?.fid;
  
  // Use this as userId
  const userId = walletAddress || `fid:${farcasterFid}` || "demo-user";
  
  // Send to backend
  const response = await fetch("/api/farcaster/save-birth-data", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${await user?.getAccessToken()}`
    },
    body: JSON.stringify(birthData)
  });
}
```

### Step 3: Verify on Backend

```typescript
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

// Middleware to verify Privy token
async function getPrivyUser(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return "demo-user";
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const claims = await privy.verifyAuthToken(token);
    return claims.userId; // Privy user ID (includes wallet)
  } catch (error) {
    console.error('Failed to verify Privy token:', error);
    return "demo-user";
  }
}
```

---

## 🔐 Security Implications

### Current (INSECURE):
- ❌ Everyone shares the same data
- ❌ No authentication
- ❌ Anyone can see/modify anyone's birth data
- ❌ No privacy

### With Wallet Auth (SECURE):
- ✅ Each user has their own data
- ✅ Wallet signature verification
- ✅ Birth data tied to wallet address
- ✅ Privacy preserved
- ✅ On-chain registration with user's wallet

---

## 📊 Data Flow Comparison

### BEFORE (Current - Broken):
```
User A → "demo-user" → Birth Data X
User B → "demo-user" → Birth Data X (SAME!)
User C → "demo-user" → Birth Data X (SAME!)
```

### AFTER (With Auth - Fixed):
```
User A (0x1234...abcd) → Birth Data X
User B (0x5678...efgh) → Birth Data Y
User C (0x9abc...ijkl) → Birth Data Z
```

---

## 🚀 Recommended Approach

### Option 1: Use Privy (EASIEST) ⭐⭐⭐

**Pros:**
- ✅ Already integrated in your project
- ✅ Supports Farcaster login
- ✅ Handles wallet connection
- ✅ Easy to implement (1-2 hours)
- ✅ Production-ready

**Cons:**
- Requires Privy account (you have one)
- Small monthly cost for production

### Option 2: Use Farcaster Frame SDK (NATIVE) ⭐⭐

**Pros:**
- ✅ Native Farcaster integration
- ✅ No third-party dependency
- ✅ Free

**Cons:**
- More complex implementation
- Need to verify frame signatures
- More code to maintain

### Option 3: Keep Demo Mode + Add Disclaimer (TEMPORARY) ⭐

**Pros:**
- ✅ No code changes
- ✅ Works for testing

**Cons:**
- ❌ Not production-ready
- ❌ No real user separation
- ❌ No privacy

---

## 💡 Quick Fix for Testing

If you want to test with multiple users RIGHT NOW:

```typescript
// In farcaster-routes.ts
function getUserId(req: Request): string {
  // Use IP address as temporary user ID
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  return `demo-${ip}`;
}
```

This gives each IP address a different user ID. Not secure, but better than everyone sharing "demo-user"!

---

## 🎯 Recommendation

**Use Privy for Farcaster auth** - it's the easiest and most secure option.

### Implementation Steps:

1. ✅ Configure Privy for Farcaster login (5 min)
2. ✅ Add Privy auth to farcaster-miniapp.tsx (15 min)
3. ✅ Update backend to verify Privy tokens (30 min)
4. ✅ Test with multiple wallets (15 min)

**Total time: ~1 hour**

---

## 📚 Resources

- Farcaster Frames: https://docs.farcaster.xyz/developers/frames/
- Privy Farcaster: https://docs.privy.io/guide/react/recipes/farcaster
- Frame SDK: https://github.com/farcasterxyz/frame-sdk

---

**Bottom Line:**

Your app is currently using a **hardcoded demo user** for everyone. You need to implement **real wallet authentication** using either:
1. Privy (easiest, recommended) ⭐
2. Farcaster Frame SDK (more work)
3. IP-based temporary IDs (testing only)

Without this, all users share the same birth data and predictions! 🚨

