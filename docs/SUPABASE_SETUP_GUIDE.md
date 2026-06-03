# DCT LMS Supabase PostgreSQL Setup Guide

This project already uses Prisma + PostgreSQL. Supabase is also PostgreSQL, so the migration is not a backend rewrite. The key change is replacing the Neon connection string with a Supabase PostgreSQL connection string.

## Files in this pack

Replace these files:

```txt
backend/prisma/schema.prisma
backend/src/config/db.js
backend/server.js
backend/package.json
```

Add these files:

```txt
backend/scripts/check-db.js
backend/.env.supabase.example
docs/SUPABASE_SETUP_GUIDE.md
```

## Step 1 - Create Supabase project

1. Open Supabase dashboard.
2. Create new project.
3. Choose closest region to India if available.
4. Save your database password safely.

## Step 2 - Get Supabase database URL

Go to:

```txt
Project Settings > Database > Connection string
```

For this Express backend, use the Session Pooler connection string with port `5432`.

It normally looks like:

```env
postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<REGION>.pooler.supabase.com:5432/postgres
```

Add SSL and connection limit:

```env
?sslmode=require&connection_limit=10
```

Final format:

```env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<REGION>.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=10"
DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<REGION>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Important: if your DB password contains special characters like `@`, `#`, `%`, `/`, encode them or reset the DB password to a simple strong password containing letters and numbers.

## Step 3 - Update backend/.env

Copy `backend/.env.supabase.example` content into your real `backend/.env`.

Replace:

```env
DATABASE_URL="..."
DIRECT_URL="..."
```

Keep your existing JWT, OTP and admin variables.

Never push `.env` to GitHub.

## Step 4 - Install and generate Prisma

```powershell
cd D:\LandingPage\dct-project\backend
npm install
npx prisma generate
```

## Step 5 - Create tables in Supabase

For a fresh Supabase database:

```powershell
npx prisma db push
```

Then seed admin and courses:

```powershell
npm run db:seed
```

Check DB:

```powershell
npm run db:check
```

## Step 6 - Start backend

```powershell
npm run dev
```

You should see:

```txt
✅ Database connected
🚀 DCT Server running on http://localhost:5000
```

Check in browser:

```txt
http://localhost:5000/health/db
```

## Step 7 - Start frontend

```powershell
cd D:\LandingPage\dct-project\frontend
npm run dev
```

Open:

```txt
http://localhost:5173/dct/
```

## Optional - migrate old Neon data

If old Neon data is important, do not run only seed. Export data from Neon and import into Supabase using pg_dump/psql or Supabase import tools. If the old Neon database is unstable and data is not important, start clean with `db push` + `db seed`.

## Quick troubleshooting

### Error: P1001 Can't reach database server

Check:

```txt
DATABASE_URL is copied correctly
password is correct
sslmode=require is present
internet is active
Supabase project is active
```

### Error: Authentication failed

Reset DB password in Supabase and update `.env`.

### Error: Environment variable not found: DIRECT_URL

Add `DIRECT_URL` in backend/.env. For local setup, you can set it to the same value as DATABASE_URL.

### Error: tables do not exist

Run:

```powershell
npx prisma db push
npm run db:seed
```
