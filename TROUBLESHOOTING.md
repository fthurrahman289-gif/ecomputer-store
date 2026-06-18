# 🆘 VERCEL + SUPABASE - QUICK REFERENCE & TROUBLESHOOTING

## 🚨 COMMON ERRORS & FIXES

### ❌ Error: "Cannot connect to database"

**What you see:**
```json
{"status":"error","database":"disconnected"}
```

**Causes & Solutions:**

1️⃣ **Wrong DATABASE_URL format**
   - ✅ CORRECT: `postgresql://postgres.xxxxx:[password]@aws-0-xxx.pooling.supabase.com:6543/postgres`
   - ❌ WRONG: `postgresql://postgres.xxxxx:[password]@db.xxxxx.supabase.co:5432/postgres` (direct connection)
   - ❌ WRONG: Missing port or wrong port

   **Fix:**
   - Go to Supabase dashboard → Settings → Database → Connection pooling
   - Copy the string (PgBouncer mode)
   - Update `DATABASE_URL` in Vercel environment variables
   - Redeploy backend

2️⃣ **Supabase project not active**
   - Check if Supabase project still exists
   - Not suspended or deleted

3️⃣ **Environment variable not set**
   - Vercel → Backend project → Settings → Environment Variables
   - Verify `DATABASE_URL` is there
   - Redeploy backend after adding

**Debug Command (Local):**
```bash
psql -h aws-0-xxx.pooling.supabase.com -p 6543 -U postgres -d postgres
# Type password
# If successful: psql will show "postgres=>"
# Exit: \q
```

---

### ❌ Error: "Cannot GET /health" or "404 Not Found"

**What you see:**
```
404 - Cannot GET /health
```

**Causes:**
- Backend not deployed correctly
- Wrong deployment root directory

**Fix:**
1. Check Vercel backend → Settings → Root Directory = `./backend`
2. Redeploy: Deployments → Latest → More options → Redeploy
3. Check logs for build errors

---

### ❌ Error: "CORS error" in Browser Console

**What you see:**
```
Access to XMLHttpRequest at 'https://backend.vercel.app/api/...' 
has been blocked by CORS policy
```

**Causes:**
- Frontend and backend on different domains (this is normal)
- Backend not allowing CORS

**Fix:**
1. Backend already has `app.use(cors())` ✅
2. Verify `VITE_API_URL` in Frontend is correct
3. Redeploy frontend

**Debug in Browser (F12):**
- Network tab → Click failing request
- Check Response Headers for `Access-Control-Allow-Origin`

---

### ❌ Error: "JWT_SECRET is undefined" or "Login returns 500"

**What you see:**
```
Error: JWT_SECRET is not defined
or
500 Internal Server Error on login
```

**Causes:**
- `JWT_SECRET` environment variable not set
- Typo in variable name

**Fix:**
1. Vercel → Backend → Settings → Environment Variables
2. Add: `JWT_SECRET` = any random string (min 32 chars)
3. Example: `mysupersecretsecurekey123456789abc`
4. Redeploy backend: Deployments → Redeploy

---

### ❌ Error: "EMAIL_PASSWORD not found" or OTP not sending

**What you see:**
```
Error sending email: EAUTH
or
[Gmail] Less secure app access has been disabled
```

**Causes:**
- Wrong Email app password
- Using Gmail password instead of App Password
- Gmail 2FA not enabled

**Fix:**
1. Go to: https://myaccount.google.com/security
2. Make sure **2-Step Verification** is ON
3. Find **App passwords** section
4. Select: **Mail** + **Windows Computer**
5. Generate new password (16 chars)
6. Copy and paste into Vercel `EMAIL_PASSWORD`
7. Redeploy backend

---

### ❌ Error: "Database query timeout"

**What you see:**
```
Error: Query timeout
```

**Causes:**
- Database connection pooling issue
- Query too slow
- Cold start (first request slow)

**Fix:**
1. Verify connection pooling parameters in [backend/src/config/db.js](./backend/src/config/db.js)
2. Current settings optimized for Vercel serverless ✅
3. First request might be slow (cold start) - this is normal
4. Contact Supabase support if persistent

---

### ❌ Frontend Blank / Error: "Cannot find module"

**What you see:**
- Blank white page
- Console: "Cannot find module" errors
- VITE_API_URL is not defined

**Causes:**
- Environment variables not built into frontend
- Build step failed

