# BlockCertify Platform - Deployment Guide
# ==========================================

## Quick Deploy (Recommended)

### Frontend (Next.js) → Vercel
1. Visit: https://vercel.com/new/clone?repo-url=https://github.com/m0nu2o/blockcertify-platform
2. Sign in with GitHub
3. Click "Deploy"
4. Add environment variables (see below)
5. Done! Your frontend will be at https://blockcertify-platform.vercel.app

### Backend (Express) → Railway
1. Visit: https://render.com/deploy?repo=https://github.com/m0nu2o/blockcertify-platform
2. Connect your GitHub account
3. Select the repo
4. Set build command: `npm run build`
5. Set start command: `npm run start`
6. Set env vars (see below)
7. Click "Deploy"

### Database → MongoDB Atlas
1. Create free cluster at https://mongodb.com/atlas
2. Get connection string
3. Add to backend env as MONGODB_URI

### Environment Variables Needed

**Frontend (Vercel):**
- NEXT_PUBLIC_API_URL = your Railway backend URL + /api
- NEXTAUTH_URL = your Vercel URL
- NEXTAUTH_SECRET = (generate random)
- NEXT_PUBLIC_CONTRACT_ADDRESS = your deployed contract address (or leave empty for now)

**Backend (Railway):**
- MONGODB_URI = MongoDB Atlas connection string
- JWT_SECRET = (generate random)
- NEXTAUTH_SECRET = (generate random)
- CLIENT_URL = your Vercel URL
- SERVER_URL = your Railway URL
- SMTP_USER, SMTP_PASS = (optional, for email)

## Manual Deploy (Alternative)

If you prefer not to use cloud services:

1. Get a VPS (DigitalOcean, Linode, etc.)
2. Install Node.js, MongoDB, Docker
3. Clone repo, build, and run with docker-compose
4. Set up Nginx reverse proxy with SSL
