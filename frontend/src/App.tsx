import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventsPage from "./pages/EventsPage";
import DashboardPage from "./pages/DashboardPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-56 -right-56 w-[600px] h-[600px] rounded-full bg-stone-300/18 dark:bg-stone-600/10 blur-[120px]" />
        <div className="absolute -bottom-56 -left-56 w-[600px] h-[600px] rounded-full bg-zinc-300/18 dark:bg-zinc-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full bg-slate-200/15 dark:bg-slate-500/8 blur-[80px]" />
      </div>

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
