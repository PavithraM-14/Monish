# Vercel Deployment Guide for PredictaMaint

This guide covers deploying both the client and server components to Vercel.

## 🚀 Deployment Strategy

You have two options for deploying this application:

### Option 1: Monorepo Deployment (Recommended)
Deploy both client and server from a single repository with proper routing.

### Option 2: Separate Deployments
Deploy client and server as separate Vercel projects.

---

## 📋 Environment Variables to Configure

### **SERVER Environment Variables**

Configure these in Vercel Project Settings → Environment Variables:

```
PORT=5000
MONGO_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-secure-jwt-secret>
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=openai/gpt-oss-20b
```

**Important Notes:**
- **MONGO_URI**: Replace with MongoDB Atlas connection string (Vercel doesn't support local MongoDB)
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/predictamaint?retryWrites=true&w=majority`
- **JWT_SECRET**: Generate a strong secret (e.g., using `openssl rand -base64 32`)
- **GROQ_API_KEY**: Get your API key from https://console.groq.com/
- **PORT**: Vercel will override this, but keep it for local development

### **CLIENT Environment Variables**

Configure these in Vercel Project Settings → Environment Variables:

```
VITE_API_BASE_URL=<your-server-url>
```

**For Monorepo Deployment:**
```
VITE_API_BASE_URL=/api
```

**For Separate Deployment:**
```
VITE_API_BASE_URL=https://your-server-project.vercel.app
```

---

## 🔧 Option 1: Monorepo Deployment (Single Project)

### Step 1: Prepare MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IPs (0.0.0.0/0) for Vercel
5. Get your connection string

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: Leave empty (handled by vercel.json)
   - **Output Directory**: Leave empty

### Step 4: Add Environment Variables

In Vercel project settings, add all the environment variables listed above:

**Server Variables:**
- `MONGO_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `PORT`

**Client Variables:**
- `VITE_API_BASE_URL=/api`

### Step 5: Deploy

Click **Deploy** and wait for the build to complete.

---

## 🔧 Option 2: Separate Deployments

### Deploy Server (API)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Output Directory**: Leave empty
5. Add environment variables (all server variables from above)
6. Deploy

### Deploy Client (Frontend)

1. Create another new project in Vercel
2. Import the same GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_API_BASE_URL=https://your-server-project.vercel.app`
5. Deploy

---

## 🔐 Security Checklist

Before deploying, ensure:

- [ ] MongoDB Atlas is configured with proper authentication
- [ ] Strong JWT_SECRET is set (not the default from .env)
- [ ] GROQ_API_KEY is valid and has appropriate rate limits
- [ ] CORS is properly configured in server
- [ ] .env files are in .gitignore (don't commit secrets)

---

## 📝 Post-Deployment Steps

1. **Test API Endpoints**: Visit `https://your-domain.vercel.app/api/health` (create this endpoint if needed)
2. **Seed Database**: Run the seed script if needed
3. **Test Authentication**: Try logging in through the UI
4. **Check Logs**: Monitor Vercel function logs for errors

---

## 🛠️ Update Server for Vercel Compatibility

The server needs a small modification for Vercel serverless functions:

### Update server/server.js

Add at the end of the file:

```javascript
// Export for Vercel
export default app;
```

---

## 🔄 Redeployment

Any push to the `main` branch will automatically trigger a new deployment.

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### API Not Working
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check CORS configuration in server

### Client Can't Connect to API
- Verify VITE_API_BASE_URL is correct
- Check browser console for CORS errors
- Ensure API routes match server routes

---

## 📚 Useful Commands

### Local Testing
```bash
# Client
cd client
npm run dev

# Server
cd server
npm run dev
```

### Build Locally
```bash
# Client
cd client
npm run build

# Server
cd server
npm start
```

---

## 📞 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Documentation](https://vitejs.dev/)
