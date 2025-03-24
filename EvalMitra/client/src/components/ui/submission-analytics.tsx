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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Submission } from "@/lib/minio-client";

interface SubmissionAnalyticsProps {
  submission: Submission;
}

export default function SubmissionAnalytics({ submission }: SubmissionAnalyticsProps) {
  if (!submission.evaluated || !submission.criteriaScores) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">This submission has not been fully evaluated yet.</p>
      </div>
    );
  }

  // Format criteria scores for the bar chart
  const criteriaScoreData = Object.entries(submission.criteriaScores).map(([criteria, score]) => ({
    criteria,
    score
  }));

  // Format criteria scores for radar chart with full scale
  const criteriaForRadar = Object.entries(submission.criteriaScores).map(([criteria, score]) => ({
    criteria,
    score,
    fullScore: 10 // Assuming max score is 10
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Criteria Scores</CardTitle>
            <CardDescription>
              Individual scores for each evaluation criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={criteriaScoreData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="criteria" />
                  <YAxis domain={[0, 10]} /> {/* Assuming 10 is max score */}
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Score" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Performance Radar</CardTitle>
            <CardDescription>
              Visual representation of performance across criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={criteriaForRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="criteria" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#FF8A00"
                    fill="#FF8A00"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Keywords</CardTitle>
            <CardDescription>
              Key themes identified in this submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {submission.keywords && submission.keywords.map((keyword, index) => (
                <Badge key={index} className="bg-primary-100 text-primary-700 hover:bg-primary-200">
                  {keyword}
                </Badge>
              ))}
              {(!submission.keywords || submission.keywords.length === 0) && (
                <p className="text-gray-500 text-sm">No keywords identified</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gradient">Summary</CardTitle>
            <CardDescription>
              Generated summary of the submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              {submission.summary || "No summary available"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gradient text-green-600">Strengths</CardTitle>
            <CardDescription>
              Key strengths identified in the submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submission.strengths && submission.strengths.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {submission.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-700">{strength}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No strengths identified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gradient text-orange-600">Areas for Improvement</CardTitle>
            <CardDescription>
              Points that could be improved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submission.weaknesses && submission.weaknesses.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {submission.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-gray-700">{weakness}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No improvement areas identified</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}