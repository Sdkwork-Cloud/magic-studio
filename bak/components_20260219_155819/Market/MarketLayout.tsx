
import React from 'react';
import { Search } from 'lucide-react';

interface MarketLayoutProps {
  title: string;
  icon: React.ReactNode;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children: React.ReactNode;
}

export const MarketLayout: React.FC<MarketLayoutProps> = ({ 
  title, 
  icon,
  categories, 
  activeCategory, 
  onSelectCategory,
  searchQuery,
  onSearchChange,
  children
}) => {
  return (
    <div className="flex w-full h-full bg-[#1e1e1e]">
      {/* Sidebar Filter */}
      <div className="w-[200px] flex-none border-r border-[#333] flex flex-col bg-[#252526]">
        <div className="p-4 border-b border-[#333] flex items-center gap-2 text-gray-200 font-semibold select-none">
          {icon}
          <span>{title}</span>
        </div>
        <div className="p-2 flex-1 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`
                w-full text-left px-3 py-2 text-xs rounded-md mb-1 transition-colors
                ${activeCategory === cat 
                  ? 'bg-[#094771] text-white font-medium' 
                  : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-black min-w-0">
        {/* Header Search */}
        <div className="h-14 flex items-center px-6 border-b border-[#333] bg-[#1e1e1e] flex-none">
          <div className="relative w-full max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full bg-[#252526] border border-[#333] text-gray-200 text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder-gray-600"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
