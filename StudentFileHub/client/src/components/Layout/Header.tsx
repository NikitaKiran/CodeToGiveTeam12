import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Student Submission Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Trupti@gmail.com</span>
            <button className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none">
              <span className="material-icons">account_circle</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
