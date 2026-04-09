<<<<<<< HEAD
# DigitalCAD Training — Full Stack Project

## Tech Stack

| Layer       | Technology                          | Why                                          |
|-------------|-------------------------------------|----------------------------------------------|
| Frontend    | React + Vite + TailwindCSS          | Fast, component-based, already built         |
| Animations  | Framer Motion                       | Production-grade animations                  |
| Backend     | Node.js + Express                   | Fast, simple, huge ecosystem                 |
| Database    | PostgreSQL                          | Relational, handles 100+ concurrent easily   |
| ORM         | Prisma                              | Type-safe, auto-migrations, great DX         |
| Auth        | JWT (access 15min + refresh 7days)  | Stateless, secure, scalable                  |
| OTP         | MSG91 (India SMS) + console fallback| Most popular Indian SMS provider             |
| File Upload | Multer (local) → Cloudinary (prod)  | Simple upload, CDN delivery                  |

---

## Project Structure

```
dct-project/
├── backend/                  ← Node.js + Express API
│   ├── server.js             ← Entry point
│   ├── .env.example          ← Copy to .env and fill values
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma     ← Complete database schema
│   │   └── seed.js           ← Creates admin + 2 courses
│   └── src/
│       ├── config/
│       │   ├── db.js         ← Prisma client singleton
│       │   └── constants.js  ← App-wide constants
│       ├── middleware/
│       │   ├── auth.js       ← JWT verify + role guard
│       │   └── errorHandler.js
│       ├── controllers/
│       │   ├── auth.controller.js     ← Register, Login, OTP, Refresh
│       │   ├── course.controller.js   ← Course CRUD
│       │   ├── batch.controller.js    ← Batch create/manage
│       │   ├── session.controller.js  ← Sessions + Assignments + Queries
│       │   ├── tutor.controller.js    ← Tutor application submit
│       │   └── admin.controller.js    ← Admin panel operations
│       ├── routes/
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   ├── course.routes.js
│       │   ├── batch.routes.js
│       │   ├── session.routes.js
│       │   ├── assignment.routes.js
│       │   ├── query.routes.js
│       │   ├── tutor.routes.js
│       │   └── admin.routes.js
│       ├── services/
│       │   └── otp.service.js    ← MSG91 + dev console fallback
│       └── utils/
│           ├── response.js       ← Standardized API responses
│           └── helpers.js        ← OTP gen, slugify, pagination, etc.
│
└── frontend/                 ← React app (digilab-v2)
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx           ← Public homepage (/)
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx      ← Student + Tutor login
    │   │   │   ├── RegisterPage.jsx   ← Student registration + OTP
    │   │   │   ├── AdminLoginPage.jsx ← /admin/login (hidden)
    │   │   │   └── TutorRegistrationPage.jsx  ← 5-step tutor apply
    │   │   ├── student/               ← All student screens
    │   │   ├── tutor/                 ← All tutor screens
    │   │   └── admin/                 ← All admin screens
    │   └── routes/AppRoutes.jsx       ← All route definitions
    └── ...
```

---

## Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local or cloud: Neon, Supabase, Railway)
- npm or yarn

---

### Step 1: Database Setup (PostgreSQL)

**Option A — Local PostgreSQL:**
```bash
# Install PostgreSQL, then:
psql -U postgres
CREATE DATABASE dct_db;
\q
```

**Option B — Free Cloud (recommended for quick start):**
- Go to https://neon.tech (free tier)
- Create a project → copy the connection string
- Paste in backend `.env` as `DATABASE_URL`

---

### Step 2: Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL = your PostgreSQL connection string
#   JWT_ACCESS_SECRET = any long random string
#   JWT_REFRESH_SECRET = another long random string

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations (creates all tables)
npm run db:migrate
# Enter a name when prompted, e.g.: "init"

# 5. Seed database (creates admin account + 2 courses)
npm run db:seed

# 6. Start development server
npm run dev
# Server: http://localhost:5000
```

**Verify backend works:**
```
GET http://localhost:5000/health
→ { "success": true, "message": "DCT API is running" }

GET http://localhost:5000/api/v1/courses
→ Returns 2 courses (Plastic Product Design + BIW)
```

---

### Step 3: Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# App: http://localhost:5173/dct/
```

---

### Step 4: Connect Frontend to Backend

In `frontend/src/services/api.js`, set:
```js
const BASE_URL = "http://localhost:5000/api/v1";
```

Then replace all `// TODO: call API` comments in each auth/page file with real `fetch()` calls.

---

### Step 5: Production Build

```bash
# Backend (deploy to Railway / Render / DigitalOcean)
# Set NODE_ENV=production and all .env variables

# Frontend
cd frontend
npm run build
# Upload /dist contents to Hostinger public_html/dct/
```

---

## API Endpoints Reference

