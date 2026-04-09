<<<<<<< HEAD
# DigitalCAD Training – LMS Platform v2

## 🚀 Setup
```bash
npm install
npm run dev        # http://localhost:5173/dct/
npm run build      # outputs to /dist
```

## 📁 Folder Structure
```
src/
├── styles/         index.css
├── constants/      dummyData.js
├── context/        AuthContext.jsx
├── services/       api.js
├── routes/         AppRoutes.jsx, ProtectedRoute.jsx
├── components/
│   ├── ui/         Button, Input, Textarea, Modal, Badge, Avatar, ProgressBar, ChipBtn, PageWrapper
│   ├── layout/     AppShell, Sidebar, Header
│   └── shared/     HeroBanner, SessionCard, widgets (Calendar, Attendance, Completion, Refer), AuthHero
└── pages/
    ├── auth/       LoginPage, RegisterPage
    ├── student/    Dashboard, Sessions (All/Upcoming/Completed), Assignments (All/Feedback), MyCourses, MyQueries
    ├── tutor/      MyBatches, TutorAssignments, TutorSessions
    └── admin/      AdminDashboard
```

## 🎨 Brand Colors
- Dark:      #1F1A17
- Navy:      #003C6E
- Blue:      #024981
- Primary:   #007BBF
- Gray:      #6A6B6D
- LightGray: #7E7F81
- Gradient:  linear-gradient(135deg, #003C6E → #007BBF)

## 🔑 Demo Login
- Student: click Student → Sign In
- Tutor:   click Tutor   → Sign In
- Admin:   click Admin   → Sign In

## 🌐 Hostinger Deploy
1. `npm run build`
2. Upload `/dist` contents to `public_html/dct/`
3. Upload `.htaccess` to `public_html/dct/`
=======
# dct-website
Official website and landing pages for Digital CAD Training. Includes automotive plastic product design course, webinar funnels, and FOMO-based offer system built using React.
>>>>>>> e0135a99844b7d4c7ee815a76f3a6826b1774994
