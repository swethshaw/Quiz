import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen, Users, BarChart3, HelpCircle, LogOut, Sun, Moon, Monitor,
  LayoutDashboard, ChevronDown, Bell, UserCircle, X, Trophy, History,
  GraduationCap
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCohort } from '../context/CohortContext';
import { useUser } from '../context/UserContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { theme, setTheme } = useTheme();
  const { activeCohort, setActiveCohort, cohortData } = useCohort(); 
  const { user, logout } = useUser();
  
  const [openMenus, setOpenMenus] = useState({ lms: false, quiz: false });
  const [hasUnread, setHasUnread] = useState(false);

  // --- NEW: Fetch Notification Status ---
  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/api/notifications/user/${user._id}`);
        const data = await res.json();
        
        if (data.success) {
          // Check if any notification in the current cohort is unread
          const unreadExists = data.data.some(
            (n: any) => !n.isRead && n.cohort === activeCohort
          );
          setHasUnread(unreadExists);
        }
      } catch (err) {
        console.error("Failed to check notifications");
      }
    };

    checkUnreadNotifications();
  }, [user, activeCohort]); // Re-runs if the user switches cohorts

  // Improved visibility classes: explicitly defining dark text colors
  const navLinkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200
    ${isActive 
      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 flex flex-col 
        bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={20} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              PeerLearning
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          
          <div className="space-y-1">
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">General</p>
            <NavLink to="/" className={navLinkClass}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
          </div>

          {/* LMS Section */}
          <div className="space-y-1">
            <button 
              onClick={() => setOpenMenus(p => ({...p, lms: !p.lms}))} 
              className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-blue-500 transition-colors"
            >
              Theory <ChevronDown size={14} className={`transition-transform duration-300 ${openMenus.lms ? "rotate-180" : ""}`} />
            </button>
            {openMenus.lms && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                <SubLink to="/courses" label="My Courses" icon={BookOpen} />
              </div>
            )}
          </div>

          {/* Quiz Section */}
          <div className="space-y-1">
            <button 
              onClick={() => setOpenMenus(p => ({...p, quiz: !p.quiz}))} 
              className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-blue-500 transition-colors"
            >
              Assessment <ChevronDown size={14} className={`transition-transform duration-300 ${openMenus.quiz ? "rotate-180" : ""}`} />
            </button>
            {openMenus.quiz && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                <SubLink to="/learning" label="Practice" icon={BarChart3} />
                <SubLink to="/peer-quiz" label="Peer Quiz" icon={Users} />
                <SubLink to="/results" label="My Results" icon={History} />
              </div>
            )}
          </div>

          {/* Social & Help */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
            <NavLink to="/leaderboard" className={navLinkClass}>
              <Trophy size={20} /> Leaderboard
            </NavLink>
            
            {/* UPDATED NOTIFICATION LINK */}
            <NavLink to="/notifications" className={navLinkClass}>
              <div className="flex items-center gap-3 flex-1">
                <Bell size={20} /> Notifications
              </div>
              {hasUnread && (
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
            </NavLink>

            <NavLink to="/help" className={navLinkClass}>
              <HelpCircle size={20} /> Help Center
            </NavLink>
          </div>
        </nav>

        {/* Footer Area */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 space-y-4">
          
          {/* Profile Section */}
          <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || "Student"}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Cohort Select - Improved contrast */}
            <select 
              value={activeCohort} 
              onChange={(e) => setActiveCohort(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none ring-offset-white dark:ring-offset-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {Object.keys(cohortData).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* 3-State Theme Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 gap-1">
              <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} />
              <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} icon={Monitor} />
              <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} />
            </div>

            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut size={16} /> <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// SubLink with proper dark text visibility
const SubLink = ({ to, label, icon: Icon }: any) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
      ${isActive 
        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" 
        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40"}
    `}
  >
    <Icon size={16} /> {label}
  </NavLink>
);

const ThemeButton = ({ active, onClick, icon: Icon }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex justify-center py-1.5 rounded-lg transition-all ${
      active 
        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
        : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
    }`}
  >
    <Icon size={14} />
  </button>
);