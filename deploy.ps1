# BlockCertify Platform Deployment Script
# Auto-deploys to Vercel + Railway + MongoDB Atlas
# Run this after adding secrets to GitHub repo settings

Set-Location "C:\Users\91951\Downloads\Block Certify\Block Certify"

Write-Host "=== BlockCertify Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Host "❌ Node.js not found" -ForegroundColor Red; exit 1 }
Write-Host "✅ Node.js: $(node -v)" -ForegroundColor Green

# Generate secrets if not provided
$jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$nextauthSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

Write-Host ""
Write-Host "Generated secrets:" -ForegroundColor Yellow
Write-Host "  JWT_SECRET: $jwtSecret" -ForegroundColor Gray
Write-Host "  NEXTAUTH_SECRET: $nextauthSecret" -ForegroundColor Gray

# Update production env files
$serverEnv = Get-Content "server/.env.production" -Raw
$serverEnv = $serverEnv -replace "change-this-to-a-long-random-secret-key", $jwtSecret
$serverEnv = $serverEnv -replace "change-this-to-a-long-random-secret-key", $nextauthSecret
$serverEnv = $serverEnv -replace "<username>", "SET_ME"
$serverEnv = $serverEnv -replace "<password>", "SET_ME"
Set-Content -Path "server/.env.production" -Value $serverEnv -NoNewline
Write-Host "✅ Updated server/.env.production" -ForegroundColor Green

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Go to https://github.com/m0nu2o/blockcertify-platform/settings/secrets" -ForegroundColor White
Write-Host "2. Add these secrets:" -ForegroundColor White
Write-Host "   - VERCEL_TOKEN (from https://vercel.com/account/tokens)" -ForegroundColor Gray
Write-Host "   - RAILWAY_TOKEN (from https://railway.app/account)" -ForegroundColor Gray
Write-Host "3. Push to main - GitHub Actions will auto-deploy" -ForegroundColor White
Write-Host ""
Write-Host "Or click these one-click deploy buttons:" -ForegroundColor Yellow
Write-Host "   Frontend: https://vercel.com/new/clone?repo-url=https://github.com/m0nu2o/blockcertify-platform" -ForegroundColor Cyan
Write-Host "   Backend:  https://render.com/deploy?repo=https://github.com/m0nu2o/blockcertify-platform" -ForegroundColor Cyan
