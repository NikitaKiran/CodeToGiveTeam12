import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import * as XLSX from 'xlsx';

import { getHackathon, getSubmissionsByHackathon } from '@/lib/minio-client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from "lucide-react";

import StatCard from '@/components/ui/stat-card';
import SubmissionList from '@/components/ui/submission-list';
import SubmissionDetail from '@/components/ui/submission-detail';
import GroupAnalytics from '@/components/ui/group-analytics';
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function EvaluationResults() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [filterCount, setFilterCount] = useState<number>(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  
  const hackathonId = id ? parseInt(id) : 0;

  const { data: hackathon, isLoading: isLoadingHackathon, error: hackathonError } = useQuery({
    queryKey: [`/api/hackathons/${hackathonId}`],
    queryFn: () => getHackathon(hackathonId),
    enabled: !!hackathonId
  });

  const { data: submissions, isLoading: isLoadingSubmissions, error: submissionsError } = useQuery({
    queryKey: [`/api/hackathons/${hackathonId}/submissions`],
    queryFn: () => getSubmissionsByHackathon(hackathonId),
    enabled: !!hackathonId
  });

  const isLoading = isLoadingHackathon || isLoadingSubmissions;
  const error = hackathonError || submissionsError;

  const totalSubmissions = submissions?.length || 0;
  const evaluatedSubmissions = submissions?.filter(s => s.evaluated)?.length || 0;

  const evaluatedWithScores = submissions?.filter(s => s.evaluated && s.score !== null) || [];
  const sumOfScores = evaluatedWithScores.reduce((sum, s) => sum + (s.score || 0), 0);
  const averageScore = evaluatedWithScores.length ? sumOfScores / evaluatedWithScores.length : 0;

  const handleExportResults = () => {
    if (!submissions || !hackathon) return;

    const rows = submissions.map(sub => ({
      TeamName: sub.teamName,
      Keywords: Array.isArray(sub.keywords) ? sub.keywords.join(', ') : (sub.keywords || 'N/A'),
      Summary: sub.summary || 'N/A',
      Strengths: Array.isArray(sub.strengths) ? sub.strengths.join(', ') : (sub.strengths || 'N/A'),
      Weaknesses: Array.isArray(sub.weaknesses) ? sub.weaknesses.join(', ') : (sub.weaknesses || 'N/A'),
      Score: sub.score ?? 'N/A',
      Rank: sub.rank ?? 'N/A',
      ...(sub.criteriaScores ? Object.entries(sub.criteriaScores).reduce((acc, [crit, score]) => {
        acc[`Criteria: ${crit}`] = score;
        return acc;
      }, {}) : {})
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evaluation Results');
    XLSX.writeFile(wb, `${hackathon.name}_Results.xlsx`);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading evaluation results...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600 font-semibold">Error loading evaluation results.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Evaluations</Button>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="p-8">
        <p className="text-yellow-600 font-semibold">Hackathon not found.</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Evaluations</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-3 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{hackathon.name}</h1>
              <p className="text-gray-600">Evaluation Results</p>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
        <Button 
              variant="outline" 
              className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={handleExportResults}
            >
              <i className="ri-download-line mr-2"></i>
              Export Reports
            </Button>

          
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
        <StatCard title="Total Submissions" value={totalSubmissions.toString()} icon={<i className="ri-file-list-3-line text-primary-600 text-xl"></i>} iconBgColor="bg-primary-100" />
        <StatCard title="Average Score" value={isNaN(averageScore) ? 'N/A' : averageScore.toFixed(1)} icon={<i className="ri-bar-chart-line text-green-600 text-xl"></i>} iconBgColor="bg-green-100" />
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Evaluation Progress</p>
              <p className="text-xl font-semibold mt-1">{evaluatedSubmissions}/{totalSubmissions}</p>
            </div>
            <div className="rounded-full bg-accent-orange-light h-12 w-12 flex items-center justify-center">
              <i className="ri-progress-circle-line accent-orange text-xl"></i>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${hackathon.status === 'completed' ? 'bg-primary' : 'bg-accent-orange'} h-2 rounded-full`}
                style={{ width: `${totalSubmissions ? (evaluatedSubmissions / totalSubmissions) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics" className="text-base">Analytics</TabsTrigger>
          <TabsTrigger value="submissions" className="text-base">Ranked Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0">
          {submissions?.length ? (
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">Ranked Submissions</h3>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2">
                  {["low", "mid", "high"].map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-100 hover:border-blue-400"
                        } h-9`}
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

            <SubmissionList
              hackathonId={hackathonId}
              onSelectSubmission={(id) => navigate(`/submissions/${id}`)}
              filterCount={filterCount}
              midcutoff={hackathon.cutoff_score?.[0] || 30}
              highcutoff={hackathon.cutoff_score?.[1] || 60}
              categories={selectedCategories}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={selectedSubmissionId !== null} onOpenChange={(open) => !open && setSelectedSubmissionId(null)}>
        <DialogContent className="max-w-3xl">
          {selectedSubmissionId !== null && (
            <SubmissionDetail
              submissionId={selectedSubmissionId}
              onClose={() => setSelectedSubmissionId(null)}
            />
          )}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button variant="outline" onClick={() => setSelectedSubmissionId(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