**Fix:**
1. Redeploy frontend (sometimes variables don't take effect immediately)
2. Check build logs: Vercel → Deployments → Latest → Logs
3. Verify `VITE_API_URL` is in Frontend env vars

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify everything with this:

### Backend Alive?
```bash
# In browser or curl:
https://your-backend.vercel.app/health

# Should return:
{"status":"ok","database":"connected"}
```

### Database Connected?
```bash
# Option 1: Check health endpoint (above)

# Option 2: Try login
# Go to Frontend → Login
# Enter: admin@example.com / admin123
# If works → database OK
```

### API Responding?
```bash
# In Browser DevTools (F12) → Network tab
# Perform any action (login, search products, etc)
# Check API calls go to correct backend URL
# Response should be 200 OK (green)
```

### Frontend Talking to Backend?
```bash
# Frontend URL → Open Inspector (F12)
# Console tab → Should be clean (no red errors)
# Network tab → Click on API request
# Check "Access-Control-Allow-Origin" header exists
```

---

## 🔧 USEFUL DEBUG COMMANDS

### Check Vercel Logs (Real-time)
```bash
# Install Vercel CLI first
npm i -g vercel

# Login
vercel login

# Stream logs
vercel logs your-backend-project-name
vercel logs your-frontend-project-name
```

### Local Testing (Before Deploy)
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with local DATABASE_URL
npm install
npm run dev
# Should show: "✅ Connected to PostgreSQL Database"

# Frontend (in separate terminal)
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000
npm install
npm run dev
# Open: http://localhost:5173
```

### Test Database Connection
```bash
# Using psql (PostgreSQL client)
psql -h aws-0-xxx.pooling.supabase.com \
     -p 6543 \
     -U postgres \
     -d postgres

# Inside psql:
\dt              # List all tables
SELECT COUNT(*) FROM users;  # Check users table
\q              # Exit
```

---

## 📊 PERFORMANCE TIPS

### Reduce Cold Starts
- Cold start = first request takes 5-10s
- Subsequent requests are fast
- **This is normal on Vercel with PostgreSQL**
- Solution: Use paid Vercel plan for better performance

### Monitor Database Performance
- Supabase Dashboard → Settings → Database
- Check query performance
- Review slow query logs

### Frontend Load Time
- Check Vercel Analytics (if enabled)
- Optimize images & assets
- Currently using Vite (already optimized) ✅

---

## 🆘 WHEN ALL ELSE FAILS

### Step 1: Check Vercel Logs
```
Vercel Dashboard → Project → Deployments → Latest → Logs
```

### Step 2: Check Recent Changes
```bash
git log --oneline -10
# See what changed recently
```

### Step 3: Clear Everything & Redeploy
```bash
# In Vercel:
1. Go to Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
```

### Step 4: Full Reset
```bash
# Verify environment variables are correct
# Redeploy both frontend AND backend
# Clear browser cache (Ctrl+Shift+Delete)
# Test again
```

### Step 5: Contact Support
- **Vercel Issues**: https://vercel.com/support
- **Supabase Issues**: https://supabase.com/support
- **GitHub Issues**: Check project GitHub

---

## 📝 ENVIRONMENT VARIABLES QUICK COPY-PASTE

### Backend Environment Variables
```
DATABASE_URL = [Get from Supabase Connection Pooling]
JWT_SECRET = mysupersecretsecurekey123456789abc
EMAIL_USER = your-gmail@gmail.com
EMAIL_PASSWORD = xxxx xxxx xxxx xxxx
NODE_ENV = production
```

### Frontend Environment Variables
```
VITE_API_URL = https://your-backend.vercel.app
```

---

## 💡 TIPS & TRICKS

1. **First request slow?** This is normal - it's called "cold start"
2. **Want to see logs?** Install Vercel CLI: `npm i -g vercel`
3. **Database full?** Check Supabase dashboard for disk usage
4. **Too many requests?** Add rate limiting (future enhancement)
5. **Want custom domain?** Vercel → Project → Settings → Domains

---

## ⚡ QUICK REDEPLOY

```bash
# Fastest way to redeploy after code changes:
cd backend
git add .
git commit -m "Quick fix"
git push
# Vercel auto-deploys within 1 minute

# Or manual redeploy in Vercel:
# Deployments → Latest → ... → Redeploy
```

---

**Need more help? Check the main guides:**
- [VERCEL_SUPABASE_DEPLOYMENT.md](./VERCEL_SUPABASE_DEPLOYMENT.md) - Full detailed guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step by step checklist
- [README.md](./README.md) - Project overview
