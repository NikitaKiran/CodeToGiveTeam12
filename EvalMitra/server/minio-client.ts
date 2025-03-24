import { Client } from 'minio';

// Create MinIO client
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Bucket names
export const HACKATHON_BUCKET = 'hackathon';
export const SUBMISSION_BUCKETS = [
  'text-bucket',
  'audio-bucket',
  'image-bucket',
  'video-bucket',
  'pdf-bucket',
  'docx-bucket'
];

// Save JSON data to MinIO
export async function saveJSONToMinIO(
  bucketName: string,
  objectKey: string,
  data: any
): Promise<void> {
  try {
    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
    }

    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    
    // Upload to MinIO
    await minioClient.putObject(
      bucketName,
      objectKey,
      Buffer.from(jsonData),
      jsonData.length,
      { 'Content-Type': 'application/json' }
    );
    
    console.log(`Successfully saved ${objectKey} to ${bucketName}`);
  } catch (error) {
    console.error(`Error saving to MinIO: ${error}`);
    throw error;
  }
}

// Get JSON data from MinIO
export async function getJSONFromMinIO(
  bucketName: string,
  objectKey: string
): Promise<any> {
  try {
    // Check if object exists
    const dataStream = await minioClient.getObject(bucketName, objectKey);
    
    // Read the data
    return new Promise((resolve, reject) => {
      let dataString = '';
      dataStream.on('data', (chunk) => {
        dataString += chunk.toString();
      });
      dataStream.on('end', () => {
        resolve(JSON.parse(dataString));
      });
      dataStream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error retrieving from MinIO: ${error}`);
    throw error;
  }
}

// Get all submission files for a hackathon
export async function getSubmissionFiles(hackathonName: string): Promise<{ bucket: string, objectName: string }[]> {
  try {
    const submissions: { bucket: string, objectName: string }[] = [];
    
    // Search through all submission buckets
    for (const bucket of SUBMISSION_BUCKETS) {
      // Check if bucket exists
      const bucketExists = await minioClient.bucketExists(bucket);
      if (!bucketExists) continue;

      // List all objects in bucket
      const objectsStream = minioClient.listObjects(bucket, '', true);
      
      await new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          if (obj.name && obj.name.includes(`_${hackathonName}.`)) {
            submissions.push({
              bucket,
              objectName: obj.name
            });
          }
        });
        objectsStream.on('end', resolve);
        objectsStream.on('error', reject);
      });
    }
    
    return submissions;
  } catch (error) {
    console.error(`Error listing submission files: ${error}`);
    throw error;
  }
}

// Get file content from MinIO
export async function getFileFromMinIO(
  bucketName: string,
  objectName: string
): Promise<Buffer> {
  try {
    const dataStream = await minioClient.getObject(bucketName, objectName);
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      dataStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      dataStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      dataStream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error retrieving file from MinIO: ${error}`);
    throw error;
  }
}

// Delete file from MinIO
export async function deleteFileFromMinIO(
  bucketName: string,
  objectName: string
): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, objectName);
    console.log(`Successfully deleted ${objectName} from ${bucketName}`);
  } catch (error) {
    console.error(`Error deleting file from MinIO: ${error}`);
    throw error;
  }
}
