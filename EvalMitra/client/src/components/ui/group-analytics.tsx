import React from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Submission } from "@/lib/minio-client";

interface GroupAnalyticsProps {
  submissions: Submission[];
}

export default function GroupAnalytics({ submissions }: GroupAnalyticsProps) {
  // Only use evaluated submissions with scores
  const evaluatedSubmissions = submissions.filter(s => s.evaluated && s.score !== null);
  
  if (evaluatedSubmissions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No evaluated submissions to display analytics</p>
      </div>
    );
  }

  // Calculate score distribution
  const scoreRanges = [
    { name: '90-100', range: [90, 100], count: 0 },
    { name: '80-89', range: [80, 89], count: 0 },
    { name: '70-79', range: [70, 79], count: 0 },
    { name: '60-69', range: [60, 69], count: 0 },
    { name: 'Below 60', range: [0, 59], count: 0 },
  ];

  evaluatedSubmissions.forEach(submission => {
    if (submission.score === null) return;
    
    const score = submission.score;
    const range = scoreRanges.find(r => score >= r.range[0] && score <= r.range[1]);
    if (range) range.count++;
  });

  // Get all criteria from the first submission that has criteriaScores
  const firstWithCriteria = evaluatedSubmissions.find(s => s.criteriaScores !== null);
  const criteriaNames = firstWithCriteria && firstWithCriteria.criteriaScores 
    ? Object.keys(firstWithCriteria.criteriaScores) 
    : [];

  // Calculate average score per criteria
  const criteriaAverages = criteriaNames.map(criteria => {
    const total = evaluatedSubmissions.reduce((sum, submission) => {
      if (submission.criteriaScores && submission.criteriaScores[criteria]) {
        return sum + submission.criteriaScores[criteria];
      }
      return sum;
    }, 0);
    
    const count = evaluatedSubmissions.filter(s => 
      s.criteriaScores && s.criteriaScores[criteria] !== undefined
    ).length;
    
    return {
      criteria,
      average: count > 0 ? total / count : 0
    };
  });

  // Get keywords frequency
  const keywordsMap = new Map<string, number>();
  evaluatedSubmissions.forEach(submission => {
    if (!submission.keywords) return;
    
    submission.keywords.forEach(keyword => {
      const count = keywordsMap.get(keyword) || 0;
      keywordsMap.set(keyword, count + 1);
    });
  });

  // Convert to array and sort by frequency
  const keywordFrequency = Array.from(keywordsMap.entries())
  .map(([keyword, count]) => ({ text: keyword, value: count })) // Rename keys
  .sort((a, b) => b.value - a.value)
  .slice(0, 5); // Take top 5

  // Extract strengths and weaknesses for comparison
  const strengthsCount = evaluatedSubmissions.reduce((sum, s) => sum + (s.strengths?.length || 0), 0);
  const weaknessesCount = evaluatedSubmissions.reduce((sum, s) => sum + (s.weaknesses?.length || 0), 0);
  
  const strengthsWeaknessesPie = [
    { name: 'Strengths', value: strengthsCount, fill: '#4caf50' },
    { name: 'Weaknesses', value: weaknessesCount, fill: '#f44336' }
  ];

  // Colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const CRITERIA_COLORS = ['#FF8A00', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gradient">Score Distribution</CardTitle>
          <CardDescription>
            Distribution of scores across all evaluated submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreRanges}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Number of Submissions" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Criteria Performance</CardTitle>
            <CardDescription>
              Average scores for each evaluation criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={criteriaAverages}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="criteria" />
                  <PolarRadiusAxis domain={[0, 10]} />
                  <Radar
                    name="Average Score"
                    dataKey="average"
                    stroke="#FF8A00"
                    fill="#FF8A00"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
  <CardHeader>
    <CardTitle className="text-gradient">Top Keywords</CardTitle>
    <CardDescription>
      Most frequently mentioned keywords across submissions
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="h-80">
      
    </div>
  </CardContent>
</Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gradient">Strengths vs Weaknesses</CardTitle>
          <CardDescription>
            Comparison of identified strengths and weaknesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={strengthsWeaknessesPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {strengthsWeaknessesPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}