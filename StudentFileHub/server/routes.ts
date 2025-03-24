import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as fileStorage } from "./storage";
import multer from "multer";
import path from "path";
import { fileExtensionSchema } from "@shared/schema";
import { insertFileSchema } from "@shared/schema";
import { z } from "zod";
import * as minio from "minio";
import express from "express";
import axios from "axios";
import fetch from "node-fetch";
import FormData from "form-data";

const fs = require('fs');
const router = express.Router();

// Configure MinIO client
const minioClient = new minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9100'),
  useSSL: process.env.MINIO_USE_SSL === 'false',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

class MockMinioAdapter {
  private fileBuffers: Map<string, { buffer: Buffer, metadata: any }>;
  private buckets: Set<string>;
  
  constructor() {
    this.fileBuffers = new Map();
    this.buckets = new Set();
    console.log('Using Mock MinIO Adapter for development');
  }
  
  async bucketExists(bucketName: string): Promise<boolean> {
    return this.buckets.has(bucketName);
  }
  
  async makeBucket(bucketName: string, region: string): Promise<void> {
    this.buckets.add(bucketName);
    console.log(`Mock: Created bucket ${bucketName}`);
  }
  
  async putObject(bucketName: string, objectName: string, 
                 buffer: Buffer, size: number, 
                 metadata: any): Promise<void> {
    const key = `${bucketName}/${objectName}`;
    this.fileBuffers.set(key, { buffer, metadata });
    console.log(`Mock: Stored object ${key} (${size} bytes)`);
  }
  
  async getObject(bucketName: string, objectName: string): Promise<any> {
    const key = `${bucketName}/${objectName}`;
    const data = this.fileBuffers.get(key);
    
    if (!data) {
      throw new Error(`Object ${key} not found`);
    }
    
    // Return a stream-like object with pipe method
    return {
      pipe: (res: any) => {
        res.write(data.buffer);
        res.end();
      }
    };
  }
  
  async presignedGetObject(bucketName: string, objectName: string, 
                           expires: number): Promise<string> {
    // Returns a fake presigned URL
    return `/mock/presigned/${bucketName}/${objectName}`;
  }
  
  async removeObject(bucketName: string, objectName: string): Promise<void> {
    const key = `${bucketName}/${objectName}`;
    this.fileBuffers.delete(key);
    console.log(`Mock: Removed object ${key}`);
  }
}

// Use mock adapter if MinIO connection fails
let minioAdapter: any = minioClient;
// We'll replace this with mock adapter in the ensureBucketsExist function if needed

