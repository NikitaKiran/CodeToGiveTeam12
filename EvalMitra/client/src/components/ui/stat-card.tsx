import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

export default function StatCard({ title, value, icon, iconBgColor = 'bg-blue-100' }: StatCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-5 flex items-center h-full">
      <div className={`rounded-full ${iconBgColor} p-3 mr-4 flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-500 text-sm truncate">{title}</p>
        <p className="text-xl font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
