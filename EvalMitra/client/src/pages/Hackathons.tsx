import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { getAllHackathons, startEvaluation } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Hackathons() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [evaluatingHackathon, setEvaluatingHackathon] = useState<{ id: number, name: string } | null>(null);
  
  const { data: hackathons, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/hackathons'],
    queryFn: getAllHackathons
  });
  
  const startEvaluationProcess = async () => {
    if (!evaluatingHackathon) return;
    
    try {
      await startEvaluation(evaluatingHackathon.id);
      // toast({
      //   title: "Evaluation started",
      //   description: `Processing submissions for ${evaluatingHackathon.name}`,
      // });
      setEvaluatingHackathon(null);
      // navigate(`/evaluations/${evaluatingHackathon.id}`);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to start evaluation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
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

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map(i => (
              <li key={i} className="p-4">
                <div className="animate-pulse flex justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </li>
            ))}
          </ul>
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
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hackathons</h1>
          <p className="text-gray-600">Manage and create hackathon events</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0" 
          onClick={() => navigate('/hackathons/create')}
        >
          <i className="ri-add-line mr-2"></i>
          Add Hackathon
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {hackathons && hackathons.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {hackathons.map((hackathon) => (
              <li key={hackathon.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0 mr-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-medium text-primary-600 truncate">
                            {hackathon.name}
                          </p>
                        </div>
                        <span className={`ml-3 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay[hackathon.status]?.className} flex-shrink-0`}>
                          {statusDisplay[hackathon.status]?.text}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {hackathon.status === 'completed' ? (
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/evaluations/${hackathon.id}`)}
                            size="sm"
                          >
                            View Results
                          </Button>
                        ) : hackathon.status === 'evaluating' ? (
                          <Button
                            onClick={() => navigate(`/evaluations/${hackathon.id}`)}
                            size="sm"
                          >
                            Continue Evaluation
                          </Button>
                        ) : (
                          <Button
                            // onClick={() => setEvaluatingHackathon({ id: hackathon.id, name: hackathon.name })}
                            onClick={() => navigate(`/evaluations/${hackathon.id}`)}
                            size="sm"
                          >
                            View Results
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex max-w-[60%] min-w-0">
                        <p className="flex items-center text-sm text-gray-500 min-w-0">
                          <i className="ri-award-line flex-shrink-0 mr-1.5 text-gray-400"></i>
                          <span className="truncate">{hackathon.theme}</span>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 flex-shrink-0">
                        <i className="ri-list-check flex-shrink-0 mr-1.5 text-gray-400"></i>
                        <p>{hackathon.criteria.length} evaluation criteria</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10 px-4 text-center sm:px-6 lg:px-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hackathons</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new hackathon.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/hackathons/create')}>
                <i className="ri-add-line mr-2"></i>
                New Hackathon
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Evaluate Confirmation Dialog */}
      <Dialog open={!!evaluatingHackathon} onOpenChange={(open) => !open && setEvaluatingHackathon(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Results</DialogTitle>
            <DialogDescription>
              Do you want to view the evaluation for <span className="font-medium">{evaluatingHackathon?.name}</span>? 
              This will display all processed submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluatingHackathon(null)}>
              Cancel
            </Button>
            <Button onClick={startEvaluationProcess}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
