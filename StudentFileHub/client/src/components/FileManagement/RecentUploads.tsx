import React from 'react';
import { 
  FileInfo, 
  formatFileSize, 
  formatTimestamp,
  formatIcons,
  formatLabels
} from '@/types/file';
import { useQuery } from '@tanstack/react-query';

interface RecentUploadsProps {
  onSelectFile: (file: FileInfo) => void;
}

const RecentUploads: React.FC<RecentUploadsProps> = ({ onSelectFile }) => {
  const { 
    data: files,
    isLoading,
    error
  } = useQuery<FileInfo[]>({
    queryKey: ['/api/files'],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-md font-medium text-gray-900 mb-3">Recent Uploads</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-md border border-gray-200 p-3 flex items-center">
              <div className="w-6 h-6 bg-gray-300 rounded mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h3 className="text-md font-medium text-gray-900 mb-3">Recent Uploads</h3>
        <div className="p-4 text-red-700 bg-red-50 rounded-md">
          <p>Error loading files. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-md font-medium text-gray-900 mb-3">Recent Uploads</h3>
      
      {files && files.length > 0 ? (
        <div className="space-y-3">
          {files.slice(0, 5).map((file) => (
            <div 
              key={file.id} 
              className="file-card bg-white rounded-md border border-gray-200 p-3 flex items-center hover:border-primary-200 cursor-pointer transition-all"
              onClick={() => onSelectFile(file)}
            >
              <span className="material-icons text-gray-500 mr-3">
                {formatIcons[file.fileType]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatLabels[file.fileType]} • {formatFileSize(file.size)} • {formatTimestamp(file.uploadedAt)}
                </p>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <span className="material-icons">more_vert</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <span className="material-icons text-3xl text-gray-400 mb-2">cloud_upload</span>
          <p className="text-sm text-gray-600">No files uploaded yet</p>
          <p className="text-xs text-gray-500 mt-1">Upload a file to see it here</p>
        </div>
      )}
    </div>
  );
};

export default RecentUploads;
