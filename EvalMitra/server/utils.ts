import axios from 'axios';
import { Criteria, Submission } from '@shared/schema';

interface ProcessedSubmission {
  teamName: string;
  score: number;
  rank: number;
  justification: string;
  criteriaScores: Record<string, number>;
  summary: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
}

// Process non-text files using API (placeholder for now)
export async function processNonTextFile(fileType: string, fileBuffer: Buffer): Promise<string> {
  try {
    // This would be the actual API call to process different file types
    // For now, we'll return placeholder text based on file type
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return dummy text based on file type
    const dummyTexts: Record<string, string> = {
      'audio': 'This is processed audio content discussing innovation in technology.',
      'image': 'The image shows a diagram of a software architecture with multiple components.',
      'video': 'The video demonstrates a working prototype of a mobile application with user interaction.',
      'pdf': 'The PDF document contains a detailed project report with implementation details and screenshots.',
      'docx': 'The document describes the problem statement, solution approach, and technical stack used.'
    };
    
    return dummyTexts[fileType] || `This is processed content from a ${fileType} file`;
  } catch (error) {
    console.error('Error processing non-text file:', error);
    return 'Error processing file content';
  }
}

// Rank submissions using API (placeholder for now)
export async function rankSubmissions(
  submissions: { teamName: string, content: string }[],
  criteria: Criteria[]
): Promise<ProcessedSubmission[]> {
  try {
    // This would be the actual API call to rank submissions
    // For now, we'll generate placeholder rankings
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate dummy rankings
    const rankedSubmissions = submissions.map((submission, index) => {
      // Create random scores that decrease with index (to simulate ranking)
      const baseScore = Math.max(60, 95 - (index * 3) + (Math.random() * 5));
      
      // Generate criteria scores
      const criteriaScores: Record<string, number> = {};
      criteria.forEach(criterion => {
        // Random variation around the base score
        criteriaScores[criterion.name] = Math.min(
          10, 
          Math.max(1, (baseScore / 10) + (Math.random() * 2 - 1))
        );
      });
      
      // Generate random keywords based on content
      const keywords = ['innovation', 'technology', 'solution', 'design', 'user experience']
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 3));
      
      // Generate random strengths and weaknesses
      const strengths = [
        'Clear problem definition',
        'Innovative solution approach',
        'Well-designed user interface',
        'Thorough documentation',
        'Technical complexity'
      ].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
      
      const weaknesses = [
        'Limited scope',
        'Performance issues',
        'Incomplete implementation',
        'Lacks proper error handling',
        'Minimal testing'
      ].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 2));
      
      return {
        teamName: submission.teamName,
        score: Math.round(baseScore),
        rank: index + 1,
        justification: `The submission demonstrated ${strengths.join(', ').toLowerCase()} but had ${weaknesses.join(', ').toLowerCase()}. Overall score reflects the balance of strengths versus areas for improvement.`,
        criteriaScores,
        summary: `A ${Math.random() > 0.5 ? 'comprehensive' : 'focused'} solution that addresses the hackathon theme with ${Math.random() > 0.5 ? 'innovative' : 'practical'} approaches.`,
        keywords,
        strengths,
        weaknesses
      };
    });
    
    return rankedSubmissions.sort((a, b) => b.score - a.score).map((submission, index) => ({
      ...submission,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Error ranking submissions:', error);
    throw error;
  }
}

// Extract team name from filename pattern: <team_name>_<hackathon_name>.<format>
export function extractTeamName(filename: string, hackathonName: string): string {
  if (!filename.includes(`_${hackathonName}.`)) {
    throw new Error(`Invalid filename format: ${filename}`);
  }
  
  // Extract team name part
  const teamName = filename.split(`_${hackathonName}.`)[0];
  return teamName;
}

// Get file type from bucket name
export function getFileTypeFromBucket(bucketName: string): string {
  const type = bucketName.split('-')[0];
  return type;
}

// Analyze submission (placeholder function for drill-down analysis)
export async function analyzeSubmission(submission: Submission): Promise<{
  summary: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
}> {
  // This would be an actual API call to analyze the submission in depth
  // For now, return placeholder data
  
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return {
    summary: submission.summary || 'This submission provides a solution to the hackathon challenge with a focus on usability and technical innovation.',
    keywords: submission.keywords || ['innovation', 'technology', 'solution'],
    strengths: submission.strengths || ['Well-designed interface', 'Technical implementation', 'Documentation'],
    weaknesses: submission.weaknesses || ['Limited scope', 'Performance issues']
  };
}
