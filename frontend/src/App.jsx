import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { HomePageRuntimeFixes } from "./pages/HomePageRuntimeFixes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HomePageRuntimeFixes />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
