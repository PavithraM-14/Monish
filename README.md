# PredictaMaint — AI-Powered Industrial Predictive Maintenance & Fleet Diagnostics

**PredictaMaint** is a full-stack, enterprise-grade predictive maintenance and condition monitoring platform for manufacturing plants. It simulates multi-sensor streaming telemetry (vibration, temperature, current, pressure, RPM) for an industrial equipment fleet, performs rolling statistical anomaly detection and Remaining Useful Life (RUL) estimation, generates explainable work orders, and features a retrieval-augmented AI diagnostic assistant grounded in live MongoDB fleet data.

---

## 🌟 Key Capabilities

1. **Live Multi-Sensor Telemetry Stream**: Real-time telemetry ingestion into a native MongoDB **Time-Series collection**, with live 5-second polling charts powered by React Query and Recharts.
2. **Machine Fleet Registry**: Full CRUD registry tracking machine metadata, calibrated sensor limits, current operating status, degradation vectors, and equipment locations.
3. **Statistical Anomaly Detection Engine**: Python analytics computing rolling window baselines, standard deviations, and Z-scores ($\sigma$). Flags anomalies with severity (`low`, `medium`, `high`, `critical`) and clear physics-based root cause explanations.
4. **Remaining Useful Life (RUL) Predictor**: Component degradation and cumulative stress decay models estimating remaining machine operating hours and fleet health scores (0–100%).
5. **Explainable Alerts & Auto-Ticketing**: Automatic maintenance ticket creation for high/critical anomalies with assignment tracking, priority triage, and technician work logs.
6. **AI Diagnostic Chat Assistant**: Two-step Groq LLM workflow (`openai/gpt-oss-20b` / `llama-3.3-70b-versatile` with deterministic RAG fallback) that classifies user queries, retrieves relevant telemetry and anomaly records from MongoDB, and generates grounded diagnostic answers with source attribution tags.
7. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full access (fleet registry mutations, user administration, ticketing).
   - **Engineer**: Condition diagnostics, threshold adjustments, alert resolution, work order updates.
   - **Viewer**: Read-only monitoring of live dashboards and historical telemetry.
8. **Historical Log Explorer**: Filterable raw telemetry query explorer with one-click **CSV export** for offline machine learning research.

---

## 🏗️ Architecture & Data Flow

```text
       ┌────────────────────────┐
       │ Python Fleet Simulator │ (simulate_telemetry.py)
       └───────────┬────────────┘
                   │ Streams 5-sensor telemetry (direct / REST)
                   ▼
       ┌────────────────────────┐
       │  MongoDB (Time-Series) │ ◄──────┐
       └───────────┬────────────┘        │
                   │ Reads telemetry     │ Updates anomalies,
                   ▼                     │ RUL & tickets
       ┌────────────────────────┐        │
       │ Anomaly & RUL Engines  ├────────┘
       │ (Python Microservice)  │
       └────────────────────────┘
                   ▲
                   │ REST API / Live Polling
                   ▼
       ┌────────────────────────┐       Two-step RAG        ┌────────────────┐
       │  Express / Node Server ├──────────────────────────►│ Groq Cloud LLM │
       │  (/api REST endpoints) │  (Grounded Mongo context) │ (gpt-oss-20b)  │
       └───────────┬────────────┘                           └────────────────┘
                   │ JSON / JWT Auth
                   ▼
       ┌────────────────────────┐
       │   React (Vite) Client  │
       │ (Recharts, React Query)│
       └────────────────────────┘
```

---

## 📁 Repository Structure

