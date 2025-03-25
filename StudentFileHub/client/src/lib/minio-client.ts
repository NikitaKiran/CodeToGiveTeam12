// MinIO client utilities for frontend

import { apiRequest } from "./queryClient";

export interface Hackathon {
  id: number;
  name: string;
  theme: string;
  description: string;
  criteria: Array<{
    name: string;
    description: string;
    weightage: number;
  }>;
  status: string;
  createdAt: string;
}

export interface Submission {
  id: number;
  hackathonId: number;
  teamName: string;
  originalFile: string;
  fileType: string;
  content: string | null;
  score: number | null;
  rank: number | null;
  justification: string | null;
  criteriaScores: Record<string, number> | null;
  summary: string | null;
  keywords: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  processed: boolean;
  evaluated: boolean;
}

export interface SubmissionAnalysis {
  summary: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
}

// Get all hackathons
export async function getAllHackathons(): Promise<Hackathon[]> {
  const response = await apiRequest('GET', '/api/hackathons');
  return response.json();
}

// Get hackathon by ID
export async function getHackathon(id: number): Promise<Hackathon> {
  const response = await apiRequest('GET', `/api/hackathons/${id}`);
  return response.json();
}

// Create a new hackathon
export async function createHackathon(hackathonData: Omit<Hackathon, 'id' | 'createdAt'>): Promise<Hackathon> {
  const response = await apiRequest('POST', '/api/hackathons', hackathonData);
  return response.json();
}

// Update hackathon status
export async function updateHackathonStatus(id: number, status: string): Promise<Hackathon> {
  const response = await apiRequest('PATCH', `/api/hackathons/${id}/status`, { status });
  return response.json();
}

// Start evaluation process
export async function startEvaluation(id: number): Promise<{ message: string, hackathonId: number }> {
  const response = await apiRequest('POST', `/api/hackathons/${id}/evaluate`);
  return response.json();
}

// Get all submissions for a hackathon
export async function getSubmissionsByHackathon(hackathonId: number): Promise<Submission[]> {
  const response = await apiRequest('GET', `/api/hackathons/${hackathonId}/submissions`);
  return response.json();
}

// Get a specific submission
export async function getSubmission(id: number): Promise<Submission> {
  const response = await apiRequest('GET', `/api/submissions/${id}`);
  return response.json();
}

// Get detailed analysis for a submission
export async function getSubmissionAnalysis(id: number): Promise<SubmissionAnalysis> {
  const response = await apiRequest('GET', `/api/submissions/${id}/analysis`);
  return response.json();
}
