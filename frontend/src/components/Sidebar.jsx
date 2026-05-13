import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, PackageSearch, Truck, FileSpreadsheet,
  ArrowLeftRight, BarChart4, Users, Shield, Store, ChevronRight,
} from 'lucide-react';

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Products',
    items: [
      { id: 'inventory', label: 'Products', path: '/inventory', icon: PackageSearch },
      { id: 'suppliers', label: 'Suppliers', path: '/vendor', icon: Truck },
    ],
  },
  {
    group: 'Sales',
    items: [
      { id: 'pos', label: 'Billing Counter', path: '/pos', icon: Store },
    ],
  },
  {
    group: 'Procurement',
    items: [
      { id: 'po', label: 'Purchase Orders', path: '/po', icon: FileSpreadsheet },
      { id: 'grn', label: 'Goods Receipt', path: '/grn', icon: ArrowLeftRight },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { id: 'reports', label: 'Reports', path: '/reports', icon: BarChart4 },
    ],
  },
  {
    group: 'Admin',
    items: [
      { id: 'administration', label: 'Users', path: '/users', icon: Users },
      { id: 'roles', label: 'Roles', path: '/roles', icon: Shield },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user } = useSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState({});

  const isAdmin = user?.role === 'Admin' || user?.role === 'Administrator';

  const perms = useMemo(() => {
    if (!user?.permissions) return [];
    if (Array.isArray(user.permissions)) return user.permissions;
    try { return JSON.parse(user.permissions) || []; } catch { return []; }
  }, [user]);

  const nav = useMemo(() => NAV.map((g) => ({
    ...g,
    items: isAdmin ? g.items : g.items.filter((i) => perms.includes(i.id)),
  })).filter((g) => g.items.length > 0), [isAdmin, perms]);

  const toggle = (g) => setCollapsed((prev) => ({ ...prev, [g]: !prev[g] }));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-[52px]'}`}
      style={{ borderRight: '1px solid #e8eaed' }}
    >
      {/* Logo */}
      <div
        className={`flex h-11 shrink-0 items-center ${sidebarOpen ? 'px-4 gap-2.5' : 'justify-center'}`}
        style={{ borderBottom: '1px solid #f1f3f4' }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white text-[10px] font-black tracking-tight"
          style={{ background: '#0d9488', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }}
        >
          PS
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-[11px] font-bold leading-tight text-gray-900 truncate">Pushpendra Store</p>
            <p className="text-[9px] leading-tight font-medium text-gray-400 truncate">Smart Retail ERP</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        {nav.map((group) => (
          <div key={group.group} className="mb-1">
            {sidebarOpen ? (
              <button
                onClick={() => toggle(group.group)}
                className="flex w-full items-center justify-between px-4 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
              >
                {group.group}
                <ChevronRight
                  size={10}
                  className={`transition-transform duration-150 ${collapsed[group.group] ? '' : 'rotate-90'}`}
                />
              </button>
            ) : (
              <div className="my-1.5 mx-3 h-px bg-gray-100" />
            )}

            {(!collapsed[group.group] || !sidebarOpen) && (
              <div className="mt-0.5 space-y-px px-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    title={!sidebarOpen ? item.label : undefined}
                    className="block"
                  >
                    {({ isActive }) => (
                      <span
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[11px] font-medium transition-all ${!sidebarOpen ? 'justify-center' : ''} ${
                          isActive
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                        style={isActive ? { boxShadow: 'inset 2px 0 0 #0d9488' } : {}}
                      >
                        <item.icon
                          size={14}
                          className="shrink-0"
                          style={isActive ? { color: '#0d9488' } : {}}
                        />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`shrink-0 px-3 py-2.5 ${sidebarOpen ? '' : 'flex justify-center'}`}
        style={{ borderTop: '1px solid #f1f3f4' }}
      >
        {sidebarOpen ? (
          <p className="text-[9px] font-semibold text-gray-300 tracking-wide">
            &copy; {new Date().getFullYear()} Wayin Fotech Solutions
          </p>
        ) : (
          <div
            className="h-5 w-5 rounded flex items-center justify-center text-[8px] font-black text-white"
            style={{ background: '#0d9488' }}
          >W</div>
        )}
      </div>
    </aside>
  );
}
