"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileViewerProps {
  filePath: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath }) => {
  const [docxContent, setDocxContent] = useState<string>("");

  const getFileType = (path: string): string => {
    return path.split(".").pop()?.toLowerCase() || "";
  };

  useEffect(() => {
    if (getFileType(filePath) === "docx") {
      fetch(filePath)
        .then((res) => res.arrayBuffer())
        .then((data) => {
          mammoth.extractRawText({ arrayBuffer: data }).then((result) => {
            setDocxContent(result.value);
          });
        })
        .catch((err) => console.error("Error reading DOCX file:", err));
    }
  }, [filePath]);

  const renderFile = () => {
    const fileType = getFileType(filePath);

    if (["jpg", "jpeg", "png", "gif"].includes(fileType)) {
      return <img src={filePath} alt="Preview" className="max-w-full h-auto" />;
    } else if (["mp3", "wav"].includes(fileType)) {
      return <audio controls src={filePath} />;
    } else if (["mp4", "webm", "ogg"].includes(fileType)) {
      return <video controls className="max-w-full"><source src={filePath} type={`video/${fileType}`} /></video>;
    } else if (fileType === "pdf") {
      return (
        <Document file={filePath}>
          <Page pageNumber={1} />
        </Document>
      );
    } else if (fileType === "docx") {
      return <div className="p-4 border">{docxContent || "Loading DOCX content..."}</div>;
    } else {
      return <p>Unsupported file type</p>;
    }
  };

  return <div className="p-4 border rounded">{renderFile()}</div>;
};

export default FileViewer;