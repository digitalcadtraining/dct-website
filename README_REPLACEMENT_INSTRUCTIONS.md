# DCT Deploy-Ready Replacement Pack

Generated for `digitalcadtraining/dct-website`.

## What this pack fixes

1. Removes dummy-data usage from:
   - `src/pages/admin/AdminDashboard.jsx`
   - `src/pages/admin/AdminStudents.jsx`
   - `src/pages/admin/AdminQueries.jsx`
   - `src/pages/student/AssignmentsPages.jsx`
   - `src/pages/tutor/TutorAssignments.jsx`

2. Fixes frontend API service:
   - Adds FormData support for assignment upload.
   - Adds assignment submit/review APIs.
   - Adds tutor submissions API.
   - Adds query answer API.
   - Adds `mediaUrl()` helper for uploaded files.

3. Adds missing backend route:
   - `GET /api/v1/assignments/tutor/submissions`

## Replace these files

Copy these files into your project root:

```txt
src/services/api.js
src/pages/admin/AdminDashboard.jsx
src/pages/admin/AdminStudents.jsx
src/pages/admin/AdminQueries.jsx
src/pages/student/AssignmentsPages.jsx
src/pages/student/MyQueriesPage.jsx
src/pages/tutor/TutorAssignments.jsx
backend/src/controllers/session.controller.js
backend/src/routes/assignment.routes.js
```

Your repo also has a duplicate `frontend/src`. If you run frontend from the `frontend` folder, copy the same frontend files there also.

## Commands after replacing

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

In another terminal:

```bash
npm install
npm run dev
```

## Important remaining deployment items

- Clean `README.md` merge conflict markers.
- Do not push `.env`.
- For production assignment uploads, replace local `multer({ dest: "uploads/" })` with Cloudinary/S3 storage. Current uploads are local and can be lost on Render/Railway free deployments.
- Add proper password reset UI later: Admin → Users → Reset Password.
