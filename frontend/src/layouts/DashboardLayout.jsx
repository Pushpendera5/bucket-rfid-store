import React from 'react';
import { useSelector } from 'react-redux';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const DashboardLayout = ({ children }) => {
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ background: '#f4f6f8' }}>
      <Sidebar />
      <div className={`flex min-h-0 flex-col flex-1 transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-[52px]'}`}>
        <Topbar />
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4" style={{ background: '#f4f6f8' }}>
          <div className="mx-auto w-full max-w-[1440px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
