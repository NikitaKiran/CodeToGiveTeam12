import React, { useState, useRef } from 'react';
import { 
  FileFormat, 
  getFormatDescription,
  UploadProgressInfo
} from '@/types/file';

interface FileUploaderProps {
  activeFormat: FileFormat;
  onFileSelect: (file: File) => void;
  uploadProgress: UploadProgressInfo[];
  isUploading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  activeFormat, 
  onFileSelect,
  uploadProgress,
  isUploading
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          onChange={handleFileInput}
          accept={getFormatDescription(activeFormat)}
        />
        
        <span className="material-icons text-4xl text-gray-400 mb-2">cloud_upload</span>
        
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop your file here, or click to browse
        </p>
        
        <p className="text-xs text-gray-500">
          {getFormatDescription(activeFormat)}
        </p>
      </div>
      
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadProgress.map((file) => (
            <div 
              key={file.filename}
              className="bg-primary-50 rounded-lg p-4 flex items-center"
            >
              <span className="material-icons text-primary-600 mr-3">
                {file.progress < 100 ? "upload_file" : "check_circle"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary-600 h-1.5 rounded-full" 
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-xs text-gray-500 ml-2">{file.progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
