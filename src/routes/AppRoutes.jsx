import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";

import HomePage               from "../pages/HomePage.jsx";
import PlasticProductDesignPage from "../pages/courses/PlasticProductDesign.jsx";
import BIWProductDesignPage     from "../pages/courses/BIWProductDesign.jsx";
import UGNXProductDesignPage    from "../pages/courses/UGNXProductDesign.jsx";

import AdminLoginPage         from "../pages/auth/AdminLoginPage.jsx";
import LoginPage              from "../pages/auth/LoginPage.jsx";
import RegisterPage           from "../pages/auth/RegisterPage.jsx";
import TutorRegisterPage      from "../pages/auth/TutorRegisterPage.jsx";
import TutorRegistrationPage  from "../pages/auth/TutorRegistrationPage.jsx";

import { AllSessionsPage, UpcomingSessionsPage, CompletedSessionsPage } from "../pages/student/SessionsPages.jsx";
import { AllAssignmentsPage, AssignmentFeedbackPage }                   from "../pages/student/AssignmentsPages.jsx";
import MyCourses      from "../pages/student/MyCourses.jsx";
import MyQueriesPage  from "../pages/student/MyQueriesPage.jsx";
import SyllabusPage   from "../pages/student/SyllabusPage.jsx";
import StudentDashboard from "../pages/student/StudentDashboard.jsx";

import MyBatches          from "../pages/tutor/MyBatches.jsx";
import TutorAssignments   from "../pages/tutor/TutorAssignments.jsx";
import TutorSessionsPage  from "../pages/tutor/TutorSessions.jsx";
import TutorQueriesPage   from "../pages/tutor/TutorQueriesPage.jsx";

import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import AdminTutors    from "../pages/admin/AdminTutors.jsx";
import AdminStudents  from "../pages/admin/AdminStudents.jsx";
import AdminBatches   from "../pages/admin/AdminBatches.jsx";
import AdminQueries   from "../pages/admin/AdminQueries.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />

      {/* Course Pages */}
      <Route path="/courses/plastic-product-design" element={<PlasticProductDesignPage />} />
      <Route path="/courses/biw-product-design"     element={<BIWProductDesignPage />} />
      <Route path="/courses/ug-nx-product-design"   element={<UGNXProductDesignPage />} />

      {/* Auth */}
      <Route path="/auth/login"          element={<LoginPage />} />
      <Route path="/auth/register"       element={<RegisterPage />} />
      <Route path="/auth/register/tutor" element={<TutorRegisterPage />} />
      <Route path="/auth/tutor-register" element={<TutorRegistrationPage />} />
      <Route path="/admin/login"         element={<AdminLoginPage />} />

      {/* Student */}
      <Route path="/student/dashboard"            element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/courses"              element={<ProtectedRoute roles={["student"]}><MyCourses /></ProtectedRoute>} />
      <Route path="/student/sessions/all"         element={<ProtectedRoute roles={["student"]}><AllSessionsPage /></ProtectedRoute>} />
      <Route path="/student/sessions/upcoming"    element={<ProtectedRoute roles={["student"]}><UpcomingSessionsPage /></ProtectedRoute>} />
      <Route path="/student/sessions/completed"   element={<ProtectedRoute roles={["student"]}><CompletedSessionsPage /></ProtectedRoute>} />
      <Route path="/student/assignments/all"      element={<ProtectedRoute roles={["student"]}><AllAssignmentsPage /></ProtectedRoute>} />
      <Route path="/student/assignments/feedback" element={<ProtectedRoute roles={["student"]}><AssignmentFeedbackPage /></ProtectedRoute>} />
      <Route path="/student/queries"              element={<ProtectedRoute roles={["student"]}><MyQueriesPage /></ProtectedRoute>} />
      <Route path="/student/syllabus"             element={<ProtectedRoute roles={["student"]}><SyllabusPage /></ProtectedRoute>} />

      {/* Tutor — dashboard redirects to batches (same content, no duplication) */}
      <Route path="/tutor/dashboard"                    element={<Navigate to="/tutor/batches" replace />} />
      <Route path="/tutor/batches"                      element={<ProtectedRoute roles={["tutor"]}><MyBatches /></ProtectedRoute>} />
      <Route path="/tutor/batches/:batchId/sessions"    element={<ProtectedRoute roles={["tutor"]}><TutorSessionsPage /></ProtectedRoute>} />
      <Route path="/tutor/assignments"                  element={<ProtectedRoute roles={["tutor"]}><TutorAssignments /></ProtectedRoute>} />
      <Route path="/tutor/queries"                      element={<ProtectedRoute roles={["tutor"]}><TutorQueriesPage /></ProtectedRoute>} />
      <Route path="/tutor/sessions/all"                 element={<ProtectedRoute roles={["tutor"]}><TutorSessionsPage /></ProtectedRoute>} />
      <Route path="/tutor/sessions/upcoming"            element={<ProtectedRoute roles={["tutor"]}><TutorSessionsPage /></ProtectedRoute>} />
      <Route path="/tutor/sessions/completed"           element={<ProtectedRoute roles={["tutor"]}><TutorSessionsPage /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/tutors"    element={<ProtectedRoute roles={["admin"]}><AdminTutors /></ProtectedRoute>} />
      <Route path="/admin/students"  element={<ProtectedRoute roles={["admin"]}><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/batches"   element={<ProtectedRoute roles={["admin"]}><AdminBatches /></ProtectedRoute>} />
      <Route path="/admin/queries"   element={<ProtectedRoute roles={["admin"]}><AdminQueries /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}