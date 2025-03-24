import { Link, useLocation } from 'wouter';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  
  // Define navigation items
  const navigation = [
    { name: 'Dashboard', href: '/', icon: 'ri-dashboard-line' },
    { name: 'Hackathons', href: '/hackathons', icon: 'ri-trophy-line' },
    { name: 'Evaluations', href: '/evaluations', icon: 'ri-file-list-3-line' },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 
      transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 w-6 h-6">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="text-lg font-semibold text-gray-900">EvalPlatform</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="p-2 -mr-2 lg:hidden rounded-md text-gray-500 hover:bg-gray-100"
        >
          <span className="sr-only">Close sidebar</span>
          <svg 
            className="h-6 w-6" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="px-4 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== '/' && location.startsWith(item.href));
              
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)}
              >
                <a className={`
                  flex items-center w-full px-3 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}>
                  <i className={`${item.icon} mr-3 text-lg`}></i>
                  {item.name}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Add link to external stylesheet for Remix icons */}
      <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
    </div>
  );
}
