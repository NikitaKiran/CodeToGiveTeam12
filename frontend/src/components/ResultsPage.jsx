import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import './ResultsPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    console.log('Selected Submission:', selectedSubmission);
  }, [selectedSubmission]);
  

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/upload');
      const data = await response.json();

      // Sort submissions by score in descending order (highest score first)
      const sortedSubmissions = data.sort((a, b) => (b.score || 0) - (a.score || 0));
      setSubmissions(sortedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  // Chart.js Data Configuration
  const chartData = {
    labels: selectedSubmission?.criteria.map((c) => c.name) || [],
    datasets: [
      {
        label: 'Criteria Score',
        data: selectedSubmission?.criteria.map((c) => c.score || 0),
        backgroundColor: selectedSubmission?.criteria.map((c) => 
          c.score > 7 ? 'rgba(76, 175, 80, 0.6)' : 
          c.score > 4 ? 'rgba(255, 193, 7, 0.6)' : 
          'rgba(244, 67, 54, 0.6)'
        ),
        borderColor: selectedSubmission?.criteria.map((c) =>
          c.score > 7 ? 'rgba(76, 175, 80, 1)' : 
          c.score > 4 ? 'rgba(255, 193, 7, 1)' : 
          'rgba(244, 67, 54, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };
  

  

  return (
    <div className="results-page">
      <h2>Results Overview</h2>

      {/* Overall Rankings */}
      <div className="ranking-list">
        <h3>Overall Rankings</h3>
        {submissions.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          submissions.map((submission, index) => (
            <div
            key={submission._id}
            className={`ranking-item ${selectedSubmission?._id === submission._id ? 'active' : ''}`}
            onClick={() => handleSelectSubmission(submission)}
            >
            <span>{index + 1}. {submission.fileName}</span>
            <span>Score: {submission.score || 'Pending'}</span>
            </div>

          ))
        )}
      </div>

      {/* Selected Submission Details */}
      {selectedSubmission && (
        <div className="submission-details">
          <h3>Submission Details</h3>
          <p><strong>File:</strong> {selectedSubmission.fileName}</p>
          <p><strong>Score:</strong> {selectedSubmission.score != null ? selectedSubmission.score : 'Pending'}</p>
          <p><strong>Summary:</strong> {selectedSubmission.summary || 'N/A'}</p>
          <p><strong>Pros:</strong> {selectedSubmission.pros || 'N/A'}</p>
          <p><strong>Cons:</strong> {selectedSubmission.cons || 'N/A'}</p>

          {/* Criteria Breakdown */}
          <h4>Criteria Breakdown</h4>
          <Bar data={chartData} />

          {selectedSubmission.criteria.map((c, index) => (
            <div key={index} className="criteria-item">
              <span>{c.name}</span>
              <span>Score: {c.score || 'N/A'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