```
PredAI/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── api/                # Axios API client modules
│   │   ├── components/         # KPICard, MachineChart, ChatWidget, TicketModal, etc.
│   │   ├── context/            # AuthContext (JWT & RBAC state)
│   │   ├── hooks/              # React Query hooks with 5s polling
│   │   ├── pages/              # Dashboard, Machines, MachineDetail, Tickets, LogExplorer, Login
│   │   ├── App.jsx             # Main router and view orchestration
│   │   ├── index.css           # Industrial cyber-modern design system
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend (Node.js & Express)
│   ├── controllers/            # auth, machines, telemetry, anomalies, tickets, chat
│   ├── middleware/             # auth.js (JWT authentication & RBAC guards)
│   ├── models/                 # Mongoose schemas (Machine, Telemetry, Anomaly, Ticket, User, ChatLog)
│   ├── routes/                 # Express API routes
│   ├── scripts/                # seed.js (Populates 8 machines, 3 users, telemetry, tickets)
│   ├── utils/                  # chatContextBuilder.js, promptTemplates.js
│   ├── .env.example
│   ├── server.js               # Application entrypoint
│   └── package.json
│
├── analytics/                  # Python Analytics Microservice
│   ├── simulate_telemetry.py   # Multi-machine realistic sensor generator & fault injector
│   ├── anomaly_engine.py       # Rolling Z-score anomaly detector & auto-ticketer
│   ├── rul_estimator.py        # Equipment degradation & Remaining Useful Life estimator
│   ├── run_pipeline.py         # Unified multi-threaded runner (starts all 3 scripts)
│   └── requirements.txt
│
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Recharts, TanStack React Query, Axios, Lucide React.
- **Backend**: Node.js, Express.js, Mongoose ODM, JWT, bcryptjs, Groq SDK.
- **Database**: MongoDB (with native Time-Series collection for high-frequency telemetry).
- **Analytics/AI**: Python 3, PyMongo, NumPy, Pandas, Groq API (`openai/gpt-oss-20b`).

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+ or v20+)
- Python (v3.10+)
- MongoDB (running locally on port 27017, or MongoDB Atlas connection string)

---

### Step 1: Backend Setup & Database Seeding

1. Open a terminal in the `server` folder:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables (a default `.env` is already pre-configured for local MongoDB):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/predictamaint
   JWT_SECRET=predictamaint_super_secret_jwt_key_2026_industrial
   GROQ_API_KEY=your_groq_api_key_here    # Optional: Enter key for full Groq LLM answers
   GROQ_MODEL=openai/gpt-oss-20b
   ```
   *(Note: If no Groq key is provided, the chat assistant seamlessly runs in local grounded RAG diagnostic mode using live MongoDB telemetry).*

3. Run the database seed script to populate users, 8 fleet machines, and baseline readings:
   ```bash
   npm run seed
   ```

4. Start the Express server:
   ```bash
   npm start
   ```
   The backend will be running at `http://localhost:5000`.

---

### Step 2: Frontend Setup

1. Open a second terminal in the `client` folder:
   ```bash
   cd client
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to **`http://localhost:5173`**.

---

### Step 3: Launch the Python Telemetry & Analytics Pipeline

Open a third terminal in the `analytics` folder:
```bash
cd analytics
python run_pipeline.py
```
This runs the **Simulator**, **Anomaly Engine**, and **RUL Estimator** concurrently in coordinated threads:
- Streaming fresh telemetry every 4 seconds.
- Evaluating rolling Z-scores and threshold breaches every 5 seconds.
- Updating machine Remaining Useful Life (RUL) and health scores every 8 seconds.

*(You can also run any script independently if desired):*
```bash
# Generate telemetry with injected fault on Machine 3:
python simulate_telemetry.py --interval 4 --inject MCH-003 bearing_fault

# Run anomaly detector:
python anomaly_engine.py --interval 5

# Run RUL estimator:
python rul_estimator.py --interval 8
```

---

