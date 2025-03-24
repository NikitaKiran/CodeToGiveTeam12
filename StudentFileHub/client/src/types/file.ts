export type FileFormat = "text" | "audio" | "image" | "video" | "pdf" | "docx";

export interface FileInfo {
  id: number;
  filename: string;
  originalName: string;
  fileType: FileFormat;
  mimeType: string;
  size: number;
  bucketName: string;
  path: string;
  uploadedAt: string;
  userId?: number;
}

export interface UploadProgressInfo {
  filename: string;
  progress: number;
}

export const formatIcons: Record<FileFormat, string> = {
  text: "description",
  audio: "audiotrack",
  image: "image",
  video: "videocam",
  pdf: "picture_as_pdf",
  docx: "article"
};

export const formatLabels: Record<FileFormat, string> = {
  text: "Text",
  audio: "Audio",
  image: "Image",
  video: "Video",
  pdf: "PDF",
  docx: "DOCX"
};

export const supportedExtensions: Record<FileFormat, string[]> = {
  text: [".txt", ".md", ".js", ".json", ".html", ".css", ".ts", ".tsx"],
  audio: [".mp3", ".wav", ".ogg", ".m4a"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  video: [".mp4", ".webm", ".mov", ".avi"],
  pdf: [".pdf"],
  docx: [".doc", ".docx"]
};

export function getFormatDescription(format: FileFormat): string {
  return `Supported formats: ${supportedExtensions[format].join(', ')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec} sec${diffSec !== 1 ? 's' : ''} ago`;
  } else if (diffMin < 60) {
    return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

export function getFileExtension(filename: string): string {
  return `.${filename.split('.').pop()?.toLowerCase()}`;
}
