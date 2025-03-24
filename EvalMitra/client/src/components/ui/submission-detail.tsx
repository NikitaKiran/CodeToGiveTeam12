import { useQuery } from '@tanstack/react-query';
import { getSubmission, getSubmissionAnalysis } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SubmissionDetailProps {
  submissionId: number;
  onClose: () => void;
}

export default function SubmissionDetail({ submissionId, onClose }: SubmissionDetailProps) {
  const { data: submission, isLoading: isLoadingSubmission } = useQuery({
    queryKey: [`/api/submissions/${submissionId}`],
    queryFn: () => getSubmission(submissionId),
    enabled: !!submissionId
  });
  
  const { data: analysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: [`/api/submissions/${submissionId}/analysis`],
    queryFn: () => getSubmissionAnalysis(submissionId),
    enabled: !!submissionId && !!submission?.evaluated
  });
  
  const isLoading = isLoadingSubmission || isLoadingAnalysis;
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="ml-3 h-6 bg-gray-200 rounded w-32"></div>
          <div className="ml-auto h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }
  
  if (!submission) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Submission not found</p>
        <Button className="mt-4" onClick={onClose}>Close</Button>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center min-w-0 flex-1 mr-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${
            (submission.rank || 0) <= 3 ? 'bg-amber-100' : 'bg-gray-100'
          } flex items-center justify-center`}>
            <span className={`text-lg font-semibold ${
              (submission.rank || 0) <= 3 ? 'text-amber-700' : 'text-gray-700'
            }`}>
              {submission.rank}
            </span>
          </div>
          <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900 truncate">
            {submission.teamName}
          </h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-primary-100 text-primary-800 flex-shrink-0">
          <span className="mr-1 font-semibold">{submission.score}</span>/100
        </span>
      </div>
      
      <div className="mt-6">
        {/* Summary */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-900 mb-2">Submission Summary</h4>
          <p className="text-sm text-gray-600 break-words">
            {analysis?.summary || submission.summary || 'No summary available'}
          </p>
        </div>
        
        {/* Criteria Scores */}
        {submission.criteriaScores && (
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 mb-3">Criteria Scores</h4>
            <div className="space-y-3">
              {Object.entries(submission.criteriaScores).map(([criteriaName, score]) => (
                <div key={criteriaName}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{criteriaName}</span>
                    <span className="text-sm font-medium text-gray-900">{score}/10</span>
                  </div>
                  <Progress value={score * 10} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-base font-medium text-green-800 flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Strengths
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              {(analysis?.strengths || submission.strengths || ['No strengths identified']).map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span className="break-words">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="text-base font-medium text-red-800 flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Areas for Improvement
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {(analysis?.weaknesses || submission.weaknesses || ['No areas for improvement identified']).map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span className="break-words">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Keywords */}
        {(analysis?.keywords || submission.keywords) && (
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-2">
              {(analysis?.keywords || submission.keywords || []).map((keyword, index) => (
                <Badge key={index} variant="outline" className="bg-gray-100">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Evaluation Justification */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-2">Evaluation Justification</h4>
          <p className="text-sm text-gray-600 break-words">
            {submission.justification || 'No justification provided'}
          </p>
        </div>
      </div>
    </div>
  );
}
