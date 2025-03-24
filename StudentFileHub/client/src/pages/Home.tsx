import React, { useState } from 'react';
import Header from '@/components/Layout/Header';
import FormatSelector from '@/components/FileManagement/FormatSelector';
import FileUploader from '@/components/FileManagement/FileUploader';
import RecentUploads from '@/components/FileManagement/RecentUploads';
import FileViewer from '@/components/FileManagement/FileViewer';
import FileDetails from '@/components/FileManagement/FileDetails';
import { FileFormat, FileInfo, supportedExtensions } from '@/types/file';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<FileFormat>('text');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const { uploadFile, uploadProgress, isUploading } = useFileUpload();
  const { toast } = useToast();

  const handleFormatChange = (format: FileFormat) => {
    setActiveFormat(format);
  };

  const handleFileSelect = (file: File) => {
    // Check if file extension is supported for the selected format
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const allowedExtensions = supportedExtensions[activeFormat];
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: 'Invalid file format',
        description: `Only ${allowedExtensions.join(', ')} are supported for ${activeFormat} files.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Upload the file
    uploadFile(file, activeFormat);
  };

  const handleFileClick = (file: FileInfo) => {
    setSelectedFile(file);
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
              
              <FormatSelector 
                activeFormat={activeFormat} 
                onFormatChange={handleFormatChange} 
              />
              
              <FileUploader 
                activeFormat={activeFormat}
                onFileSelect={handleFileSelect}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
              />
              
              <div className="mt-6 flex justify-end">
                <button 
                  type="button" 
                  disabled={uploadProgress.length === 0}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    uploadProgress.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
                >
                  <span className="material-icons text-sm mr-1">cloud_upload</span>
                  Upload to Storage
                </button>
              </div>
              
              <RecentUploads onSelectFile={handleFileClick} />
            </div>
          </div>
          
          {/* File Viewer Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <FileViewer file={selectedFile} />
            </div>
            
            <FileDetails file={selectedFile} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
