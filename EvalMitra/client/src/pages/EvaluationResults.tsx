import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import { getHackathon, getSubmissionsByHackathon } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/ui/stat-card';
import SubmissionList from '@/components/ui/submission-list';
import SubmissionDetail from '@/components/ui/submission-detail';
import GroupAnalytics from '@/components/ui/group-analytics';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react"; // Import cross icon

export default function EvaluationResults() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [filterCount, setFilterCount] = useState<number>(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  
  // Parse the ID from the URL
  const hackathonId = id ? parseInt(id) : 0;
  
  // Fetch hackathon data
  const { data: hackathon, isLoading: isLoadingHackathon, error: hackathonError } = useQuery({
    queryKey: [`/api/hackathons/${hackathonId}`],
    queryFn: () => getHackathon(hackathonId),
    enabled: !!hackathonId
  });
  
  // Fetch submissions
  const { data: submissions, isLoading: isLoadingSubmissions, error: submissionsError } = useQuery({
    queryKey: [`/api/hackathons/${hackathonId}/submissions`],
    queryFn: () => getSubmissionsByHackathon(hackathonId),
    enabled: !!hackathonId
  });
  
  const isLoading = isLoadingHackathon || isLoadingSubmissions;
  const error = hackathonError || submissionsError;
  
  // Calculate statistics
  const totalSubmissions = submissions?.length || 0;
  const evaluatedSubmissions = submissions?.filter(s => s.evaluated)?.length || 0;
  
  // Calculate average score safely
  const evaluatedWithScores = submissions?.filter(s => s.evaluated && s.score !== null) || [];
  const sumOfScores = evaluatedWithScores.reduce((sum, s) => sum + (s.score || 0), 0);
  const averageScore = evaluatedWithScores.length ? sumOfScores / evaluatedWithScores.length : 0;
  
  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex">
            <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-5 h-24"></div>
            <div className="bg-white shadow rounded-lg p-5 h-24"></div>
            <div className="bg-white shadow rounded-lg p-5 h-24"></div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-64"></div>
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
                Error loading evaluation results
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {error instanceof Error ? error.message : 'An unknown error occurred.'}
                </p>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/evaluations')}
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
  
  if (!hackathon) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Hackathon not found
              </h3>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/evaluations')}
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
              onClick={() => navigate('/evaluations')} 
              className="mr-3 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{hackathon.name}</h1>
              <p className="text-gray-600">Evaluation Results</p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
      
          <Button className="self-end" disabled={hackathon.status !== 'completed'}>
            Export Results
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
        <StatCard 
          title="Total Submissions"
          value={totalSubmissions.toString()}
          icon={<i className="ri-file-list-3-line text-primary-600 text-xl"></i>}
          iconBgColor="bg-primary-100"
        />
        
        <StatCard 
          title="Average Score"
          value={isNaN(averageScore) ? 'N/A' : averageScore.toFixed(1)}
          icon={<i className="ri-bar-chart-line text-green-600 text-xl"></i>}
          iconBgColor="bg-green-100"
        />
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Evaluation Progress</p>
              <p className="text-xl font-semibold mt-1">
                {evaluatedSubmissions}/{totalSubmissions}
              </p>
            </div>
            <div className="rounded-full bg-accent-orange-light h-12 w-12 flex items-center justify-center">
              <i className="ri-progress-circle-line accent-orange text-xl"></i>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${
                  hackathon.status === 'completed' 
                    ? 'bg-primary' 
                    : 'bg-accent-orange'
                } h-2 rounded-full`} 
                style={{ width: `${totalSubmissions ? (evaluatedSubmissions / totalSubmissions) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for Analytics and Submissions */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics" className="text-base">Analytics</TabsTrigger>
          <TabsTrigger value="submissions" className="text-base">Ranked Submissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="mt-0">
          {submissions && submissions.length > 0 ? (
            <GroupAnalytics submissions={submissions} />
          ) : (
            <div className="bg-white shadow sm:rounded-lg p-6 text-center">
              <p className="text-gray-500">No submissions available for analytics</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="submissions" className="mt-0">
  <div className="bg-white shadow sm:rounded-lg overflow-hidden">
    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Ranked Submissions
      </h3>
      <div className="flex items-center space-x-2">
        {/* Category Filter Buttons */}
       

<div className="flex space-x-2">
  {["low", "mid", "high"].map((category) => {
    const isSelected = selectedCategories.includes(category);
    return (
      <button
        key={category}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all border-2
          ${isSelected ? "bg-blue-500 text-white border-blue-600 shadow-md" 
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400"}
          h-9`}
        onClick={() =>
          setSelectedCategories((prev) =>
            isSelected ? prev.filter((c) => c !== category) : [...prev, category]
          )
        }
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
        {isSelected && <X className="ml-2 h-4 w-4 text-white hover:text-gray-200" />}
      </button>
    );
  })}
</div>

        {/* Filter Count Input */}
        <label htmlFor="filter-count" className="text-sm font-medium text-gray-700">
          Show top
        </label>
        <input
          type="number"
          id="filter-count"
          value={filterCount.toString()}
          onChange={(e) => setFilterCount(parseInt(e.target.value) || 0)}
          placeholder="Enter number"
          className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
      </div>
    </div>

    {/* Submission List with Category Filter */}
    <SubmissionList 
      hackathonId={hackathonId} 
      onSelectSubmission={(id) => navigate(`/submissions/${id}`)}
      filterCount={filterCount}
      midcutoff={hackathon.cutoff_score[0]}
      highcutoff={hackathon.cutoff_score[1]}
      categories={selectedCategories}
    />
  </div>
</TabsContent>


      </Tabs>
      
      {/* Submission Detail Dialog */}
      <Dialog 
        open={selectedSubmissionId !== null} 
        onOpenChange={(open) => !open && setSelectedSubmissionId(null)}
      >
        <DialogContent className="max-w-3xl">
          {selectedSubmissionId !== null && (
            <SubmissionDetail 
              submissionId={selectedSubmissionId} 
              onClose={() => setSelectedSubmissionId(null)} 
            />
          )}
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button 
              variant="outline"
              onClick={() => setSelectedSubmissionId(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
