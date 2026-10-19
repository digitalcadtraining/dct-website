# DCT English Confidence Builder — deployment notes

This feature lives on the branch `chatgpt/english-confidence-90day-20261020`. Merge it into `main` after review.

## What it adds
- 90 sequential 15-minute practice days using 30 foundational concepts, each with Learn/Practise/Review days.
- Three scored MCQs daily, clear feedback, retries, stars and seven milestones.
- Five HR model-answer typing exercises in the last 15 days.
- Optional "I already know English well" self-assessment. It does not count as a passed test.
- Student progress stored in two new Prisma tables; admin summary and weak-concept report.
- Independent of CATIA prerequisite completion and existing video progress.

## Files
- `backend/prisma/schema.prisma`
- `backend/src/data/englishConfidence.js`
- `backend/src/controllers/englishConfidence.controller.js`
- `backend/src/routes/englishConfidence.routes.js`
- `backend/src/routes/index.js`
- `frontend/src/services/api.js`
- `frontend/src/pages/student/EnglishConfidencePage.jsx`
- `frontend/src/pages/student/PrerequisitesPage.jsx`
- `frontend/src/pages/admin/EnglishConfidenceAdminReport.jsx`
- `frontend/src/pages/admin/AdminPrerequisiteProgress.jsx`
- `frontend/src/routes/AppRoutes.jsx`

## Database migration REQUIRED before backend deployment
From `backend/` with the correct production database configuration, take a backup and apply the Prisma schema using the same migration approach already used for this project. If the project uses `prisma db push` (see the schema header), run `npx prisma db push`, then `npx prisma generate`. Avoid applying schema changes blindly to production; inspect the plan and back up first. Ensure Render's build process generates the Prisma client from the updated schema.

## Deployment
1. Merge or copy all listed files (not only the React page).
2. Apply the database schema change and generate the Prisma client.
3. Deploy the backend to Render.
4. Build and deploy the frontend to the actual website hosting provider.
5. Log in as a test student and open `/student/prerequisites/english-confidence`.
6. Submit day 1, refresh and confirm persisted score; retry; unlock day 2.
7. Test "already know English well" and verify admin report under Prerequisite Progress.
8. Test an existing CATIA prerequisite lesson to ensure it still works.

## Scoring notes
A day passes with 2/3 correct MCQs. Best score and retry count are persisted.
Typing accuracy is a rough bag-of-words match to the model answer, not an assessment of speaking, pronunciation, grammar equivalence or personalised interview quality. Only the five HR days currently have typing exercises. This is an introductory course, not a language proficiency certification.

## Implementation limitations
The 90-day plan intentionally revisits 30 core concepts three times. It does not include audio, microphone assessment, a timer or AI-based grading. The student can practise at their own pace and finish sooner than 90 calendar days.
