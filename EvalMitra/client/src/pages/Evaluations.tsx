import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getAllHackathons } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function Evaluations() {
  const [, navigate] = useLocation();
  
  const { data: hackathons, isLoading, error } = useQuery({
    queryKey: ['/api/hackathons'],
    queryFn: getAllHackathons
  });
  
  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="p-4 animate-pulse space-y-8">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Failed to load evaluations
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
  
  // Filter hackathons by status
  const ongoingEvaluations = hackathons?.filter(
    h => h.status === 'evaluating' || h.status === 'in_progress'
  ) || [];
  
  const completedEvaluations = hackathons?.filter(
    h => h.status === 'completed'
  ) || [];
  
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
        <p className="text-gray-600">Manage and continue evaluations</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Ongoing Evaluations
          </h3>
        </div>
        
        {ongoingEvaluations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {ongoingEvaluations.map((hackathon) => {
              // Calculate progress (random for placeholder)
              const totalSubmissions = 10 + Math.floor(Math.random() * 10);
              const evaluatedSubmissions = hackathon.status === 'evaluating' 
                ? Math.floor(totalSubmissions * 0.65)
                : 0;
              const progressPercent = Math.round((evaluatedSubmissions / totalSubmissions) * 100);
              
              return (
                <li 
                  key={hackathon.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/evaluations/${hackathon.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1 mr-4">
                      <h4 className="text-base font-medium text-gray-900 truncate">{hackathon.name}</h4>
                      <p className="text-sm text-gray-500 truncate">
                        {totalSubmissions} submissions • {hackathon.theme}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium flex-shrink-0 ${
                      hackathon.status === 'evaluating' 
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {hackathon.status === 'evaluating' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={progressPercent} className="h-2" />
                    <p className="mt-1 text-xs text-gray-500 text-right">
                      {evaluatedSubmissions}/{totalSubmissions} evaluated
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 px-4 text-center">
            <p className="text-gray-500 text-sm">No ongoing evaluations</p>
          </div>
        )}

        <div className="px-4 py-5 border-b border-t border-gray-200 sm:px-6 mt-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Completed Evaluations
          </h3>
        </div>
        
        {completedEvaluations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {completedEvaluations.map((hackathon) => {
              // Calculate random total submissions for placeholder
              const totalSubmissions = 10 + Math.floor(Math.random() * 15);
              
              return (
                <li 
                  key={hackathon.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/evaluations/${hackathon.id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div className="min-w-0 flex-1 mr-4">
                      <h4 className="text-base font-medium text-gray-900 truncate">{hackathon.name}</h4>
                      <p className="text-sm text-gray-500 truncate">
                        {totalSubmissions} submissions • {hackathon.theme}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800 flex-shrink-0">
                      Completed
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress value={100} className="h-2 bg-gray-200" />
                    <p className="mt-1 text-xs text-gray-500 text-right">
                      {totalSubmissions}/{totalSubmissions} evaluated
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-6 px-4 text-center">
            <p className="text-gray-500 text-sm">No completed evaluations</p>
          </div>
        )}
      </div>
    </div>
  );
}
