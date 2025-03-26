import { Client } from 'minio';
import { storage } from './storage';
import stream from "stream";
import { Submission, Hackathon } from '@/lib/minio-client';
import { get } from 'http';

// Create MinIO client
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9100'),
  useSSL: process.env.MINIO_USE_SSL === 'false',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Bucket names
export const HACKATHON_BUCKET = 'hackathon';
export const RESULT_BUCKET = 'results';

export const SUBMISSION_BUCKETS = [
  'text-bucket',
  'audio-bucket',
  'image-bucket',
  'video-bucket',
  'pdf-bucket',
  'docx-bucket',
  
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

//Get all hackathons
export async function getHackathons(): Promise<Hackathon[]> {
  try {
    const hackathons: Hackathon[] = [];
    const objectsStream = minioClient.listObjects(HACKATHON_BUCKET, '', true);

    const promises: Promise<void>[] = [];

    await new Promise((resolve, reject) => {
      objectsStream.on('data', (obj) => {
        if (obj.name) {
          const promise = getJSONFromMinIO(HACKATHON_BUCKET, obj.name)
            .then((hackathonData) => {
              hackathons.push(hackathonData as Hackathon);
            })
            .catch((error) => {
              console.error(`Error fetching hackathon data for ${obj.name}:`, error);
            });

          promises.push(promise);
        }
      });

      objectsStream.on('end', async () => {
        await Promise.all(promises);
        resolve(null);
      });

      objectsStream.on('error', reject);
    });

    return hackathons;
  } catch (error) {
    console.error(`Error listing hackathon files: ${error}`);
    throw error;
  }
}




// export async function getResults(hackathonId : number): Promise<Record<string, any>[]>
// {
//   try {
//     const results: { bucket: string, objectName: string }[] = [];
    
//     // Search through all submission buckets
    
//       // Check if bucket exists
//       const bucketExists = await minioClient.bucketExists(RESULT_BUCKET);
//       if (!bucketExists) continue;

//       // List all objects in bucket
//       const objectsStream = minioClient.listObjects(RESULT_BUCKET, '', true);
//       const hackathon = await storage.getHackathon(hackathonId);
//       // if(!hackathon)
      
//       await new Promise((resolve, reject) => {
//         objectsStream.on('data', (obj) => {
//           if (obj.name && obj.name.includes(`_${hackathon.id}.`)) {
//             submissions.push({
//               bucket,
//               objectName: obj.name
//             });
//           }
//         });
//         objectsStream.on('end', resolve);
//         objectsStream.on('error', reject);
//       });
    
    
//     return submissions;
//   } catch (error) {
//     console.error(`Error listing submission files: ${error}`);
//     throw error;
//   }
// }


// export async function getResults(hackathonName: string): Promise<Record<string, any>[]> {
//   try {
//     const results: Record<string, any>[] = [];

//     // Check if bucket exists
//     const bucketExists = await minioClient.bucketExists(RESULT_BUCKET);
//     if (!bucketExists) {
//       console.warn(`Bucket "${RESULT_BUCKET}" does not exist.`);
//       return results; // Return empty list if bucket does not exist
//     }

//     // Get hackathon details
//     // const hackathon = await storage.getHackathon(hackathonId);
//     // if (!hackathon) {
//     //   throw new Error(`Hackathon with ID ${hackathonId} not found.`);
//     // }

//     // List all objects in the bucket
//     const objectsStream = minioClient.listObjects(RESULT_BUCKET, "", true);

//     await new Promise<void>((resolve, reject) => {
//       objectsStream.on("data", async (obj) => {
//         if (obj.name && obj.name.includes(`_${hackathonName}.`)) {
//           try {
//             // Download the object from MinIO
//             const objectStream = await minioClient.getObject(RESULT_BUCKET, obj.name);
            
//             // Convert stream to string
//             const data = await streamToString(objectStream);
//             const jsonData = JSON.parse(data);

//             // Add full JSON result to the list
//             results.push(jsonData);
//           } catch (error) {
//             console.error(`Error fetching object ${obj.name}:`, error);
//           }
//         }
//       });

//       objectsStream.on("end", resolve);
//       objectsStream.on("error", reject);
//     });

//     return results;
//   } catch (error) {
//     console.error(`Error listing submission files: ${error}`);
//     throw error;
//   }
// }

export async function getResults(hackathonName: string): Promise<Submission[]> {
  try {
    const results: Submission[] = [];

    // Check if the MinIO bucket exists
    const bucketExists = await minioClient.bucketExists(RESULT_BUCKET);
    if (!bucketExists) {
      console.warn(`Bucket "${RESULT_BUCKET}" does not exist.`);
      return results;
    }

    const objectsStream = minioClient.listObjects(RESULT_BUCKET, "", true);
    // const regex = new RegExp(`_${hackathonName}\\.json$`); // Ensures "_Hack2.json" is at the end
    const regex = new RegExp(`_${hackathonName}(\\.|$)`);

    await new Promise<void>((resolve, reject) => {
      const promises: Promise<void>[] = [];
      
      objectsStream.on("data", (obj) => {
        console.log(obj.name);
        const regex = new RegExp(`_${hackathonName.trim()}\\.json$`);
        if (obj.name && (obj.name.includes(`_${hackathonName}`) || obj.name === `${hackathonName}.json`)){
          // Create an async function for processing the file, and add its promise to the array
          const p = (async () => {
            try {
              const objectStream = await minioClient.getObject(RESULT_BUCKET, obj.name!);
              const data = await streamToString(objectStream);
              const parsedData = JSON.parse(data);
              console.log(parsedData);
      
              const submission: Submission = {
                id: parsedData.id,
                hackathonId: parsedData.hackathonId,
                teamName: parsedData.teamName,
                originalFile: obj.name!,
                fileType: parsedData.fileType,
                content: parsedData.content || null,
                score: parsedData.score ?? null,
                rank: parsedData.rank ?? null,
                justification:
                  typeof parsedData.justification === "object" && parsedData.justification !== null
                    ? parsedData.justification
                    : {},
                criteriaScores: parsedData.scores || {},
                oldCriteriaScores: parsedData.oldCriteriaScores || {},
                summary: parsedData.summary || null,
                keywords: parsedData.keywords || [],
                strengths: parsedData.strengths || [],
                weaknesses: parsedData.weaknesses || [],
                processed: parsedData.processed ?? false,
                evaluated: parsedData.evaluated ?? false,
              };
      
              results.push(submission);
            } catch (error) {
              console.error(`Error fetching object ${obj.name}:`, error);
            }
          })();
          promises.push(p);
        }
      });
      
      objectsStream.on("end", () => {
        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      });
      
      objectsStream.on("error", reject);
    });
    console.log("results.length: ",results.length)
    return results;
  } catch (error) {
    console.error(`Error listing submission files: ${error}`);
    throw error;
  }
}
/**
 * Converts a readable stream to a string.
 */
function streamToString(readableStream: stream.Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (chunk) => chunks.push(chunk));
    readableStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    readableStream.on("error", reject);
  });
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
