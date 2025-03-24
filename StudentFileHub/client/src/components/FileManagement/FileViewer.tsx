import React, { useState, useEffect } from 'react';
import { FileInfo, FileFormat, formatIcons } from '@/types/file';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FileViewerProps {
  file: FileInfo | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ file }) => {
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (file) {
      setIsLoading(true);
      
      // Get content URL for viewing
      fetch(`/api/files/${file.id}/content`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to get content URL');
          setContentUrl(`/api/files/${file.id}/content`);
        })
        .catch(error => {
          console.error('Error fetching content URL:', error);
          toast({
            title: 'Error',
            description: 'Failed to load file content',
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoading(false));
      
      // Get download URL
      fetch(`/api/files/${file.id}/download`)
        .then(response => response.json())
        .then(data => setDownloadUrl(data.downloadUrl))
        .catch(error => console.error('Error fetching download URL:', error));
    } else {
      setContentUrl(null);
      setDownloadUrl(null);
    }
  }, [file, toast]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    
    try {
      await apiRequest('DELETE', `/api/files/${file.id}`, undefined);
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  if (!file) {
    return (
      <div className="file-viewer" data-format="empty">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-icons text-3xl text-gray-400">insert_drive_file</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No file selected</h3>
          <p className="text-sm text-gray-500 max-w-sm">Upload a file or select one from your recent uploads to view it here.</p>
          <button className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100">
            <span className="material-icons text-sm mr-1">cloud_upload</span>
            Upload a file
          </button>
        </div>
      </div>
    );
  }

  const renderViewer = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!contentUrl) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500">Failed to load file content</p>
        </div>
      );
    }

    switch (file.fileType) {
      case 'text':
        return (
          <div className="bg-gray-50 p-5 rounded-lg font-mono text-sm text-gray-800 h-full overflow-auto">
            <iframe 
              src={contentUrl} 
              className="w-full h-[400px] border-0" 
              title={file.originalName} 
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4">
            <img 
              src={contentUrl} 
              alt={file.originalName} 
              className="max-w-full max-h-[500px] object-contain rounded" 
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-5xl text-gray-500">audiotrack</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-3">{file.originalName}</p>
              
              <audio 
                controls 
                className="w-full max-w-lg"
                src={contentUrl}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <video 
              controls 
              className="w-full" 
              src={contentUrl}
            >
              Your browser does not support the video element.
            </video>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="bg-gray-100 p-2 rounded-lg">
            <div className="flex justify-between items-center mb-3 p-2">
              <div className="flex items-center">
                <span className="material-icons text-gray-600 mr-2">picture_as_pdf</span>
                <span className="text-sm font-medium">{file.originalName}</span>
              </div>
            </div>
            
            <iframe 
              src={contentUrl} 
              className="w-full h-[500px] border-0" 
              title={file.originalName} 
            />
          </div>
        );
      
      case 'docx':
        return (
          <div className="bg-gray-100 p-2 rounded-lg">
            <div className="flex justify-between items-center mb-3 p-2">
              <div className="flex items-center">
                <span className="material-icons text-gray-600 mr-2">article</span>
                <span className="text-sm font-medium">{file.originalName}</span>
              </div>
            </div>
            
            <div className="bg-white shadow-md p-8 mx-auto overflow-auto" style={{ maxWidth: "612px", minHeight: "400px" }}>
              <div className="text-center p-8">
                <p className="text-gray-500">Preview not available. Please download to view.</p>
                <button 
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Download File
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center p-8">
            <p className="text-gray-500">Preview not available for this file type</p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="material-icons text-gray-500 mr-2">
            {formatIcons[file.fileType]}
          </span>
          <h2 className="text-lg font-medium text-gray-900">{file.originalName}</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={handleDownload}
          >
            <span className="material-icons">file_download</span>
          </button>
          <button 
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={handleDelete}
          >
            <span className="material-icons">delete</span>
          </button>
          <button className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <span className="material-icons">fullscreen</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {renderViewer()}
      </div>
    </>
  );
};

export default FileViewer;