// Set up multer for file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Create buckets if they don't exist
async function ensureBucketsExist() {
  const buckets = ['text-bucket', 'audio-bucket', 'image-bucket', 'video-bucket', 'pdf-bucket', 'docx-bucket'];
  
  try {
    // Test MinIO connection
    for (const bucket of buckets) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`Created bucket: ${bucket}`);
      }
    }
  } catch (error) {
    console.error('MinIO connection failed, using mock adapter instead:', (error as Error).message);
    // Switch to mock adapter
    minioAdapter = new MockMinioAdapter();
    
    // Create mock buckets
    for (const bucket of buckets) {
      await minioAdapter.makeBucket(bucket, 'us-east-1');
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize MinIO buckets
  await ensureBucketsExist();

  // API route to upload a file
  app.post('/api/files/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileType = req.body.fileType;
      if (!fileType || !['text', 'audio', 'image', 'video', 'pdf', 'docx'].includes(fileType)) {
        return res.status(400).json({ message: 'Invalid file type' });
      }

      // Get file extension
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const supportedExtensions = {
        text: ['.txt', '.md', '.js', '.json', '.html', '.css', '.ts', '.tsx'],
        audio: ['.mp3', '.wav', '.ogg', '.m4a'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        video: ['.mp4', '.webm', '.mov', '.avi'],
        pdf: ['.pdf'],
        docx: ['.doc', '.docx']
      };

      if (!supportedExtensions[fileType].includes(fileExtension)) {
        return res.status(400).json({ 
          message: `File extension ${fileExtension} not supported for ${fileType} format. Supported formats: ${supportedExtensions[fileType].join(', ')}` 
        });
      }

      // Generate a unique filename
      const uniqueFilename = `${Date.now()}-${path.basename(req.file.originalname)}`;
      const bucketName = `${fileType}-bucket`;

      // Upload file to MinIO
      await minioAdapter.putObject(
        bucketName,
        uniqueFilename,
        req.file.buffer,
        req.file.size,
        { 'Content-Type': req.file.mimetype }
      );

      // Prepare form data for API call
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      // Send the file to the corresponding API
      const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
      });

      const apiResponse = await response.json();
      console.log('API Response:', apiResponse);

      // Cleanup: remove local file after upload & API call
      fs.unlinkSync(filePath);
      
      res.json({ message: 'File uploaded & sent to API', apiResponse });

      // Save file info to storage
      const fileData = {
        filename: uniqueFilename,
        originalName: req.file.originalname,
        fileType,
        mimeType: req.file.mimetype,
        size: req.file.size,
        bucketName,
        path: `/${bucketName}/${uniqueFilename}`,
        userId: 1, // Default user ID (would be from auth in real app)
      };

      const file = await fileStorage.createFile(fileData);

      res.status(201).json({ 
        message: 'File uploaded successfully',
        file 
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
  });

  // API route to get list of files
  app.get('/api/files', async (req, res) => {
    try {
      const files = await fileStorage.getFiles();
      res.status(200).json(files);
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ message: 'Error getting files' });
    }
  });

  // API route to get a file by ID
  app.get('/api/files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const file = await fileStorage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.status(200).json(file);
    } catch (error) {
      console.error('Error getting file:', error);
      res.status(500).json({ message: 'Error getting file' });
    }
  });

  // API route to download a file
  app.get('/api/files/:id/download', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const file = await fileStorage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Generate a presigned URL for downloading
      const presignedUrl = await minioAdapter.presignedGetObject(
        file.bucketName,
        file.filename,
        24 * 60 * 60 // URL expires in 24 hours
      );

      res.status(200).json({ downloadUrl: presignedUrl });
    } catch (error) {
      console.error('Error generating download URL:', error);
      res.status(500).json({ message: 'Error generating download URL' });
    }
  });

  // API route to get file content for viewing
  app.get('/api/files/:id/content', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const file = await fileStorage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Stream the file directly from MinIO to the client
      const fileStream = await minioAdapter.getObject(file.bucketName, file.filename);
      
      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error streaming file' });
    }
  });

  // API route to delete a file
  app.delete('/api/files/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid file ID' });
      }

      const file = await fileStorage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      try {
        // Delete from MinIO
        await minioAdapter.removeObject(file.bucketName, file.filename);
      } catch (minioError) {
        console.error('Error removing file from MinIO:', minioError);
        // Continue anyway to remove from storage
      }
      
      // Delete from storage
      await fileStorage.deleteFile(id);

      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ message: 'Error deleting file' });
    }
  });

  // export async function registerRoutes(app: Express): Promise<Server> {
    router.post("/submit", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }
    
        const { fileType, theme, criteria } = req.body;
        if (!fileType || !theme || !criteria) {
          return res.status(400).json({ error: "Missing required fields" });
        }
    
        const formData = new FormData();
        formData.append("file", req.file.buffer, req.file.originalname);
        formData.append("fileType", fileType);
        formData.append("theme", theme);
        formData.append("criteria", criteria);
    
        const response = await fetch("http://127.0.0.1:5000/submit", {
          method: "POST",
          body: formData,
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          return res.status(response.status).json({ error: "Submission failed", details: errorText });
        }
    
        return res.status(200).json({ message: "File submitted successfully" });
      } catch (error) {
        console.error("Error submitting file:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

  const httpServer = createServer(app);
  return httpServer;
}
