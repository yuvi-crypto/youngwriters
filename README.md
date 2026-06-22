# ✍️ Young Writers Platform

A safe, judgment-free storytelling, essay, opinion, and poetry platform designed for children aged 5–17. This platform is built to encourage creative risk-taking while nurturing structural literacy and perspective-taking. It includes positive-only community reviews, age-appropriate AI evaluations, verified parental controls, and teacher dashboards.

---

## 🚀 Technology Stack

* **Frontend**: React (Vite) styled with Vanilla CSS + Framer Motion for premium, smooth micro-animations.
* **Backend API**: Node.js + Express, configured to run locally or as a Vercel Serverless Function.
* **Database & Auth**: Supabase (PostgreSQL Cloud) + Row Level Security (RLS) policies for strict data privacy.
* **AI Engine**: Gemini AI (`gemini-2.5-flash`) for structural, non-punitive writing feedback, writing prompts, and scaffolding templates.

---

## 🗂️ Project Directory Layout

```
├── web/                           # Combined React app and Express backend
│   ├── src/                       # React frontend source
│   │   ├── components/            # UI components (Evaluation cards, Navbar, etc.)
│   │   ├── pages/                 # UI screens (Write, Lab, Contests, dashboards)
│   │   │   └── teacher/           # Teacher-specific screens and portals
│   │   ├── services/              # AI and third-party APIs (evaluationService.js)
│   │   └── App.jsx                # Routing & Auth Sync state machine
│   ├── server/                    # Node.js + Express backend API
│   │   ├── middleware/            # Auth and role verification middleware
│   │   └── server.js              # Server entry point & API endpoints
│   ├── vercel.json                # Serverless deployment configuration
│   └── package.json               # Dependencies and runner scripts
│
├── docs/                          # Rubrics & internal documentation
│   └── literacy_rubric.md         # Internal 4-level human review rubric
│
├── n8n/                           # Background automation scripts
│   └── README.md                  # Streaks, parent digests, and alert webhooks
│
├── supabase_complete_schema.sql   # Unified schema & initial DB configurations
├── supabase_seed_users.sql        # Fixed test credentials & profiles
└── supabase_migration_v4.sql      # RLS policies & auth trigger additions
```

---

## 🔑 Environment Variables Setup

Create a `.env` file inside the `web/` directory matching the layout in [web/.env.example](file:///c:/Users/yuvaraj/Desktop/projects/youngwriters/web/.env.example):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# Server-Side Configuration (Optional for Local Backend API)
# Required to bypass RLS in the Express server to manage child profiles and reset passwords
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini AI Configuration
# Get a free key at https://aistudio.google.com/
VITE_GEMINI_API_KEY=your-gemini-api-key
```

---

## ⚙️ Supabase Database Provisioning

1. Run the [supabase_complete_schema.sql](file:///c:/Users/yuvaraj/Desktop/projects/youngwriters/supabase_complete_schema.sql) scripts in the **Supabase SQL Editor** to initialize the database tables, relations, triggers, and initial contest data.
2. Run the [supabase_seed_users.sql](file:///c:/Users/yuvaraj/Desktop/projects/youngwriters/supabase_seed_users.sql) script to provision default login credentials for local testing.
3. Run the [supabase_migration_v4.sql](file:///c:/Users/yuvaraj/Desktop/projects/youngwriters/supabase_migration_v4.sql) script to register the latest parent dashboard Row Level Security (RLS) policies and student auto-confirmation functions.

---

## 🧪 Test Accounts (Seed Data)

Use these accounts to test the different user dashboards after applying `supabase_seed_users.sql`. The password for all accounts is **`password123`**.

| Role | Username / Email | Features to Test |
|---|---|---|
| **Teacher** | `teacher@yw.local` | Register students, assign prompts, create classrooms, view dashboard. |
| **Parent** | `parent@yw.local` | Reset child password, view child pieces, view skill averages, assign practice tasks. |
| **Student** | `student_charlie@yw-students.local` | View assignments, write stories/poems, play Lab deduction puzzles. |

---

## 💻 Running the App Locally

### 1. Install Dependencies
Navigate to the `web` folder and install:
```bash
cd web
npm install
```

### 2. Launch Frontend & Backend Server
Run Vite frontend and Node.js server concurrently:
* To run the **frontend** in development mode:
  ```bash
  npm run dev
  ```
* To run the **backend Express API**:
  ```bash
  npm run server
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ Trust, Safety & Compliance

* **Age-appropriate moderation**: System is wired to moderate content dynamically based on student age, using distinct rulesets for fiction vs. opinion content.
* **Positive-only reviews**: Community features exclude downvotes, comments are approved through a positive-only validation step, and RLS secures student feeds.
* **DPDP Act (India) Alignment**: Account settings default to private, student accounts are auto-confirmed by teachers/parents, and parental consent is isolated per contest.
