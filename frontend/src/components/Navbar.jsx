import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, History, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path
      ? 'border-emerald-500 text-slate-900 font-semibold'
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white p-2 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">DocGen Pro</span>
            </Link>
          </div>
          
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm gap-2 transition-colors ${isActive('/')}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/history"
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm gap-2 transition-colors ${isActive('/history')}`}
            >
              <History className="w-4 h-4" />
              History Log
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
