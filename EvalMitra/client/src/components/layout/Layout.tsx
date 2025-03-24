import React from 'react';
import Sidebar from './Sidebar';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-screen lg:pl-64">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 lg:hidden rounded-md text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open sidebar</span>
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="relative" data-state="closed">
                <button className="p-1 flex text-sm rounded-full focus:outline-none">
                  <span className="sr-only">Open user menu</span>
                  <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
                    TE
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
