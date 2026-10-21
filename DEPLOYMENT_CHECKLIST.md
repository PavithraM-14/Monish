# 🚀 Vercel Deployment Checklist

## Pre-Deployment Setup

### ☁️ Step 1: Set Up MongoDB Atlas (Database)
- [ ] Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Create a free M0 cluster
- [ ] Create database user with username and password
- [ ] Whitelist all IPs: **Network Access** → **0.0.0.0/0**
- [ ] Get connection string and save it

**Your MONGO_URI will look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/predictamaint?retryWrites=true&w=majority
```

---

### 🔑 Step 2: Get Groq API Key (AI Chat)
- [ ] Go to [Groq Console](https://console.groq.com/)
- [ ] Sign up / Login
- [ ] Create API Key
- [ ] Copy the key (starts with `gsk_`)

**Your GROQ_API_KEY will look like:**
```
gsk_abc123def456ghi789...
```

---

### 🔐 Step 3: Generate JWT Secret
Run this command in terminal:

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Or use:** https://randomkeygen.com/

**Your JWT_SECRET should be at least 32 characters**

---

### 📦 Step 4: Prepare Code for Deployment
- [ ] All code committed to GitHub
- [ ] .gitignore created (prevents committing .env files)
- [ ] vercel.json files created
- [ ] server.js updated for Vercel compatibility

---

## Vercel Deployment

### 🌐 Step 5: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select: `https://github.com/PavithraM-14/Monish`
5. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** (leave empty - auto detected)
   - **Output Directory:** (leave empty - auto detected)

---

### ⚙️ Step 6: Add Environment Variables in Vercel

Go to: **Project Settings** → **Environment Variables**

Add these **5 variables** (click "Add New" for each):

#### Variable 1:
- **Name:** `MONGO_URI`
- **Value:** Your MongoDB Atlas connection string
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variable 2:
- **Name:** `JWT_SECRET`
- **Value:** Your generated secret key (32+ characters)
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variable 3:
- **Name:** `GROQ_API_KEY`
- **Value:** Your Groq API key (starts with gsk_)
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variable 4:
- **Name:** `GROQ_MODEL`
- **Value:** `openai/gpt-oss-20b`
- **Environment:** ✅ Production ✅ Preview ✅ Development

#### Variable 5:
- **Name:** `VITE_API_BASE_URL`
- **Value:** `/api`
- **Environment:** ✅ Production ✅ Preview ✅ Development

---

### 🎯 Step 7: Deploy!

- [ ] Click **"Deploy"** button
- [ ] Wait 2-5 minutes for build to complete
- [ ] Check build logs for errors

---

## Post-Deployment Verification

### ✅ Step 8: Test Your Deployment

#### Test 1: Health Check
Visit: `https://your-project.vercel.app/api/health`

**Expected Response:**
```json
{
  "status": "online",
  "timestamp": "2026-10-21T...",
  "database": "connected",
  "groqConfigured": true
}
```

- [ ] Status is "online"
- [ ] Database is "connected"
- [ ] groqConfigured is true

#### Test 2: Frontend Loads
Visit: `https://your-project.vercel.app`

- [ ] Login page appears
- [ ] No console errors (press F12)
- [ ] Page looks correct

#### Test 3: Create Test User
- [ ] Can register a new user
- [ ] Can log in
- [ ] Dashboard loads

#### Test 4: Test AI Chat
- [ ] Chat widget appears
- [ ] Can send a message
- [ ] AI responds

---

## 🆘 Troubleshooting Guide

### ❌ Build Failed

**Check:**
1. Are all dependencies in package.json?
2. Is Node.js version compatible?
3. Check build logs in Vercel dashboard

**Fix:**
- Review error message in Vercel logs
- Fix the issue in code
- Commit and push to GitHub (auto-redeploys)

---

### ❌ "Cannot connect to MongoDB"

**Check:**
1. Is MONGO_URI correct in Vercel environment variables?
2. Did you whitelist all IPs (0.0.0.0/0) in MongoDB Atlas?
3. Is the database user password correct?

**Fix:**
- Go to MongoDB Atlas → Network Access → Add IP Address → 0.0.0.0/0
- Verify MONGO_URI format
- Redeploy in Vercel

---

### ❌ "JWT malformed" or Authentication Errors

**Check:**
1. Is JWT_SECRET set in Vercel?
2. Is it the same in all environments?

**Fix:**
- Add/update JWT_SECRET in Vercel environment variables
- Redeploy

---

### ❌ "Groq API Error" or Chat Not Working

**Check:**
1. Is GROQ_API_KEY valid?
2. Have you exceeded rate limits?
3. Is GROQ_MODEL correct?

**Fix:**
- Verify API key at https://console.groq.com/
- Check usage/rate limits
- Update environment variable if key changed

---

### ❌ Frontend Shows "Network Error"

**Check:**
1. Is VITE_API_BASE_URL set to `/api`?
2. Open browser console (F12) - what's the error?

**Fix:**
- Set VITE_API_BASE_URL to `/api` in Vercel
- Redeploy

---

### ❌ 404 Not Found for API Routes

**Check:**
1. Is vercel.json in the root directory?
2. Are routes configured correctly?

**Fix:**
- Verify vercel.json exists and is correct
- Push to GitHub and redeploy

---

## 📝 Quick Command Reference

### Commit and Push Changes
```bash
git add .
git commit -m "Your change description"
git push origin main
```

### Test Locally Before Deploying
```bash
# Terminal 1 - Start Server
cd server
npm install
npm start

# Terminal 2 - Start Client
cd client
npm install
npm run dev
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ `/api/health` returns status "online"
- ✅ Frontend loads at your Vercel URL
- ✅ Can register/login
- ✅ Dashboard shows data
- ✅ AI chat responds

---

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Dashboard**
   - Deployment status
   - Function logs
   - Error tracking

2. **MongoDB Atlas**
   - Database connections
   - Performance metrics
   - Storage usage

3. **Groq Console**
   - API usage
   - Rate limits
   - Request logs

---

## 🔄 Making Updates

Whenever you make changes:

1. Edit code locally
2. Test locally
3. Commit to GitHub
4. Vercel automatically redeploys
5. Check deployment logs
6. Verify changes live

---

## 📞 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Groq API:** https://console.groq.com/docs
- **GitHub Repo:** https://github.com/PavithraM-14/Monish

---

**Need help?** Check the detailed guides:
- `ENV_VARIABLES_REFERENCE.md` - Environment variables explained
- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `README.md` - Project documentation
