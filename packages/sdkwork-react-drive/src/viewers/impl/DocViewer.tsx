import { Button } from '@sdkwork/react-commons';
import React from 'react';
import { FileViewerProps } from '../types';
import { FileText, Download, AlertTriangle } from 'lucide-react';

export const DocViewer: React.FC<FileViewerProps> = ({ item, url }) => {
  const isPdf = item.mimeType === 'application/pdf' || item.name.endsWith('.pdf');
  const isOffice = /\.(docx|xlsx|pptx|doc|xls|ppt)$/i.test(item.name);

  if (isPdf) {
    return (
      <div className="w-full h-full bg-[#333] flex flex-col">
        <iframe src={url} className="w-full h-full border-none" title={item.name} />
      </div>
    );
  }

  if (isOffice) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#f4f4f5] dark:bg-[#1e1e1e] p-8 text-center">
        <div className="w-24 h-24 bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-xl flex items-center justify-center mb-6">
          <FileText size={48} className="text-blue-600 dark:text-blue-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          Previewing this document type requires external conversion. Please download it to view or
          edit in your native application.
        </p>

        <div className="flex gap-4">
          <a href={url} download={item.name} className="no-underline">
            <Button className="gap-2 shadow-lg shadow-blue-500/20">
              <Download size={16} /> Download
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
      <AlertTriangle size={48} className="mb-4 opacity-50" />
      <p>No preview available for this file type.</p>
    </div>
  );
};
