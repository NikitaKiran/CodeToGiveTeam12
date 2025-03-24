import React from 'react';
import { FileInfo, formatFileSize, formatIcons, formatLabels } from '@/types/file';

interface FileDetailsProps {
  file: FileInfo | null;
}

const FileDetails: React.FC<FileDetailsProps> = ({ file }) => {
  if (!file) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-6">
      <h3 className="text-md font-medium text-gray-900 mb-4">File Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dl className="space-y-3">
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">Name:</dt>
              <dd className="text-sm text-gray-900">{file.originalName}</dd>
            </div>
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">Type:</dt>
              <dd className="text-sm text-gray-900">{formatLabels[file.fileType]}</dd>
            </div>
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">Size:</dt>
              <dd className="text-sm text-gray-900">{formatFileSize(file.size)}</dd>
            </div>
          </dl>
        </div>
        
        <div>
          <dl className="space-y-3">
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">Uploaded:</dt>
              <dd className="text-sm text-gray-900">{formatDate(file.uploadedAt)}</dd>
            </div>
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">Storage:</dt>
              <dd className="text-sm text-gray-900">MinIO / {file.bucketName}</dd>
            </div>
            <div className="flex items-start">
              <dt className="w-24 flex-shrink-0 text-sm font-medium text-gray-500">URL:</dt>
              <dd className="text-sm text-gray-900 truncate max-w-xs">
                <span className="text-primary-600">
                  {file.path}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
