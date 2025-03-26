import { 
Hackathon, InsertHackathon, 
  Submission, InsertSubmission, UpdateSubmission 
} from '@shared/schema';
import { saveJSONToMinIO, getJSONFromMinIO, HACKATHON_BUCKET,RESULT_BUCKET, getResults, getSubmissionFiles, getHackathons} from './minio-client';
import { get } from 'http';
import { rankSubmissions } from './utils';

// Storage interface
export interface IStorage {
  
  // Hackathon methods
  createHackathon(hackathon: InsertHackathon): Promise<Hackathon>;
  getHackathon(id: number): Promise<Hackathon | undefined>;
  getHackathonByName(name: string): Promise<Hackathon | undefined>;
  getAllHackathons(): Promise<Hackathon[]>;
  updateHackathonStatus(id: number, status: string): Promise<Hackathon | undefined>;
  
  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByHackathon(hackathonId: number): Promise<Submission[]>;
  updateSubmission(id: number, data: Partial<UpdateSubmission>): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<boolean>;
  bulkUpdateSubmissions(submissions: Partial<Submission>[]): Promise<Submission[]>;
}

export class MemStorage implements IStorage {
  private hackathons: Map<number, Hackathon>;
  private submissions: Map<number, Submission>;

  currentHackathonId: number;
  currentSubmissionId: number;

  constructor() {
    this.hackathons = new Map();
    this.submissions = new Map();
    this.currentHackathonId = 1;
    this.currentSubmissionId = 1;
  }

  
  // Hackathon methods
  async createHackathon(insertHackathon: InsertHackathon): Promise<Hackathon> {
    const hackathons = await getHackathons();
    const id = hackathons.length + 1;
    const createdAt = new Date();
    const hackathon: Hackathon = { ...insertHackathon, id, createdAt } as Hackathon;
    
    // Save to MinIO
    try {
      await saveJSONToMinIO(HACKATHON_BUCKET, id.toString(), hackathon);
    } catch (error) {
      console.error('Failed to save hackathon to MinIO:', error);
      // Continue anyway as we have it in memory
    }
    return hackathon;
  }
  
  async getHackathon(id: number): Promise<Hackathon | undefined> {
    // Try to get from memory first
    const hackathon = this.hackathons.get(id);
    if (hackathon) return hackathon;
    
    // If not in memory, try to fetch from MinIO
    try {
      const minioHackathon = await getJSONFromMinIO(HACKATHON_BUCKET, id.toString());
      if (minioHackathon) {
        // Add to memory for future queries
        this.hackathons.set(id, minioHackathon);
        return minioHackathon;
      }
    } catch (error) {
      console.error('Failed to fetch hackathon from MinIO:', error);
    }
    
    return undefined;
  }

  async getHackathonByName(name: string): Promise<Hackathon | undefined> {
    const hackathons = await getHackathons();
    return hackathons.find((hackathon) => hackathon.name === name);
  }
  
  
  async getAllHackathons(): Promise<Hackathon[]> {
      const hackathons = await getHackathons();
      console.log(hackathons)
      return hackathons;
  }
  
  async updateHackathonStatus(id: number, status: string): Promise<Hackathon | undefined> {
    const hackathon = await this.getHackathon(id);
    if (!hackathon) return undefined;
    
    hackathon.status = status;
    this.hackathons.set(id, hackathon);
    
    // Update in MinIO
    try {
      await saveJSONToMinIO(HACKATHON_BUCKET, id.toString(), hackathon);
    } catch (error) {
      console.error('Failed to update hackathon in MinIO:', error);
    }
    
    // If status is "in_progress", generate dummy submissions for demonstration purposes
    // if (status === "in_progress") {
    //   await this.getAllResults(id);
    //   //need to call
    // }
    await this.getAllResults(hackathon.name);
    
    return hackathon;
  }
  
  // Helper method to create dummy submissions for a hackathon
  async getAllResults(hackathonName: string): Promise<void> {
    // const hackathon = await this.getHackathon(hackathonId);
    // if (!hackathon) return;
    const dummySubmissions = await getResults(hackathonName);

    console.log('IN getAllResults()')
    if(!dummySubmissions)
      throw new Error(`No submissions found. Sorry!`);
    console.log(dummySubmissions)

    // this.submissions = new Map(
    //   dummySubmissions.map((submission, index) => [index, submission])
    // );
    this.submissions = new Map<number, Submission>(
      dummySubmissions.map((submission) => [
        submission.id,
        {
          ...submission,
          justification: submission.justification ? JSON.stringify(submission.justification) : null, // ✅ Convert object to string
        },
      ])
    );
    
    for (const submission of dummySubmissions) {
      await this.createSubmission(submission as InsertSubmission);
    }
  }

  
  // Submission methods
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentSubmissionId++;
    
    // Handle dummy submissions that already have data
    const hasDummyData = 'score' in insertSubmission || 'processed' in insertSubmission;
    
    const submission: Submission = { 
      ...insertSubmission,
      id,
      // Only use default nulls if not already provided
      content: insertSubmission.content || null,
      score: hasDummyData && 'score' in insertSubmission ? insertSubmission.score as number | null : null,
      rank: hasDummyData && 'rank' in insertSubmission ? insertSubmission.rank as number | null : null,
      justification: hasDummyData && 'justification' in insertSubmission ? insertSubmission.justification as Record<string, string> | null : null,
      criteriaScores: insertSubmission.criteriaScores as Record<string, number> | null,
      oldCriteriaScores: {},
      summary: hasDummyData && 'summary' in insertSubmission ? insertSubmission.summary as string | null : null,
      keywords: hasDummyData && 'keywords' in insertSubmission ? insertSubmission.keywords as string[] : null,
      strengths: hasDummyData && 'strengths' in insertSubmission ? insertSubmission.strengths as string[] : null,
      weaknesses: hasDummyData && 'weaknesses' in insertSubmission ? insertSubmission.weaknesses as string[] : null,
      processed: hasDummyData && 'processed' in insertSubmission ? Boolean(insertSubmission.processed) : false,
      evaluated: hasDummyData && 'evaluated' in insertSubmission ? Boolean(insertSubmission.evaluated) : false
    };
    
    this.submissions.set(id, submission);
    return submission;
  }
  
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionsByHackathon(hackathonId: number): Promise<Submission[]> {
    await this.getAllResults(`${hackathonId}`)
    return Array.from(this.submissions.values()).filter(
      (submission) => true
    );
  }
  
  async updateSubmission(id: number, data: Partial<UpdateSubmission>): Promise<Submission | undefined> {
    const submission = await this.getSubmission(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...data };
    this.submissions.set(id, updatedSubmission);
    
    return updatedSubmission;
  }
  
  async deleteSubmission(id: number): Promise<boolean> {
    return this.submissions.delete(id);
  }
  
  async bulkUpdateSubmissions(submissions: Partial<Submission>[]): Promise<Submission[]> {
    const updatedSubmissions: Submission[] = [];
    
    for (const subData of submissions) {
      if (!subData.id) continue;
      
      const submission = await this.getSubmission(subData.id);
      if (submission) {
        const updatedSubmission = { ...submission, ...subData };
        this.submissions.set(subData.id, updatedSubmission);
        updatedSubmissions.push(updatedSubmission);
      }
    }
    
    return updatedSubmissions;
  }
}

export const storage = new MemStorage();