### Auth
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | /api/v1/auth/otp/send | Send OTP to phone | Public |
| POST | /api/v1/auth/otp/verify | Verify OTP, get phone_token | Public |
| POST | /api/v1/auth/register | Register student | Public (needs phone_token) |
| POST | /api/v1/auth/login | Student/Tutor login | Public |
| POST | /api/v1/auth/admin/login | Admin login | Public |
| POST | /api/v1/auth/refresh | Refresh access token | Public |
| POST | /api/v1/auth/logout | Logout | Public |
| GET  | /api/v1/auth/me | Get current user | Bearer token |

### Courses (Public)
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/v1/courses | List all active courses |
| GET | /api/v1/courses/:slug | Course details + batches |
| GET | /api/v1/courses/:id/batches | Batches for dropdown |
| POST | /api/v1/courses | Create course (Admin) |

### Tutor Application
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/v1/tutor-applications | Submit application |
| GET | /api/v1/tutor-applications/status?phone=xxx | Check status |

### Batches
| Method | URL | Auth |
|--------|-----|------|
| POST | /api/v1/batches | Tutor: create batch |
| GET | /api/v1/batches/mine | Tutor: my batches |
| GET | /api/v1/batches/enrolled | Student: enrolled courses |
| GET | /api/v1/batches/:id | Student/Tutor: batch details |

### Sessions, Assignments, Queries
| Method | URL | Auth |
|--------|-----|------|
| GET | /api/v1/sessions/batch/:id | Get sessions for batch |
| PATCH | /api/v1/sessions/:id | Tutor: update session |
| POST | /api/v1/assignments | Tutor: create assignment |
| GET | /api/v1/assignments/batch/:id | Student: view assignments |
| POST | /api/v1/assignments/:id/submit | Student: submit file |
| POST | /api/v1/queries | Student: ask question |
| PATCH | /api/v1/queries/:id/answer | Tutor: answer query |

### Admin
| Method | URL |
|--------|-----|
| GET | /api/v1/admin/stats |
| GET | /api/v1/admin/applications?status=PENDING |
| POST | /api/v1/admin/applications/:id/approve |
| POST | /api/v1/admin/applications/:id/reject |
| GET | /api/v1/admin/students |
| GET | /api/v1/admin/tutors |
| GET | /api/v1/admin/batches |
| GET | /api/v1/admin/queries |

---

## Key Business Logic Flows

### 1. Admin adds a Course
```
POST /api/v1/courses → Course in DB
→ Immediately shows in:
  - Homepage course cards
  - Student registration dropdown
  - Tutor application course selector
```

### 2. Tutor applies
```
Phone OTP verify → POST /api/v1/tutor-applications (with syllabus)
→ Admin reviews in /admin/tutors
→ POST /admin/applications/:id/approve
→ Tutor user created, temp password sent via SMS
→ Tutor can now login at /auth/login
```

### 3. Tutor creates a Batch
```
POST /api/v1/batches { course_id, start_date, end_date }
→ Name auto-generated: "Plastic Product Design - April 2025"
→ Syllabus sessions auto-copied from tutor's approved application
→ Batch shows in student registration dropdown for that course
```

### 4. Student registers
```
Select course → Select batch (with available seats) → Fill details
→ Phone OTP → POST /api/v1/auth/register
→ Enrollment created
→ Student sees: sessions list (from syllabus), assignments, syllabus page
  All data fetched via: Student → Enrollment → Batch → ScheduledSessions
```

---

## OTP in Development

No SMS credits needed during development. OTP prints to the **backend console**:

```
📱 OTP for 9876543210 [STUDENT_REGISTER]: 482913 (expires in 10 min)
```

To switch to real SMS: set `NODE_ENV=production` and fill MSG91 credentials in `.env`.

---

## Login URLs

| Role | URL | Notes |
|------|-----|-------|
| Student | /auth/login | Public, visible on homepage |
| Tutor | /auth/login | Same page, Tutor tab |
| Admin | **/admin/login** | Hidden — not linked from anywhere |

---

## Deployment Notes (Hostinger)

```bash
# Backend: use a VPS or deploy separately to Railway/Render (free tier)
# Frontend: npm run build → upload /dist to public_html/dct/

# The .htaccess file handles React Router SPA routing
# Already included in the frontend folder
```

---

## What You Need to Provide

1. **MSG91 Account** (msg91.com) — for real OTP SMS
2. **PostgreSQL Database** — Neon.tech free tier is easiest
3. **Cloudinary Account** (cloudinary.com) — for assignment file uploads
4. **Server for Backend** — Railway.app (free) or any VPS

That's it. Everything else is coded.
=======
# dct-website
Official website and landing pages for Digital CAD Training. Includes automotive plastic product design course, webinar funnels, and FOMO-based offer system built using React.
>>>>>>> e0135a99844b7d4c7ee815a76f3a6826b1774994
