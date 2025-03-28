import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getSubmission, getHackathon } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import SubmissionAnalytics from '@/components/ui/submission-analytics';
import { sub } from 'date-fns';
import FileViewer from "@/components/FileViewer";
import PDFViewer from "../components/PDFViewer";

export default function SubmissionDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/submissions/:id');
  const submissionId = params ? parseInt(params.id) : null;

  const { data: submission, isLoading: isLoadingSubmission, error: submissionError } = useQuery({
    queryKey: ['/api/submissions', submissionId],
    queryFn: () => getSubmission(submissionId!),
    enabled: !!submissionId,
  });

  const { data: hackathon, isLoading: isLoadingHackathon } = useQuery({
    queryKey: ['/api/hackathons', submission?.hackathonId],
    queryFn: () => getHackathon(submission!.hackathonId),
    enabled: !!submission?.hackathonId,
  });

  const isLoading = isLoadingSubmission || isLoadingHackathon;

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-72 mb-6"></div>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white shadow rounded-lg p-5 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (submissionError || !submission) {
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
                Error loading submission details
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {submissionError instanceof Error ? submissionError.message : 'The requested submission could not be found.'}
                </p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/')}
                >
                  Back to Evaluations
                </Button>
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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/evaluations/${submission.hackathonId}`)}
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="truncate max-w-md mr-2">{submission.teamName}</span>
                {submission.score !== null && (
                  <span className="text-lg px-2 py-1 bg-primary-100 text-primary-800 rounded-md ml-2">
                    Score: {submission.score}
                  </span>
                )}
                {submission.rank !== null && (
                  <span className="text-lg px-2 py-1 bg-accent-orange-light accent-orange rounded-md ml-2">
                    Rank: #{submission.rank}
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                {hackathon ? hackathon.name : 'Loading hackathon...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="submission">Submission</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0">
          <SubmissionAnalytics submission={submission} />
        </TabsContent>

        <TabsContent value="submission" className="mt-0">
          <div className="bg-white shadow sm:rounded-lg overflow">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Original Submission
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                File: {submission.originalFile} ({submission.fileType})
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {/* <div className="prose max-w-none bg-gray-50 p-4 rounded-md">
              <object data="https://teal-kimberlyn-20.tiiny.site/" type="application/pdf" width="100%" height="100%">
            </object>
              </div> */}
              <div className="prose max-w-none bg-gray-50 p-4 rounded-md h-[80vh]">
  <object
    data="https://teal-kimberlyn-20.tiiny.site/"
    type="application/pdf"
    className="w-full h-full"
  >
    Your browser does not support PDFs.
  </object>
</div>

            </div>
          </div>
          <div>
            
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="mt-0">
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Evaluation Feedback
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {// Render current criteria scores
                  Object.entries(submission.criteriaScores || {}).map(([criteria, score]) => (
                    <div
                      key={criteria}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex-grow pr-4">
                        <h4 className="text-base font-semibold text-gray-900 mb-2">{criteria}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {score}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          
                       {submission.justification[criteria]}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}