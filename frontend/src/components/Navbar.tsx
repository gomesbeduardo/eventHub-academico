import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface NavbarProps {
  backTo?: string;
  showDashboard?: boolean;
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar({ backTo, showDashboard }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="glass w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
              aria-label="Voltar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
              <span className="text-white text-[10px] font-bold tracking-wider">EH</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200 tracking-tight">EventHub</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden md:block text-sm text-slate-500 dark:text-slate-400 mr-1 truncate max-w-[140px]">
              {user.name}
            </span>
          )}

          {showDashboard && (
            <button
              onClick={() => navigate("/dashboard")}
              className="glass hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Dashboard
            </button>
          )}

          <button
            onClick={toggle}
            className="glass w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 transition-all cursor-pointer"
            aria-label={dark ? "Modo claro" : "Modo escuro"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={logout}
            className="glass px-3 py-1.5 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-rose-50/80 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
