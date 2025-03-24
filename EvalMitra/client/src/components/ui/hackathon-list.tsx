import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getAllHackathons } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';

export default function HackathonList() {
  const [, navigate] = useLocation();
  
  const { data: hackathons, isLoading, error } = useQuery({
    queryKey: ['/api/hackathons'],
    queryFn: getAllHackathons
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Failed to load hackathons
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {error instanceof Error ? error.message : 'An unknown error occurred.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Status to display text and styling mapping
  const statusDisplay: Record<string, { text: string, className: string }> = {
    'not_started': { 
      text: 'Not Started', 
      className: 'bg-blue-100 text-blue-800' 
    },
    'in_progress': { 
      text: 'In Progress', 
      className: 'bg-blue-100 text-blue-800' 
    },
    'evaluating': { 
      text: 'Evaluating', 
      className: 'bg-amber-100 text-amber-800' 
    },
    'completed': { 
      text: 'Completed', 
      className: 'bg-green-100 text-green-800' 
    }
  };
  
  return (
    <div className="space-y-4">
      {hackathons && hackathons.length > 0 ? (
        hackathons.map((hackathon) => (
          <div key={hackathon.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">{hackathon.name}</h3>
                <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay[hackathon.status]?.className}`}>
                  {statusDisplay[hackathon.status]?.text}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/evaluations/${hackathon.id}`)}
              >
                {hackathon.status === 'completed' ? 'View Results' : 'Evaluate'}
              </Button>
            </div>
            <p className="mt-1 text-sm text-gray-500">{hackathon.theme}</p>
          </div>
        ))
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No hackathons found</p>
          <Button className="mt-4" onClick={() => navigate('/hackathons/create')}>
            Create Hackathon
          </Button>
        </div>
      )}
    </div>
  );
}
