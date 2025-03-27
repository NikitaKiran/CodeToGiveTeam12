import React, { useState, useEffect } from 'react';
import Header from '@/components/Layout/Header';
import FormatSelector from '@/components/FileManagement/FormatSelector';
import FileUploader from '@/components/FileManagement/FileUploader';
import RecentUploads from '@/components/FileManagement/RecentUploads';
import FileViewer from '@/components/FileManagement/FileViewer';
import FileDetails from '@/components/FileManagement/FileDetails';
import { FileFormat, FileInfo, supportedExtensions } from '@/types/file';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

// Define an interface for the Hackathon type
interface Hackathon {
  id: number | string;
  name: string;
  start_date: string;
  end_date: string;
  theme: string;
  description: string;
  criteria: any[];
}

const Home: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState<FileFormat>('text');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [activeHackathons, setActiveHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');

  const { uploadFile, uploadProgress, isUploading } = useFileUpload();
  const { toast } = useToast();

  // Find the currently selected hackathon
  const selectedHackathon = activeHackathons.find(
    hack => String(hack.id) === selectedHackathonId
  );

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await fetch("/api/hackathons/active");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: Hackathon[] = await response.json();
        
        console.log('Hackathons fetched:', data);
        
        if (data.length > 0) {
          setActiveHackathons(data);
          
          // Ensure we set the first hackathon's ID as a string
          const firstHackathonId = String(data[0].id);
          console.log('Setting first hackathon ID:', firstHackathonId);
          
          setSelectedHackathonId(firstHackathonId);
        } else {
          console.warn('No active hackathons found');
          toast({ 
            title: "No Hackathons", 
            description: "No active hackathons are currently available.", 
            variant: "default" 
          });
        }
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
        toast({ 
          title: "Error", 
          description: "Failed to fetch hackathons. Please try again later.", 
          variant: "destructive" 
        });
      }
    };

    fetchHackathons();
  }, []);

  const handleFormatChange = (format: FileFormat) => setActiveFormat(format);
  const handleFileClick = (file: FileInfo) => setSelectedFile(file);

  const handleHackathonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hackathonId = e.target.value;
    console.log('Hackathon selected:', hackathonId);
    setSelectedHackathonId(hackathonId);
  };

  const handleFileSelect = async (file: File) => {
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

    const selectedHackathon = activeHackathons.find(h => String(h.id) === selectedHackathonId);
    
    if (!selectedHackathon) {
      toast({ 
        title: "Error", 
        description: "No hackathon selected", 
        variant: "destructive" 
      });
      return;
    }

    await uploadFile(file, activeFormat);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", activeFormat);
      formData.append("theme", selectedHackathon.theme + ". " + selectedHackathon.description);
      formData.append("criteria", JSON.stringify(selectedHackathon.criteria));
      formData.append("hackathonId", String(selectedHackathon.id));

      const response = await fetch("http://127.0.0.1:5001/submit", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Submission failed");

      toast({ title: "Success", description: "File submitted successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit file", variant: "destructive" });
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>

              {activeHackathons.length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">Select Hackathon</label>
                  <select
                    value={selectedHackathonId}
                    onChange={handleHackathonChange}
                    className="w-full mt-1 border rounded px-3 py-2 text-sm"
                  >
                    {activeHackathons.map((hack) => (
                      <option 
                        key={`hackathon-unique-${hack.id}`}
                        value={String(hack.id)}
                      >
                        {hack.name} ({new Date(hack.start_date).toLocaleDateString()} - {new Date(hack.end_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  
                  {/* Show theme and description of selected hackathon */}
                  {selectedHackathon && (
                    <div className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded">
                      <p className="font-semibold mb-1">Hackathon Theme:</p>
                      <p className="mb-2 italic">{selectedHackathon.theme}</p>
                      <p className="font-semibold mb-1">Hackathon Description:</p>
                      <p>{selectedHackathon.description}</p>
                    </div>
                  )}

                  <FormatSelector activeFormat={activeFormat} onFormatChange={handleFormatChange} />
                  <FileUploader
                    activeFormat={activeFormat}
                    onFileSelect={handleFileSelect}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                  />

                  <div className="mt-6 text-sm text-gray-600">
                    Please name files as: <b>TeamName_HackathonName.extension</b>
                  </div>

                  <RecentUploads onSelectFile={handleFileClick} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active hackathons available.</p>
              )}
            </div>
          </div>

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


// import React, { useState, useEffect } from 'react';
// import Header from '@/components/Layout/Header';
// import FormatSelector from '@/components/FileManagement/FormatSelector';
// import FileUploader from '@/components/FileManagement/FileUploader';
// import RecentUploads from '@/components/FileManagement/RecentUploads';
// import FileViewer from '@/components/FileManagement/FileViewer';
// import FileDetails from '@/components/FileManagement/FileDetails';
// import { FileFormat, FileInfo, supportedExtensions } from '@/types/file';
// import { useFileUpload } from '@/hooks/useFileUpload';
// import { useToast } from '@/hooks/use-toast';
// import { apiRequest } from '@/lib/queryClient';
// import { getHackathon } from '@/lib/minio-client'; // Import the function

// // Define an interface for the Hackathon type
// interface Hackathon {
//   id: number | string;
//   name: string;
//   start_date: string;
//   end_date: string;
//   theme: string;
//   description: string;
//   criteria: any[];
// }

// const Home: React.FC = () => {
//   const [activeFormat, setActiveFormat] = useState<FileFormat>('text');
//   const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
//   const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
//   const [activeHackathons, setActiveHackathons] = useState<Hackathon[]>([]);
//   const { uploadFile, uploadProgress, isUploading } = useFileUpload();
//   const { toast } = useToast();

//   useEffect(() => {
//     const fetchHackathons = async () => {
//       try {
//         const response = await fetch("/api/hackathons/active");
        
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const data: Hackathon[] = await response.json();
        
//         console.log('Hackathons fetched:', data);
        
//         if (data.length > 0) {
//           setActiveHackathons(data);
          
//           // Ensure we set the first hackathon's ID as a string
//           const firstHackathonId = String(data[0].id);
//           console.log('Setting first hackathon ID:', firstHackathonId);
          
//           setSelectedHackathonId(firstHackathonId);
//         } else {
//           console.warn('No active hackathons found');
//           toast({ 
//             title: "No Hackathons", 
//             description: "No active hackathons are currently available.", 
//             variant: "default" 
//           });
//         }
//       } catch (error) {
//         console.error('Failed to fetch hackathons:', error);
//         toast({ 
//           title: "Error", 
//           description: "Failed to fetch hackathons. Please try again later.", 
//           variant: "destructive" 
//         });
//       }
//     };

//     fetchHackathons();
//   }, []);

//   const handleFormatChange = (format: FileFormat) => {
//     setActiveFormat(format);
//   };

//   const handleHackathonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const hackathonId = e.target.value;
//     console.log('Hackathon selected:', hackathonId);
//     setSelectedHackathonId(hackathonId);
//   };

//   // Find the currently selected hackathon
//   const selectedHackathon = activeHackathons.find(
//     hack => String(hack.id) === selectedHackathonId
//   );

//   // const handleFileSelect = (file: File) => {
//   //   // Check if file extension is supported for the selected format
//   //   const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
//   //   const allowedExtensions = supportedExtensions[activeFormat];
    
//   //   if (!allowedExtensions.includes(fileExtension)) {
//   //     toast({
//   //       title: 'Invalid file format',
//   //       description: `Only ${allowedExtensions.join(', ')} are supported for ${activeFormat} files.`,
//   //       variant: 'destructive',
//   //     });
//   //     return;
//   //   }
    
//   //   // Upload the file
//   //   uploadFile(file, activeFormat);
//   // };

//   const handleFileSelect = async (file: File) => {
//     console.log("Handlefileselect called")
//     // Validate file format
//     const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
//     const allowedExtensions = supportedExtensions[activeFormat];
  
//     if (!allowedExtensions.includes(fileExtension)) {
//       toast({
//         title: 'Invalid file format',
//         description: `Only ${allowedExtensions.join(', ')} are supported for ${activeFormat} files.`,
//         variant: 'destructive',
//       });
//       return;
//     }

//     const selectedHackathon = activeHackathons.find(h => String(h.id) === selectedHackathonId);
  
//     // Upload the file (this function returns void)
//     console.log("uploadfile called")
//     await uploadFile(file, activeFormat);
  
//     const hackathonId = 1; // Replace with actual hackathon ID

//     // Fetch hackathon details
//     const hackathonDetails = await getHackathon(hackathonId);
//     if (!hackathonDetails) {
//       toast({
//         title: "Error",
//         description: "Hackathon not found",
//         variant: "destructive",
//       });
//       return;
//     }

//     console.log(hackathonDetails);
  
//     try {
  
//       // Prepare form data for submission
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("fileType", activeFormat);
//       formData.append("theme", hackathonDetails.theme + ". " + hackathonDetails.description);
//       formData.append("criteria", JSON.stringify(hackathonDetails.criteria));
//       formData.append("hackathonId", String(hackathonId));

//       console.log(`Form Data : ${formData}`);
//       console.log("Calling API /submit");
  
//       // Make API call to `/submit`
//       const response = await fetch("http://127.0.0.1:5001/submit", {
//         method: "POST",
//         body: formData,
//       });
  
//       if (!response.ok) throw new Error("Submission failed");
  
//       toast({
//         title: "Success",
//         description: "File submitted successfully!",
//       });
//     } catch (error) {
//       console.error("Error submitting file:", error);
//       toast({
//         title: "Error",
//         description: "Failed to submit file.",
//         variant: "destructive",
//       });
//     }
//   };
  
  

//   const handleFileClick = (file: FileInfo) => {
//     setSelectedFile(file);
//   };


 

//   return (
//     <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
//       <Header />
      
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


//           {/* Upload Section */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-lg shadow p-6 space-y-6">
//               <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
              
//               {activeHackathons.length > 0 ? (
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">Select Hackathon</label>
//                   <select
//                     value={selectedHackathonId}
//                     onChange={handleHackathonChange}
//                     className="w-full mt-1 border rounded px-3 py-2 text-sm"
//                   >
//                     {activeHackathons.map((hack) => (
//                       <option 
//                         key={hackathon-unique-${hack.id}}
//                         value={String(hack.id)}
//                       >
//                         {hack.name} ({new Date(hack.start_date).toLocaleDateString()} - {new Date(hack.end_date).toLocaleDateString()})
//                       </option>
//                     ))}
//                   </select>
                  
//                   {/* Show theme and description of selected hackathon */}
//                   {selectedHackathon && (
//                     <div className="text-xs text-gray-700 mt-2 bg-gray-100 p-2 rounded">
//                       <p className="font-semibold mb-1">Hackathon Theme:</p>
//                       <p className="mb-2 italic">{selectedHackathon.theme}</p>
//                       <p className="font-semibold mb-1">Hackathon Description:</p>
//                       <p>{selectedHackathon.description}</p>
//                     </div>
//                   )}

//                   <FormatSelector activeFormat={activeFormat} onFormatChange={handleFormatChange} />
//                   <FileUploader
//                     activeFormat={activeFormat}
//                     onFileSelect={handleFileSelect}
//                     uploadProgress={uploadProgress}
//                     isUploading={isUploading}
//                   />

//                   <div className="mt-6 text-sm text-gray-600">
//                     Please name files as: <b>TeamName_HackathonName.extension</b>
//                   </div>

//                   <RecentUploads onSelectFile={handleFileClick} />
//                 </div>
//               ) : (
//                 <p className="text-sm text-gray-500">No active hackathons available.</p>
//               )}
//               <FormatSelector 
//                 activeFormat={activeFormat} 
//                 onFormatChange={handleFormatChange} 
//               />
              
//               <FileUploader 
//                 activeFormat={activeFormat}
//                 onFileSelect={handleFileSelect}
//                 uploadProgress={uploadProgress}
//                 isUploading={isUploading}
//               />
              
//               <div className="mt-6 flex">
//                 Pls save the file in the following format: TeamName_HackathonName.extension

//               </div>

//               <RecentUploads onSelectFile={handleFileClick} />
//             </div>
//           </div>
//               {/* </div>
              
//               <RecentUploads onSelectFile={handleFileClick} />
//             </div>
//           </div> */}
          
//           {/* File Viewer Section */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-lg shadow overflow-hidden">
//               <FileViewer file={selectedFile} />
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Home;
