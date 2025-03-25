import React from "react";
// import WordCloud from "react-wordcloud";
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

  const firstWithCriteria = evaluatedSubmissions.find(s => s.criteriaScores !== null);
  const criteriaNames = firstWithCriteria && firstWithCriteria.criteriaScores 
    ? Object.keys(firstWithCriteria.criteriaScores) 
    : [];
    const fixedScoreRanges = [
      { name: "9-10", min: 9, max: 10, count: 0 },
      { name: "7-8", min: 7, max: 8, count: 0 },
      { name: "5-6", min: 5, max: 6, count: 0 },
      { name: "3-4", min: 3, max: 4, count: 0 },
      { name: "< 3", min: 0, max: 2, count: 0 },
    ];

  // const criteriaScoreRanges = criteriaNames.map(criteria => {
  //   const maxScore = Math.max(...evaluatedSubmissions.map(s => s.criteriaScores?.[criteria] || 0));
  //   const rangeSize = Math.max(1, Math.ceil(maxScore / 4));
  //   return {
  //     criteria,
  //     ranges: [
  //       { name: `${maxScore - rangeSize + 1}-${maxScore}`, min: maxScore - rangeSize + 1, max: maxScore, count: 0 },
  //       { name: `${maxScore - 2 * rangeSize + 1}-${maxScore - rangeSize}`, min: maxScore - 2 * rangeSize + 1, max: maxScore - rangeSize, count: 0 },
  //       { name: `${maxScore - 3 * rangeSize + 1}-${maxScore - 2 * rangeSize}`, min: maxScore - 3 * rangeSize + 1, max: maxScore - 2 * rangeSize, count: 0 },
  //       { name: `< ${maxScore - 3 * rangeSize}`, min: 0, max: maxScore - 3 * rangeSize, count: 0 },
  //     ]
  //   };
  // });
    const criteriaScoreRanges = criteriaNames.map(criteria => ({
      criteria,
      ranges: JSON.parse(JSON.stringify(fixedScoreRanges)), // Deep copy to avoid modifying original
    }));

  // evaluatedSubmissions.forEach(submission => {
  //   criteriaScoreRanges.forEach(({ criteria, ranges }) => {
  //     const score = submission.criteriaScores?.[criteria] || 0;
  //     const range = ranges.find(r => score >= r.min && score <= r.max);
  //     if (!range && score >= 0) {
  //       ranges[ranges.length - 1].count++; // Place the score in the last range if no match
  //     }
  //     else if(range) range.count++;
  //   });
    //   (range)range.count++;
    // });
    evaluatedSubmissions.forEach(submission => {
      criteriaScoreRanges.forEach(({ criteria, ranges }) => {
        const score = submission.criteriaScores?.[criteria] || 0;
        const range = ranges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
      });
    });

  const stackedBarData = criteriaScoreRanges.map(({ criteria, ranges }) => {
    const entry: any = { criteria };
    ranges.forEach(range => {
      entry[range.name] = range.count;
    });
    return entry;
  });

  const topRankersPerCriteria = criteriaNames.map(criteria => {
    const topSubmissions = [...evaluatedSubmissions]
      .sort((a, b) => (b.criteriaScores?.[criteria] || 0) - (a.criteriaScores?.[criteria] || 0))
      .slice(0, 5);

    return {
      criteria,
      data: topSubmissions.map(submission => ({
        name: submission.teamName,
        score: submission.criteriaScores?.[criteria] || 0,
      }))
    };
  });
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

  // const sortedSubmissions = [...evaluatedSubmissions].sort((a, b) => b.score - a.score);
  // const topSubmissions = sortedSubmissions.slice(0, 5).map(submission => {
  //   const formatted = { submissionId: `Sub ${submission.id}` };
  //   criteriaNames.forEach(criteria => {
  //     formatted[criteria] = submission.criteriaScores?.[criteria] || 0;
  //   });
  //   return formatted;
  // });

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
      {/* <WordCloud
        words={keywordFrequency}
        options={{
          rotations: 2,
          rotationAngles: [0, 90],
          fontSizes: [20, 60],
        }}
      /> */}
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
              <BarChart data={stackedBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="criteria" />
                <YAxis />
                <Tooltip />
                <Legend />
                      {fixedScoreRanges.map((range, rangeIdx) => (
                      <Bar 
                        key={rangeIdx} 
                        dataKey={range.name} 
                        fill={`hsl(${rangeIdx * 60}, 70%, 50%)`} 
                      />
                    ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        </Card>
        {topRankersPerCriteria.map(({ criteria, data }) => (
        <Card key={criteria}>
          <CardHeader>
            <CardTitle className="text-gradient">Top 5 Submissions for {criteria}</CardTitle>
            <CardDescription>Highest scoring submissions in {criteria}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

  );
}