## 👥 Demo User Accounts (1-Click Login on UI)

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@predictamaint.com` | `admin123` | Full access: register/delete machines, configure thresholds, full work orders. |
| **Engineer** | `engineer@predictamaint.com` | `engineer123` | Acknowledge & resolve anomalies, issue tickets, update machine limits. |
| **Viewer** | `viewer@predictamaint.com` | `viewer123` | Read-only access to live fleet telemetry, charts, and audit logs. |

*(The login screen includes 1-click quick login buttons for instant viva demo access).*

---

## 🤖 AI Grounded Diagnostic Chat Assistant

The floating AI assistant widget in the bottom-right corner implements a two-step Retrieval-Augmented Generation (RAG) architecture:
1. **Intent Classification & Entity Resolution**: Extracts the target `machineId` (e.g., MCH-003) and query intent (`machine_health`, `fleet_risk`, `rul_prediction`, etc.).
2. **Context Injection**: Directly queries MongoDB for the machine's safety limits, last 10 sensor telemetry observations, open anomalies, and assigned work orders.
3. **Grounded Generation**: Feeds the exact data to Groq (`openai/gpt-oss-20b` or `llama-3.3-70b-versatile`) with temperature 0.3 to produce concise engineering recommendations.
4. **Source Attribution**: Highlights `based on: Machine MCH-003, last 10 readings, 1 active alerts` directly under each answer.

### Sample Questions to Try:
- *"Why is Machine 3 flagged?"*
- *"Which machines in the fleet are at risk?"*
- *"What is the remaining useful life of the conveyor?"*
- *"Explain the latest vibration alert on MCH-003."*
- *"Show open maintenance tickets for Bay 3."*

---

## 📊 REST API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile & role | Bearer JWT |
| `GET` | `/api/machines` | List all fleet machines with filters | Viewer+ |
| `GET` | `/api/machines/stats` | Fleet uptime, at-risk count, avg RUL | Viewer+ |
| `GET` | `/api/machines/:id` | Machine details, recent anomalies & tickets | Viewer+ |
| `POST` | `/api/machines` | Register new machine into fleet | Admin |
| `PUT` | `/api/machines/:id` | Update machine specs or thresholds | Engineer/Admin |
| `DELETE` | `/api/machines/:id` | Remove machine from fleet | Admin |
| `POST` | `/api/telemetry` | Ingest single sensor reading | Public / Sensor |
| `POST` | `/api/telemetry/batch` | Ingest batch sensor telemetry | Public / Sensor |
| `GET` | `/api/telemetry` | Query time-series telemetry with range | Viewer+ |
| `GET` | `/api/telemetry/latest` | Latest telemetry for all fleet machines | Viewer+ |
| `GET` | `/api/telemetry/export/csv` | Download filtered raw readings as CSV | Viewer+ |
| `GET` | `/api/anomalies` | Query flagged statistical anomalies | Viewer+ |
| `PATCH` | `/api/anomalies/:id/status`| Acknowledge or resolve anomaly | Engineer/Admin |
| `GET` | `/api/tickets` | Query maintenance work orders | Viewer+ |
| `POST` | `/api/tickets` | Create maintenance ticket | Engineer/Admin |
| `PUT` | `/api/tickets/:id` | Update status, assign engineer, add notes | Engineer/Admin |
| `POST` | `/api/chat` | AI Grounded Diagnostic Chat Query | Optional JWT |

---

## 🎓 Academic Viva & Presentation Highlights

When demonstrating this project:
1. **Show the Live Feedback Loop**: Point out how running `run_pipeline.py` starts streaming telemetry points into MongoDB, causing live updates on the React Dashboard every 5 seconds without manual page refreshes.
2. **Demonstrate Explainable Anomaly Detection**: Highlight that alerts do not simply say "error", but explicitly state the sensor, mean baseline, standard deviation Z-score, and mechanical hypothesis (e.g. bearing race spall vs hydraulic leakage).
3. **Show RUL Degradation**: Explain the stress decay formula incorporating sensor stress ratios, historical anomaly frequency, and operating hours.
4. **Trigger AI Diagnostics**: Ask the chat assistant *"Why is Machine 3 flagged?"* and show how it cites the exact live readings and open tickets from MongoDB rather than hallucinating generic responses.
5. **Demonstrate Role Permissions**: Log in as **Viewer** (read-only), then switch to **Engineer** or **Admin** to show threshold editing and work order issuance.
