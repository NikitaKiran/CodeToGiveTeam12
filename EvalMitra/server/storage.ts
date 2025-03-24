import { 
  User, InsertUser, Hackathon, InsertHackathon, 
  Submission, InsertSubmission, UpdateSubmission 
} from '@shared/schema';
import { saveJSONToMinIO, getJSONFromMinIO, HACKATHON_BUCKET } from './minio-client';

// Storage interface
export interface IStorage {
  // User methods (keeping original code)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  private users: Map<number, User>;
  private hackathons: Map<number, Hackathon>;
  private submissions: Map<number, Submission>;
  currentUserId: number;
  currentHackathonId: number;
  currentSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.hackathons = new Map();
    this.submissions = new Map();
    this.currentUserId = 1;
    this.currentHackathonId = 1;
    this.currentSubmissionId = 1;
  }

  // User methods (keeping original code)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Hackathon methods
  async createHackathon(insertHackathon: InsertHackathon): Promise<Hackathon> {
    const id = this.currentHackathonId++;
    const createdAt = new Date();
    const hackathon: Hackathon = { ...insertHackathon, id, createdAt };
    
    this.hackathons.set(id, hackathon);
    
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
    return Array.from(this.hackathons.values()).find(
      (hackathon) => hackathon.name === name
    );
  }
  
  async getAllHackathons(): Promise<Hackathon[]> {
    return Array.from(this.hackathons.values());
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
    if (status === "in_progress") {
      await this.createDummySubmissions(id);
    }
    
    return hackathon;
  }
  
  // Helper method to create dummy submissions for a hackathon
  private async createDummySubmissions(hackathonId: number): Promise<void> {
    const hackathon = await this.getHackathon(hackathonId);
    if (!hackathon) return;
    
    const dummySubmissions = [
      {
        hackathonId,
        teamName: "Team Alpha",
        originalFile: "alpha_submission.txt",
        fileType: "text",
        content: "Our approach to the problem focuses on renewable energy solutions. We propose a solar-powered water purification system that can be deployed in remote areas.",
        processed: true,
        evaluated: true,
        score: 87,
        rank: 1,
        justification: "Excellent technical solution with practical implementation details.",
        criteriaScores: { "Innovation": 9, "Feasibility": 8, "Impact": 9 },
        summary: "A well-designed solar-powered water purification system for remote areas.",
        keywords: ["solar", "water", "purification", "renewable", "remote"],
        strengths: ["Technical innovation", "Sustainability focus", "Clear implementation path"],
        weaknesses: ["Cost might be prohibitive", "Maintenance requirements not fully addressed"]
      },
      {
        hackathonId,
        teamName: "Data Pioneers",
        originalFile: "data_pioneers.txt",
        fileType: "text",
        content: "We've developed an AI-based predictive model for optimizing crop yields in drought-affected regions. Our approach combines satellite imagery with soil sensor data.",
        processed: true,
        evaluated: true,
        score: 82,
        rank: 2,
        justification: "Strong data science approach with clear agricultural applications.",
        criteriaScores: { "Innovation": 8, "Feasibility": 8, "Impact": 8 },
        summary: "AI-driven crop yield optimization for drought-affected regions.",
        keywords: ["AI", "agriculture", "drought", "prediction", "sensors"],
        strengths: ["Data integration", "Real-world testing", "Adaptation capability"],
        weaknesses: ["Requires significant technical infrastructure", "Limited to regions with data coverage"]
      },
      {
        hackathonId,
        teamName: "EcoTech Solutions",
        originalFile: "ecotech.txt",
        fileType: "text",
        content: "Our project proposes a biodegradable alternative to plastic packaging made from agricultural waste. The material decomposes within 30 days while maintaining durability during use.",
        processed: true,
        evaluated: true,
        score: 76,
        rank: 3,
        justification: "Innovative materials science application with environmental benefits.",
        criteriaScores: { "Innovation": 9, "Feasibility": 7, "Impact": 8 },
        summary: "Biodegradable packaging material made from agricultural waste.",
        keywords: ["biodegradable", "packaging", "waste", "sustainable", "material"],
        strengths: ["Waste reduction", "Novel chemical process", "Market readiness"],
        weaknesses: ["Production scaling challenges", "Limited testing in extreme conditions"]
      },
      {
        hackathonId,
        teamName: "Urban Planners",
        originalFile: "urban_solution.txt",
        fileType: "text",
        content: "We've designed an integrated urban planning tool that optimizes public transport routes based on population density and movement patterns. Our system reduces average commute times by 23%.",
        processed: true,
        evaluated: true,
        score: 71,
        rank: 4,
        justification: "Practical urban planning solution with demonstrable benefits.",
        criteriaScores: { "Innovation": 7, "Feasibility": 8, "Impact": 7 },
        summary: "Smart public transport optimization system for urban areas.",
        keywords: ["urban", "transport", "optimization", "commute", "planning"],
        strengths: ["Data-driven approach", "Immediate applicability", "User-friendly interface"],
        weaknesses: ["Requires city-wide implementation", "Privacy concerns not fully addressed"]
      },
      {
        hackathonId,
        teamName: "Health Innovators",
        originalFile: "health_app.txt",
        fileType: "text",
        content: "Our mobile application connects rural patients with medical specialists through low-bandwidth video consultations. The system includes offline functionality and prescription management.",
        processed: true,
        evaluated: true,
        score: 68,
        rank: 5,
        justification: "Good telemedicine solution for underserved populations.",
        criteriaScores: { "Innovation": 7, "Feasibility": 6, "Impact": 8 },
        summary: "Telemedicine application optimized for rural connectivity challenges.",
        keywords: ["telemedicine", "rural", "healthcare", "mobile", "connectivity"],
        strengths: ["Accessibility focus", "Offline functionality", "User research"],
        weaknesses: ["Regulatory compliance varies by region", "Limited specialist availability"]
      }
    ];
    
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
      justification: hasDummyData && 'justification' in insertSubmission ? insertSubmission.justification as string | null : null,
      criteriaScores: hasDummyData && 'criteriaScores' in insertSubmission ? insertSubmission.criteriaScores as Record<string, number> | null : null,
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
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.hackathonId === hackathonId
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
