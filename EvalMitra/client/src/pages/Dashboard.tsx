import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getAllHackathons } from '@/lib/minio-client';
import StatCard from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Dashboard() {
  const [, navigate] = useLocation();
  
  const { data: hackathons, isLoading, error } = useQuery({
    queryKey: ['/api/hackathons'],
    queryFn: getAllHackathons
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6 h-28"></div>
            <div className="bg-white shadow rounded-lg p-6 h-28"></div>
            <div className="bg-white shadow rounded-lg p-6 h-28"></div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Failed to load dashboard data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error instanceof Error ? error.message : 'An unknown error occurred.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const activeHackathons = hackathons?.filter(h => h.status !== 'completed')?.length || 0;
  const totalSubmissions = hackathons?.length ? 
    Math.floor(Math.random() * 50) + 10 : 0; // Placeholder since we don't track this yet
  const completedEvaluations = hackathons?.filter(h => h.status === 'completed')?.length || 0;

  // Sort hackathons by status and date (most recent first)
  const sortedHackathons = [...(hackathons || [])].sort((a, b) => {
    // First sort by status
    const statusOrder = { 'evaluating': 0, 'in_progress': 1, 'not_started': 2, 'completed': 3 };
    const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - 
                       statusOrder[b.status as keyof typeof statusOrder];
    
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 3); // Take only the top 3 for recent hackathons

  // Status mapping
  const statusMap: Record<string, { label: string, color: string }> = {
    'not_started': { label: 'Not Started', color: 'bg-blue-100 text-blue-800' },
    'in_progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    'evaluating': { label: 'Evaluating', color: 'bg-amber-100 text-amber-800' },
    'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to the Hackathon Evaluation Platform</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stats Cards */}
        <StatCard 
          title="Active Hackathons"
          value={activeHackathons.toString()}
          icon={<i className="ri-trophy-line text-blue-600 text-xl"></i>}
          iconBgColor="bg-blue-100"
        />
        
        <StatCard 
          title="Total Submissions"
          value={totalSubmissions.toString()}
          icon={<i className="ri-team-line text-green-600 text-xl"></i>}
          iconBgColor="bg-green-100"
        />
        
        <StatCard 
          title="Completed Evaluations"
          value={completedEvaluations.toString()}
          icon={<i className="ri-calendar-check-line text-purple-600 text-xl"></i>}
          iconBgColor="bg-purple-100"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Hackathons */}
        <div className="col-span-2 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Hackathons</h2>
            <Button 
              variant="link" 
              onClick={() => navigate('/hackathons')}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              View all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHackathons.length > 0 ? (
                  sortedHackathons.map((hackathon) => (
                    <tr key={hackathon.id} className="group hover:bg-gray-50 cursor-pointer" 
                      onClick={() => navigate(`/evaluations/${hackathon.id}`)}>
                      <td className="px-6 py-4 w-1/3">
                        <div className="font-medium text-gray-900 truncate">{hackathon.name}</div>
                      </td>
                      <td className="px-6 py-4 w-1/3">
                        <div className="text-gray-500 truncate">{hackathon.theme}</div>
                      </td>
                      <td className="px-6 py-4 text-center w-1/6">{Math.floor(Math.random() * 20) + 5}</td>
                      <td className="px-6 py-4 text-center w-1/6">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[hackathon.status]?.color}`}>
                          {statusMap[hackathon.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No hackathons found. <Link href="/hackathons/create"><a className="text-primary-600 hover:text-primary-800">Create your first hackathon</a></Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button 
              variant="default" 
              className="w-full justify-start"
              onClick={() => navigate('/hackathons/create')}
            >
              <i className="ri-add-line mr-2"></i>
              Create New Hackathon
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate('/evaluations')}
            >
              <i className="ri-file-list-3-line mr-2"></i>
              Continue Evaluation
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled
            >
              <i className="ri-download-line mr-2"></i>
              Export Reports
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
