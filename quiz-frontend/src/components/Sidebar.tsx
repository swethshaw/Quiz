import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Users,
  BarChart,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Layers,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCohort } from '../context/CohortContext';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { activeCohort, setActiveCohort, cohortData } = useCohort(); 
  const { logout } = useUser();
  const cohorts = Object.keys(cohortData);

  const navLinks = [
    { name: "Learning", path: "/", icon: <BookOpen size={20} /> },
    { name: "Peer Quiz", path: "/peer", icon: <Users size={20} /> },
    { name: "Results", path: "/results", icon: <BarChart size={20} /> },
    { name: "Help", path: "/help", icon: <HelpCircle size={20} /> },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 z-50 h-screen w-64 flex flex-col 
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">
              Q
            </div>
            QuizMaster
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)} 
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }
              `}
            >
              {link.icon}
              {link.name}
            </NavLink>
          ))}

          <div className="py-4">
            <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <div className="px-4 mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Layers size={14} />
            Cohorts
          </div>
          
          <div className="space-y-1">
            {cohorts.length === 0 && (
              <p className="px-4 py-2 text-xs text-slate-400 font-medium">Loading topics...</p>
            )}
            {cohorts.map((cohort) => (
              <button
                key={cohort}
                onClick={() => {
                  setActiveCohort(cohort); 
                  setIsOpen(false); 
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeCohort === cohort
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {cohort}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme} 
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-bold transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}