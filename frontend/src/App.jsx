import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { HomePageRuntimeFixes } from "./pages/HomePageRuntimeFixes.jsx";
import { CourseMobileRuntimePolish } from "./pages/CourseMobileRuntimePolish.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HomePageRuntimeFixes />
        <CourseMobileRuntimePolish />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
