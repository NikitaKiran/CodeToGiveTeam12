import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [criteria, setCriteria] = useState([{ name: '', weight: '' }]);
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch existing submissions from the backend
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/upload');
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);

      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleCriteriaChange = (index, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[index][field] = value;
    setCriteria(newCriteria);
  };

  const addCriteria = () => {
    setCriteria([...criteria, { name: '', weight: '' }]);
  };

  const removeCriteria = (index) => {
    const newCriteria = criteria.filter((_, i) => i !== index);
    setCriteria(newCriteria);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a zip file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('criteria', JSON.stringify(criteria));

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('File uploaded successfully!');
        fetchSubmissions();
      } else {
        alert('Failed to upload file.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred.');
    }
  };

  // Function to call the ML model for processing
  const processSubmission = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/upload/process/${id}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Processing complete! ✅');
        fetchSubmissions(); // Refresh the list
      } else {
        alert('Failed to process submission');
      }
    } catch (error) {
      console.error('Error processing submission:', error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Evaluation Dashboard</h2>
      <h3>Submissions ({submissions.length})</h3>

      {/* Form to set criteria and upload files */}
      <form onSubmit={handleSubmit}>
        <div className="criteria-section">
          <h3>Set Criteria</h3>
          {criteria.map((c, index) => (
            <div key={index} className="criteria-item">
              <input
                type="text"
                placeholder="Criteria Name"
                value={c.name}
                onChange={(e) => handleCriteriaChange(index, 'name', e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Weight (0-10)"
                value={c.weight}
                onChange={(e) => handleCriteriaChange(index, 'weight', e.target.value)}
                required
              />
              <button type="button" onClick={() => removeCriteria(index)}>
                ✖
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addCriteria}>
            ➕ Add Criteria
          </button>
        </div>

        {/* File Upload */}
        <div className="file-upload">
          <h3>Upload Submissions (ZIP)</h3>
          <input type="file" accept=".zip" onChange={handleFileChange} required />
        </div>

        <button type="submit" className="submit-btn">
          Submit for Evaluation
        </button>
      </form>

      {/* Submissions List */}
      <div className="submissions-list">
        <h3>Submissions ({submissions.length})</h3>
        {submissions.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          submissions.map((submission) => (
            <div key={submission._id} className="submission-item">
              <p><strong>File:</strong> {submission.fileName}</p>
              <p><strong>Score:</strong> {submission.score || 'Pending'}</p>
              <p><strong>Summary:</strong> {submission.summary || 'N/A'}</p>
              <p><strong>Pros:</strong> {submission.pros || 'N/A'}</p>
              <p><strong>Cons:</strong> {submission.cons || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(submission.createdAt).toLocaleString()}</p>

              {/* Processing Button */}
              {submission.score ? (
                <button disabled>Processed</button>
              ) : (
                <button
                  onClick={() => processSubmission(submission._id)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Process'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* View Results Button */}
      <button
        onClick={() => navigate('/results')}
        className="view-results-btn"
      >
        View Results
      </button>
    </div>
  );
};

export default Dashboard;
