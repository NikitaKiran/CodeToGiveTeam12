import { files, type File, type InsertFile, users, type User, type InsertUser } from "@shared/schema";
import { 
  Hackathon
} from '@shared/schema';
import { saveJSONToMinIO, getJSONFromMinIO, HACKATHON_BUCKET } from './minio-client';

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  getFiles(): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<void>;
  getFilesByType(fileType: string): Promise<File[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private files: Map<number, File>;
  private hackathons: Map<number, Hackathon>;
  private userCurrentId: number;
  private fileCurrentId: number;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.hackathons = new Map();
    this.userCurrentId = 1;
    this.fileCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // File methods
  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values()).sort((a, b) => {
      // Sort by most recent first
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileCurrentId++;
    const file: File = { 
      ...insertFile, 
      id,
      uploadedAt: new Date()
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  async getFilesByType(fileType: string): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.fileType === fileType)
      .sort((a, b) => {
        // Sort by most recent first
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      });
  }

  async getHackathon(id: number): Promise<Hackathon | undefined> {
    // Try to get from memory first
    const hackathon = this.hackathons.get(id);
    if (hackathon) return hackathon;
    console.log("In getHacakthon().")
    
    // If not in memory, try to fetch from MinIO
    try {
      const minioHackathon = await getJSONFromMinIO(HACKATHON_BUCKET, id.toString());
      console.log("In try bloack, after json is fetched.")
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
}

export const storage = new MemStorage();
