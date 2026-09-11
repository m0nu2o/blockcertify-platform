# BlockCertify Platform - Deployment Guide
# ==========================================

## ⚡ Quickest Path (5 minutes)

### Step 1: Deploy Frontend to Vercel (free)
Open this link in your browser:
```
https://vercel.com/new/clone?repo-url=https://github.com/m0nu2o/blockcertify-platform
```
- Sign in with GitHub
- Click **Deploy**
- Done! Your site will be at: `https://blockcertify-platform.vercel.app`

### Step 2: Deploy Backend to Railway (free tier)
Open this link in your browser:
```
https://render.com/deploy?repo=https://github.com/m0nu2o/blockcertify-platform
```
- Connect GitHub account
- Select **blockcertify-platform** repo
- Set these values:
  - **Build command**: `npm run build`
  - **Start command**: `npm run start`
  - **Instance type**: Free
- Click **Deploy**

### Step 3: Add MongoDB Atlas (free tier)
1. Go to https://mongodb.com/atlas
2. Create a free M00s cluster
3. Create a database user (username + password)
4. Click **Connect** → **Connect your application**
5. Copy the connection string (looks like: `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`)
6. In your Railway backend dashboard, go to **Environment Variables**
7. Add: `MONGODB_URI` = paste the connection string
8. Add: `NODE_ENV` = `production`
9. Add: `CLIENT_URL` = `https://blockcertify-platform.vercel.app` (from Step 1)
10. Add: `SERVER_URL` = `https://blockcertify-platform-api.onrender.com` (from Step 2)
11. Add: `JWT_SECRET` = any long random string
12. Add: `NEXTAUTH_SECRET` = any long random string
13. Redeploy the Railway service

### Step 4: Generate random secrets
```powershell
# Run in PowerShell:
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Use the output for `JWT_SECRET` and `NEXTAUTH_SECRET`.

---

## 🔧 Manual Configuration

If the button links don't work, here are the exact commands:

**Vercel:**
```powershell
cd client
npx vercel login
npx vercel --prod
```

**Railway:**
```powershell
cd server
npx @railway/cli login
railway up --project blockcertify-platform-api
```

**MongoDB Atlas connection string format:**
```
mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/blockcertify
```

---

## 🌐 What You Get
- Frontend: `https://blockcertify-platform.vercel.app`
- API: `https://blockcertify-platform-api.onrender.com`
- Free hosting, auto HTTPS, auto scaling

## 🔐 Important Notes
- The `server/.env` and `client/.env.local` files use localhost URLs - do NOT use them for production
- The `.env.production` files (in root of each workspace) have placeholder values - update them before deploying
- The blockchain (Hardhat) is for local development only - for production use Sepolia testnet or mainnet
