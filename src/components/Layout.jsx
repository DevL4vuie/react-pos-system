import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MonitorSmartphone, Package, FileText, LogOut, Store, BarChart3, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', name: 'POS Terminal', icon: MonitorSmartphone },
    { path: '/products', name: 'Inventory', icon: Package },
    { path: '/analytics', name: 'Analytics', icon: BarChart3 },
    { path: '/sales', name: 'Sales History', icon: FileText },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 flex items-center gap-3 border-b dark:border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Store className="text-white" size={20} />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Gemma & Leo Store</span>
            <p className="text-xs text-gray-500">by Loui</p>
          </div>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-semibold shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm sm:text-base">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t dark:border-gray-700">
          <div className="mb-3 sm:mb-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            {currentUser?.email}
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 sm:px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-sm sm:text-base"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}