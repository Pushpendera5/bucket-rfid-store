import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, toggleDarkMode } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import { PanelLeft, Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';

export default function Topbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { darkMode } = useSelector((s) => s.ui);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="flex h-11 shrink-0 items-center justify-between bg-white px-4 z-40" style={{ borderBottom: '1px solid #e8eaed' }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Toggle sidebar"
        >
          <PanelLeft size={15} />
        </button>
        <div className="hidden h-4 w-px bg-gray-100 dark:bg-gray-800 md:block" />
        <span className="hidden text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-wide md:block">
          Pushpendra Store
          <span className="ml-1.5 font-normal text-gray-300 dark:text-gray-600">/</span>
          <span className="ml-1.5 font-bold text-gray-900 dark:text-white">Management</span>
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
        </button>

        <button className="relative rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <Bell size={14} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ring-1 ring-white" style={{ background: '#0d9488' }} />
        </button>

        <div className="ml-1 h-5 w-px bg-gray-100 dark:bg-gray-800" />

        <div className="ml-1 flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors group">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[9px] font-black shadow-sm shrink-0" style={{ background: '#0d9488', boxShadow: '0 2px 6px rgba(13,148,136,0.3)' }}>
            {initials}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">{user?.fullName || 'Administrator'}</p>
            <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight">{user?.role || 'Admin'}</p>
          </div>
          <ChevronDown size={11} className="text-gray-300 dark:text-gray-600 hidden md:block group-hover:text-gray-500 transition-colors" />
        </div>

        <button
          onClick={() => dispatch(logout())}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
