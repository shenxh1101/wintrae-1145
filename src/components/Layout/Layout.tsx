import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  BookCopy,
  Library,
  Heart,
  BarChart3,
  BookMarked,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/library', label: '书库', icon: BookOpen },
  { path: '/borrow', label: '借阅', icon: BookCopy },
  { path: '/shelf', label: '书架', icon: Library },
  { path: '/wishlist', label: '愿望单', icon: Heart },
  { path: '/stats', label: '统计', icon: BarChart3 },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-paper-100">
      <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-gray-800">藏书阁</h1>
              <p className="text-xs text-gray-500">个人图书管理</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/library' && location.pathname === '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            © 2026 藏书阁
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
};
