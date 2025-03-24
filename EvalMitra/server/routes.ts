import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHackathonSchema, 
  insertSubmissionSchema, 
  updateSubmissionSchema,
  Criteria
} from "@shared/schema";
import { 
  getSubmissionFiles, 
  getFileFromMinIO, 
  deleteFileFromMinIO, 
  saveJSONToMinIO, 
  HACKATHON_BUCKET 
} from "./minio-client";
import { 
  processNonTextFile, 
  rankSubmissions, 
  extractTeamName, 
  getFileTypeFromBucket,
  analyzeSubmission
} from "./utils";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Error handler middleware
  const handleError = (res: Response, error: any) => {
    console.error('API Error:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  };

  // Get all hackathons
  apiRouter.get('/hackathons', async (req: Request, res: Response) => {
    try {
      const hackathons = await storage.getAllHackathons();
      res.json(hackathons);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get a hackathon by ID
  apiRouter.get('/hackathons/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const hackathon = await storage.getHackathon(id);
      
      if (!hackathon) {
        return res.status(404).json({ message: 'Hackathon not found' });
      }
      
      res.json(hackathon);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Create a hackathon
  apiRouter.post('/hackathons', async (req: Request, res: Response) => {
    try {
      const hackathonData = insertHackathonSchema.parse(req.body);
      
      // Check if hackathon with same name already exists
      const existingHackathon = await storage.getHackathonByName(hackathonData.name);
      if (existingHackathon) {
        return res.status(400).json({ message: 'A hackathon with this name already exists' });
      }
      
      const hackathon = await storage.createHackathon(hackathonData);
      
      // Save to MinIO
      try {
        await saveJSONToMinIO(HACKATHON_BUCKET, hackathon.id.toString(), hackathon);
      } catch (minioError) {
        console.error('Failed to save to MinIO:', minioError);
        // Continue anyway since we have it in memory
      }
      
      res.status(201).json(hackathon);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Update hackathon status
  apiRouter.patch('/hackathons/:id/status', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['not_started', 'in_progress', 'evaluating', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const hackathon = await storage.updateHackathonStatus(id, status);
      
      if (!hackathon) {
        return res.status(404).json({ message: 'Hackathon not found' });
      }
      
      res.json(hackathon);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Start evaluation process for a hackathon
  apiRouter.post('/hackathons/:id/evaluate', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const hackathon = await storage.getHackathon(id);
      
      if (!hackathon) {
        return res.status(404).json({ message: 'Hackathon not found' });
      }
      
      // Update status to evaluating
      await storage.updateHackathonStatus(id, 'evaluating');
      
      // Process starts asynchronously, return immediate response
      res.json({ message: 'Evaluation process started', hackathonId: id });
      
      // Start the evaluation process in the background
      processHackathonSubmissions(hackathon.id, hackathon.name, hackathon.criteria)
        .catch(error => console.error('Background evaluation process failed:', error));
      
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get all submissions for a hackathon
  apiRouter.get('/hackathons/:id/submissions', async (req: Request, res: Response) => {
    try {
      const hackathonId = parseInt(req.params.id);
      const submissions = await storage.getSubmissionsByHackathon(hackathonId);
      res.json(submissions);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get a specific submission
  apiRouter.get('/submissions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      res.json(submission);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Get detailed analysis for a submission
  apiRouter.get('/submissions/:id/analysis', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getSubmission(id);
      
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }
      
      if (!submission.evaluated) {
        return res.status(400).json({ message: 'Submission has not been evaluated yet' });
      }
      
      // Get analysis data (or compute it if not available)
      let analysisData;
      if (submission.summary && submission.keywords && submission.strengths && submission.weaknesses) {
        analysisData = {
          summary: submission.summary,
          keywords: submission.keywords,
          strengths: submission.strengths,
          weaknesses: submission.weaknesses
        };
      } else {
        analysisData = await analyzeSubmission(submission);
        
        // Save the analysis results
        await storage.updateSubmission(id, {
          summary: analysisData.summary,
          keywords: analysisData.keywords,
          strengths: analysisData.strengths,
          weaknesses: analysisData.weaknesses
        });
      }
      
      res.json(analysisData);
    } catch (error) {
      handleError(res, error);
    }
  });

  // Helper function to process all submissions for a hackathon
  async function processHackathonSubmissions(
    hackathonId: number, 
    hackathonName: string,
    criteria: Criteria[]
  ): Promise<void> {
    try {
      // 1. Find all submission files from MinIO
      const submissionFiles = await getSubmissionFiles(hackathonName);
      
      if (submissionFiles.length === 0) {
        console.log(`No submissions found for hackathon: ${hackathonName}`);
        return;
      }
      
      console.log(`Processing ${submissionFiles.length} submissions for ${hackathonName}`);
      
      // 2. Process each file
      const processedSubmissions: { teamName: string, content: string }[] = [];
      
      for (const { bucket, objectName } of submissionFiles) {
        try {
          // Extract team name
          const teamName = extractTeamName(objectName, hackathonName);
          const fileType = getFileTypeFromBucket(bucket);
          
          // Get file content
          const fileBuffer = await getFileFromMinIO(bucket, objectName);
          
          // Process content based on file type
          let textContent: string;
          
          if (bucket === 'text-bucket') {
            textContent = fileBuffer.toString('utf-8');
          } else {
            textContent = await processNonTextFile(fileType, fileBuffer);
          }
          
          // Save as submission
          const submission = await storage.createSubmission({
            hackathonId,
            teamName,
            originalFile: objectName,
            fileType,
            content: textContent,
          });
          
          // Add to processed list
          processedSubmissions.push({
            teamName,
            content: textContent
          });
          
          // Update submission as processed
          await storage.updateSubmission(submission.id, { processed: true });
          
          // Delete the file after processing
          await deleteFileFromMinIO(bucket, objectName);
          
        } catch (error) {
          console.error(`Error processing submission ${objectName}:`, error);
          // Continue with other submissions
        }
      }
      
      // 3. Rank all processed submissions
      if (processedSubmissions.length > 0) {
        const rankedResults = await rankSubmissions(processedSubmissions, criteria);
        
        // 4. Update submissions with rankings and evaluation data
        for (const result of rankedResults) {
          // Find the submission by team name
          const submissions = await storage.getSubmissionsByHackathon(hackathonId);
          const submission = submissions.find(s => s.teamName === result.teamName);
          
          if (submission) {
            await storage.updateSubmission(submission.id, {
              score: result.score,
              rank: result.rank,
              justification: result.justification,
              criteriaScores: result.criteriaScores,
              summary: result.summary,
              keywords: result.keywords,
              strengths: result.strengths,
              weaknesses: result.weaknesses,
              evaluated: true
            });
          }
        }
      }
      
      // 5. Update hackathon status to completed
      await storage.updateHackathonStatus(hackathonId, 'completed');
      console.log(`Evaluation completed for hackathon: ${hackathonName}`);
      
    } catch (error) {
      console.error(`Failed to process hackathon submissions:`, error);
      // Update status to indicate failure
      await storage.updateHackathonStatus(hackathonId, 'in_progress');
    }
  }

  app.use('/api', apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
