import React from 'react';
import { FileFormat, formatIcons, formatLabels } from '@/types/file';

interface FormatSelectorProps {
  activeFormat: FileFormat;
  onFormatChange: (format: FileFormat) => void;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ 
  activeFormat, 
  onFormatChange 
}) => {
  const formats: FileFormat[] = ["text", "audio", "image", "video", "pdf", "docx"];

  return (
    <div className="format-selector">
      <div className="flex overflow-x-auto space-x-4 pb-2">
        {formats.map((format) => (
          <button
            key={format}
            className={`format-tab py-2 px-1 text-sm text-gray-600 focus:outline-none whitespace-nowrap ${
              activeFormat === format 
                ? 'border-b-2 border-primary-600 text-primary-600 font-medium' 
                : ''
            }`}
            onClick={() => onFormatChange(format)}
          >
            <span className="material-icons align-middle mr-1 text-base">
              {formatIcons[format]}
            </span>
            {formatLabels[format]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormatSelector;
