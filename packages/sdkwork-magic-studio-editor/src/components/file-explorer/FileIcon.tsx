
import React from 'react';
import { 
  Folder, FolderOpen, FileCode, FileJson, File, Image, Box, Settings, Hash 
} from 'lucide-react';

interface FileIconProps {
  name: string;
  isDirectory: boolean;
  expanded: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({ name, isDirectory, expanded }) => {
  if (isDirectory) {
    return expanded ? 
      <FolderOpen size={16} className="text-[#dcb67a]" fill="currentColor" fillOpacity={0.2} /> : 
      <Folder size={16} className="text-[#dcb67a]" fill="currentColor" fillOpacity={0.2} />;
  }

  const lowerName = name.toLowerCase();

  // Config Files
  if (lowerName === 'cargo.toml') return <Settings size={16} className="text-orange-400" />;
  if (lowerName === 'package.json') return <Box size={16} className="text-red-400" />;
  if (lowerName === 'readme.md') return <Hash size={16} className="text-blue-300" />;
  if (lowerName.endsWith('metadata.json')) return <Settings size={16} className="text-yellow-400" />;

  // Code
  if (lowerName.endsWith('.tsx')) return <FileCode size={16} className="text-cyan-400" />;
  if (lowerName.endsWith('.ts')) return <FileCode size={16} className="text-blue-500" />;
  if (lowerName.endsWith('.css')) return <Hash size={16} className="text-blue-300" />;
  if (lowerName.endsWith('.html')) return <FileCode size={16} className="text-orange-500" />;
  if (lowerName.endsWith('.json')) return <FileJson size={16} className="text-yellow-300" />;
  if (lowerName.endsWith('.rs')) return <Settings size={16} className="text-orange-500" />;
  
  // Media
  if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.svg')) return <Image size={16} className="text-purple-400" />;
  
  return <File size={16} className="text-gray-500" />;
};
