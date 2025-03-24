import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileFormat, UploadProgressInfo } from "@/types/file";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File, fileType: FileFormat): Promise<void> => {
    setIsUploading(true);
    
    // Add file to progress tracking
    setUploadProgress(prev => [
      ...prev,
      { filename: file.name, progress: 0 }
    ]);

    try {
      // Create FormData object to send file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      // Custom upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the XHR response
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.open('POST', '/api/files/upload', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            
            // Update progress for this file
            setUploadProgress(prev => 
              prev.map(item => 
                item.filename === file.name 
                  ? { ...item, progress: percentComplete } 
                  : item
              )
            );
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred during upload'));
        };
        
        xhr.send(formData);
      });
      
      // Wait for upload to complete
      await uploadPromise;
      
      // Invalidate file list query to refresh the file list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded.`,
        variant: "default",
      });
      
      // After a successful upload, keep 100% for a moment then remove from progress
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.filename !== file.name));
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      
      // Remove failed upload from progress
      setUploadProgress(prev => prev.filter(item => item.filename !== file.name));
    } finally {
      // If no more uploads in progress, set isUploading to false
      if (uploadProgress.length === 0) {
        setIsUploading(false);
      }
    }
  };

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    clearUploadProgress: () => setUploadProgress([])
  };
};
