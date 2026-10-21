# Environment Variables Reference for Vercel Deployment

## 📋 Quick Copy-Paste for Vercel

### **SERVER ENVIRONMENT VARIABLES**

Copy these variable **names** into Vercel → Project Settings → Environment Variables, then fill in your values:

| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/predictamaint` | ✅ Yes |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key-min-32-chars` | ✅ Yes |
| `GROQ_API_KEY` | Groq API key for AI chat | `gsk_xxxxxxxxxxxxx` | ✅ Yes |
| `GROQ_MODEL` | Groq model to use | `openai/gpt-oss-20b` | ✅ Yes |
| `PORT` | Server port (Vercel overrides) | `5000` | ⚠️ Optional |

---

### **CLIENT ENVIRONMENT VARIABLES**

| Variable Name | Description | Value for Monorepo | Value for Separate Deploy |
|--------------|-------------|-------------------|-------------------------|
| `VITE_API_BASE_URL` | Backend API URL | `/api` | `https://your-server.vercel.app` |

---

## 🔑 How to Get These Values

### 1. **MONGO_URI** - MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login (free tier available)
3. Create a cluster (M0 free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `predictamaint`

**Example:**
```
mongodb+srv://admin:MySecurePassword123@cluster0.abc123.mongodb.net/predictamaint?retryWrites=true&w=majority
```

**Important:** 
- Whitelist all IPs: Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

---

### 2. **JWT_SECRET** - Generate Secure Secret

Use one of these methods:

**Option A: OpenSSL (if installed)**
```bash
openssl rand -base64 32
```

**Option B: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Online Generator**
- Visit: https://randomkeygen.com/
- Use a "256-bit WPA Key" or "Fort Knox Password"

**Example:**
```
K7x9mP2nQ5vR8tW1yU4eO6aI3bH7jL9k
```

---

### 3. **GROQ_API_KEY** - Get from Groq Console

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

**Example:**
```
gsk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Note:** Free tier available with rate limits

---

### 4. **GROQ_MODEL** - AI Model Selection

Use one of these models:

| Model | Best For | Speed | Quality |
|-------|----------|-------|---------|
| `openai/gpt-oss-20b` | General purpose | Fast | Good |
| `mixtral-8x7b-32768` | Complex queries | Medium | Better |
| `llama2-70b-4096` | Balanced | Fast | Good |

**Recommended:**
```
openai/gpt-oss-20b
```

---

## 🚀 Step-by-Step Vercel Configuration

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub: `https://github.com/PavithraM-14/Monish`

### 2. Add Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add each variable one by one:
   - Click "Add New"
   - Enter Variable Name (e.g., `MONGO_URI`)
   - Enter Value (your actual connection string)
   - Select Environment: **Production**, **Preview**, **Development** (check all)
   - Click "Save"

### 3. Required Variables Checklist

For **SERVER** (Backend):
- [ ] `MONGO_URI` - Your MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Your generated secret key (32+ characters)
- [ ] `GROQ_API_KEY` - Your Groq API key
- [ ] `GROQ_MODEL` - Model name (use `openai/gpt-oss-20b`)

For **CLIENT** (Frontend):
- [ ] `VITE_API_BASE_URL` - Use `/api` for monorepo

---

## 🎯 Deployment Profiles

### Profile 1: Monorepo (Both in One Project)

**Vercel Settings:**
- Framework: Other
- Root Directory: `./`
- Build Command: (auto-detected)
- Output Directory: (auto-detected)

**Environment Variables:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
VITE_API_BASE_URL=/api
```

---

### Profile 2: Separate Projects

**Project A: Server (API)**
- Framework: Other
- Root Directory: `server`
- Build Command: `npm install`

**Environment Variables:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
PORT=5000
```

**Project B: Client (Frontend)**
- Framework: Vite
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variables:**
```
VITE_API_BASE_URL=https://your-server-project.vercel.app
```

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Don't commit .env files** - They're in .gitignore
2. ❌ **Don't use localhost** in MONGO_URI - Use MongoDB Atlas
3. ❌ **Don't use weak JWT_SECRET** - Minimum 32 characters
4. ❌ **Don't forget to whitelist IPs** in MongoDB Atlas - Use 0.0.0.0/0
5. ❌ **Don't mix up client/server variables** - Check which project needs which

---

## ✅ Verification Steps

After deployment:

1. **Check Deployment Logs**
   - Look for "✅ Connected to MongoDB"
   - No errors about missing environment variables

2. **Test API Health**
   - Visit: `https://your-domain.vercel.app/api/health`
   - Should return JSON with status: "online"

3. **Test Frontend**
   - Visit: `https://your-domain.vercel.app`
   - Should load login page

4. **Test Authentication**
   - Try logging in with a test user
   - Check browser console for errors

---

## 🆘 Troubleshooting

### Error: "Cannot connect to MongoDB"
- ✅ Check MONGO_URI is correct
- ✅ Check MongoDB Atlas network access allows all IPs (0.0.0.0/0)
- ✅ Check database user exists and password is correct

### Error: "JWT malformed" or auth issues
- ✅ Check JWT_SECRET is set in Vercel
- ✅ Redeploy after adding environment variables

### Error: "GROQ API error"
- ✅ Check GROQ_API_KEY is valid
- ✅ Check you haven't exceeded rate limits

### Build fails
- ✅ Check all dependencies are in package.json
- ✅ Check build logs in Vercel dashboard
- ✅ Verify Node.js version compatibility

---

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Groq API Docs](https://console.groq.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
