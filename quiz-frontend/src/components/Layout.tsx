import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu} from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="lg:ml-72 flex flex-col min-h-screen">
        <div className="lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-400"
            >
              <Menu size={24} />
            </button>
            <span className="font-black text-slate-900 dark:text-white">Peer Learning</span>
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}