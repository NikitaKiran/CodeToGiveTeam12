import { useQuery } from '@tanstack/react-query';
import { getSubmissionsByHackathon } from '@/lib/minio-client';
import { sub } from 'date-fns';

interface SubmissionListProps {
  hackathonId: number;
  onSelectSubmission: (submissionId: number) => void;
  filterCount?: number;
  categories?: string[];
  midcutoff: number;
  highcutoff: number;
}

export default function SubmissionList({ 
  hackathonId, 

  onSelectSubmission,
  filterCount = 10,
  categories = [],
  midcutoff,
  highcutoff,
}: SubmissionListProps) {
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: [`/api/hackathons/${hackathonId}/submissions`],
    queryFn: () => getSubmissionsByHackathon(hackathonId)
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
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
              Failed to load submissions
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
  
  if (!submissions || submissions.length === 0) {
    return (
      <div className="bg-white p-8 text-center border rounded-md">
        <p className="text-gray-500">No submissions found for this hackathon</p>
      </div>
    );
  }
  
  // Sort submissions by rank
  const sortedSubmissions = [...submissions]
    .filter(s => s.evaluated)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, parseInt(filterCount.toString())).filter(submission => {
      if (categories.length === 0) {
        return true;
      }
      if (submission.criteriaScores) {
        const score = submission.score;
        if (score && score >= highcutoff) {
          return categories.includes('high');
        } else if (score && score >= midcutoff) {
          return categories.includes('mid');
        } else {
          return categories.includes('low');
        }
      }
      return false;
    });
  
  return (
    <ul className="divide-y divide-gray-200">
      {sortedSubmissions.map((submission) => (
        <li 
          key={submission.id}
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => onSelectSubmission(submission.id)}
        >
          <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full ${
                (submission.rank || 0) <= 3 ? 'bg-amber-100' : 'bg-gray-100'
              } flex items-center justify-center`}>
                <span className={`text-lg font-semibold ${
                  (submission.rank || 0) <= 3 ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  {submission.rank}
                </span>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {submission.teamName}
                </div>
                <div className="text-sm text-gray-500">
                  {submission.fileType} submission
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-right mr-4">
                <div className="text-sm font-medium text-gray-900">
                  {submission.score}/100
                </div>
                <div className="text-xs text-gray-500">
                  Final Score
                </div>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
