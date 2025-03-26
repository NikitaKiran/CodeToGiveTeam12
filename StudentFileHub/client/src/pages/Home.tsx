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
import { apiRequest } from '@/lib/queryClient';
import { getHackathon } from '@/lib/minio-client'; // Import the function


const Home: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<FileFormat>('text');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const { uploadFile, uploadProgress, isUploading } = useFileUpload();
  const { toast } = useToast();

  const handleFormatChange = (format: FileFormat) => {
    setActiveFormat(format);
  };

  // const handleFileSelect = (file: File) => {
  //   // Check if file extension is supported for the selected format
  //   const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  //   const allowedExtensions = supportedExtensions[activeFormat];
    
  //   if (!allowedExtensions.includes(fileExtension)) {
  //     toast({
  //       title: 'Invalid file format',
  //       description: `Only ${allowedExtensions.join(', ')} are supported for ${activeFormat} files.`,
  //       variant: 'destructive',
  //     });
  //     return;
  //   }
    
  //   // Upload the file
  //   uploadFile(file, activeFormat);
  // };

  const handleFileSelect = async (file: File) => {
    console.log("Handlefileselect called")
    // Validate file format
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
  
    // Upload the file (this function returns void)
    console.log("uploadfile called")
    await uploadFile(file, activeFormat);
  
    const hackathonId = 4; // Replace with actual hackathon ID

    // Fetch hackathon details
    const hackathonDetails = await getHackathon(hackathonId);
    if (!hackathonDetails) {
      toast({
        title: "Error",
        description: "Hackathon not found",
        variant: "destructive",
      });
      return;
    }

    console.log(hackathonDetails);
  
    try {
  
      // Prepare form data for submission
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", activeFormat);
      formData.append("theme", hackathonDetails.theme);
      formData.append("criteria", JSON.stringify(hackathonDetails.criteria));
      formData.append("hackathonId", String(hackathonId));

      console.log(`Form Data : ${formData}`);
      console.log("Calling API /submit");
  
      // Make API call to `/submit`
      const response = await fetch("http://127.0.0.1:5001/submit", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) throw new Error("Submission failed");
  
      toast({
        title: "Success",
        description: "File submitted successfully!",
      });
    } catch (error) {
      console.error("Error submitting file:", error);
      toast({
        title: "Error",
        description: "Failed to submit file.",
        variant: "destructive",
      });
    }
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
              
              <div className="mt-6 flex">
                Pls save the file in the following format: TeamName_HackathonName.extension

              </div>

              <RecentUploads onSelectFile={handleFileClick} />
            </div>
          </div>
              {/* </div>
              
              <RecentUploads onSelectFile={handleFileClick} />
            </div>
          </div> */}
          
          {/* File Viewer Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <FileViewer file={selectedFile} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
