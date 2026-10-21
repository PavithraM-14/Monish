# PredictaMaint - Deployment Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL PLATFORM                         │
│                    (your-project.vercel.app)                    │
└─────────────────────────────────────────────────────────────────┘
                               ▲
                               │
                    ┌──────────┴──────────┐
                    │                     │
         ┌──────────▼─────────┐  ┌───────▼────────┐
         │   CLIENT (React)   │  │ SERVER (API)   │
         │   Built with Vite  │  │  Node.js       │
         │                    │  │  Express.js    │
         │  Routes:           │  │                │
         │  - /               │  │  Routes:       │
         │  - /dashboard      │  │  - /api/*      │
         │  - /machines       │  │                │
         │  - /tickets        │  │                │
         └────────────────────┘  └────────┬───────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
         ┌──────────▼──────────┐                   ┌───────────▼──────────┐
         │  MongoDB Atlas       │                   │   Groq AI API        │
         │  (Database)          │                   │   (Chat Service)     │
         │                      │                   │                      │
         │  Collections:        │                   │  Model:              │
         │  - users             │                   │  openai/gpt-oss-20b  │
         │  - machines          │                   │                      │
         │  - telemetry         │                   │  Used for:           │
         │  - anomalies         │                   │  - AI diagnostics    │
         │  - tickets           │                   │  - Chat support      │
         │  - activities        │                   │                      │
         └─────────────────────┘                   └──────────────────────┘
```

---

## 📊 Data Flow

### User Request Flow

```
┌──────────┐     HTTPS      ┌──────────┐     API Call     ┌──────────┐
│  Browser │ ─────────────► │  Vercel  │ ──────────────► │  Server  │
│          │                │  CDN     │                  │  (API)   │
└──────────┘                └──────────┘                  └─────┬────┘
                                                                │
                            ┌───────────────────────────────────┼────┐
                            │                                   │    │
                    ┌───────▼─────┐                   ┌─────────▼───────┐
                    │   MongoDB   │                   │   Groq API      │
                    │   Query     │                   │   AI Request    │
                    └─────────────┘                   └─────────────────┘
```

### Authentication Flow

```
1. User Login (POST /api/auth/login)
   └─► Server validates credentials against MongoDB
       └─► Returns JWT token

2. Authenticated Requests
   └─► Client sends JWT in Authorization header
       └─► Server middleware validates JWT
           └─► If valid, processes request
           └─► If invalid, returns 401 Unauthorized
```

### Real-time Monitoring Flow

```
1. Sensors → Telemetry Data
   └─► POST /api/telemetry
       └─► Store in MongoDB (time-series collection)
           └─► Analytics Engine processes
               └─► Detects anomalies
                   └─► Creates alerts/tickets
```

---

## 🗂️ Project Structure

```
PredictaMaint/
│
├── client/                     # Frontend React Application
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context (Auth)
│   │   └── hooks/             # Custom React hooks
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json           # Vercel build config
│
├── server/                    # Backend Node.js API
│   ├── controllers/          # Route handlers
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── middleware/           # Auth middleware
│   ├── utils/                # Helper functions
│   ├── scripts/              # Database seed scripts
│   ├── server.js             # Main server file
│   ├── package.json
│   └── vercel.json          # Vercel serverless config
│
├── analytics/                # Python analytics (optional)
│   ├── anomaly_engine.py
│   ├── rul_estimator.py
│   └── run_pipeline.py
│
├── vercel.json              # Root deployment config
├── .gitignore
├── README.md
├── DEPLOYMENT_CHECKLIST.md
├── ENV_VARIABLES_REFERENCE.md
└── VERCEL_DEPLOYMENT.md
```

---

## 🔐 Security Architecture

### Authentication & Authorization

```
┌──────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└──────────────────────────────────────────────────────────────┘

Layer 1: HTTPS (Vercel automatically provides SSL)
   └─► All traffic encrypted

Layer 2: JWT Authentication
   └─► Token-based auth with bcrypt password hashing
       └─► Token expires after set time
           └─► Refresh required

Layer 3: Role-Based Access Control (RBAC)
   └─► User roles: admin, engineer, operator
       └─► Different permissions per role

Layer 4: Environment Variables
   └─► Secrets stored securely in Vercel
       └─► Never exposed in client code

Layer 5: MongoDB Atlas Security
   └─► Database authentication required
       └─► IP whitelist (configured)
           └─► Encrypted connections
```

---

## 🌐 API Endpoints

### Public Endpoints (No Auth Required)
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
GET    /api/health            # System health check
```

### Protected Endpoints (Auth Required)
```
# Machines
GET    /api/machines          # List all machines
GET    /api/machines/:id      # Get machine details
POST   /api/machines          # Create new machine
PUT    /api/machines/:id      # Update machine
DELETE /api/machines/:id      # Delete machine

# Telemetry
GET    /api/telemetry/:machineId    # Get machine telemetry
POST   /api/telemetry               # Post new telemetry data

# Anomalies
GET    /api/anomalies         # List anomalies
GET    /api/anomalies/:id     # Get anomaly details
POST   /api/anomalies         # Create anomaly

# Tickets (Work Orders)
GET    /api/tickets           # List tickets
GET    /api/tickets/:id       # Get ticket details
POST   /api/tickets           # Create ticket
PUT    /api/tickets/:id       # Update ticket

# Issues (Intimations)
GET    /api/issues            # List issues
POST   /api/issues            # Create issue
PUT    /api/issues/:id        # Update issue

# Activities
GET    /api/activities        # Get activity log

# Reports
GET    /api/reports/summary   # Get dashboard summary
GET    /api/reports/export    # Export data

# AI Chat
POST   /api/chat              # Send message to AI assistant
GET    /api/chat/history      # Get chat history
```

---

## 💾 Database Schema

### Collections

```
┌─────────────────────────────────────────────────────────────┐
│  users                                                       │
├─────────────────────────────────────────────────────────────┤
│  - _id: ObjectId                                            │
│  - username: String                                         │
│  - email: String                                            │
│  - password: String (hashed)                                │
│  - role: String (admin/engineer/operator)                   │
│  - createdAt: Date                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  machines                                                    │
├─────────────────────────────────────────────────────────────┤
│  - _id: ObjectId                                            │
│  - name: String                                             │
│  - type: String                                             │
│  - status: String (operational/warning/critical/offline)    │
│  - location: String                                         │
│  - lastMaintenance: Date                                    │
│  - nextMaintenance: Date                                    │
│  - rul: Number (Remaining Useful Life)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  telemetry (Time-Series)                                    │
├─────────────────────────────────────────────────────────────┤
│  - _id: ObjectId                                            │
│  - machineId: ObjectId                                      │
│  - timestamp: Date                                          │
│  - temperature: Number                                      │
│  - vibration: Number                                        │
│  - pressure: Number                                         │
│  - rpm: Number                                              │
│  - power: Number                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  anomalies                                                   │
├─────────────────────────────────────────────────────────────┤
│  - _id: ObjectId                                            │
│  - machineId: ObjectId                                      │
│  - severity: String (low/medium/high/critical)              │
│  - detectedAt: Date                                         │
│  - metric: String                                           │
│  - value: Number                                            │
│  - threshold: Number                                        │
│  - description: String                                      │
│  - resolved: Boolean                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  tickets (Work Orders)                                      │
├─────────────────────────────────────────────────────────────┤
│  - _id: ObjectId                                            │
│  - machineId: ObjectId                                      │
│  - title: String                                            │
│  - description: String                                      │
│  - status: String (open/in-progress/completed/closed)       │
│  - priority: String (low/medium/high/urgent)                │
│  - assignedTo: ObjectId (user)                              │
│  - createdBy: ObjectId (user)                               │
│  - createdAt: Date                                          │
│  - completedAt: Date                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Performance Optimization

### Frontend (Client)
- **Code Splitting**: React lazy loading for routes
- **Asset Optimization**: Vite build optimization
- **CDN**: Vercel Edge Network for static assets
- **Caching**: Browser caching for API responses

### Backend (Server)
- **Serverless Functions**: Auto-scaling with Vercel
- **Database Indexing**: MongoDB indexes on frequently queried fields
- **Connection Pooling**: MongoDB connection reuse
- **API Response Caching**: Cache frequently accessed data

---

## 📈 Monitoring & Logging

### What to Monitor

1. **Vercel Dashboard**
   - Function execution time
   - Error rates
   - Bandwidth usage
   - Build status

2. **MongoDB Atlas**
   - Connection count
   - Query performance
   - Database size
   - Index usage

3. **Groq API**
   - Request count
   - Rate limits
   - Response times
   - Error rates

---

## 🔄 CI/CD Pipeline

```
┌──────────────┐     Push      ┌──────────────┐    Webhook    ┌──────────────┐
│   Developer  │ ────────────► │    GitHub    │ ───────────► │    Vercel    │
└──────────────┘               └──────────────┘              └──────┬───────┘
                                                                     │
                                                          ┌──────────▼─────────┐
                                                          │  1. Clone Repo     │
                                                          │  2. Install Deps   │
                                                          │  3. Build Client   │
                                                          │  4. Deploy Server  │
                                                          │  5. Health Check   │
                                                          └────────────────────┘
```

**Automatic Deployment Triggers:**
- Push to `main` branch → Production deployment
- Pull Request → Preview deployment
- Manual trigger → Custom deployment

---

## 🎯 Environment Configuration

```
Development (Local)
├── Client: http://localhost:5173
├── Server: http://localhost:5000
├── Database: Local MongoDB or Atlas
└── API Key: Development Groq key

Production (Vercel)
├── Client: https://your-project.vercel.app
├── Server: https://your-project.vercel.app/api
├── Database: MongoDB Atlas
└── API Key: Production Groq key
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Monitor error logs weekly
- [ ] Review API usage monthly
- [ ] Update dependencies quarterly
- [ ] Database backup verification
- [ ] Security audit annually

### Scaling Considerations
- Vercel automatically scales serverless functions
- MongoDB Atlas can scale clusters
- Groq API has rate limits - monitor usage
- Consider Redis for caching if needed

---

**Last Updated:** 2026-10-21
**Version:** 1.0.0
