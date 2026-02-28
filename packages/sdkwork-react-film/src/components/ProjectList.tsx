
import { FilmProject } from '@sdkwork/react-commons';
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';

import { Plus, Search, Clock, Film, ChevronRight, MoreHorizontal, FolderOpen, Clapperboard } from 'lucide-react';

interface ProjectListProps {
    onCreateProject?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onCreateProject }) => {
    const { projects, currentProjectId, switchProject, createProject } = useFilmStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        await createProject(newProjectName.trim());
        setNewProjectName('');
        setIsCreating(false);
        if (onCreateProject) onCreateProject();
    };

    const formatDate = (timestamp: number | string) => {
        const date = new Date(typeof timestamp === 'number' ? timestamp : parseInt(timestamp));
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Actions */}
            <div className="px-3 py-2 space-y-2">
                 <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-900/20"
                >
                    <Plus size={14} /> New Project
                </button>
                
                {/* Search */}
                <div className="relative group">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#121214] border border-[#1f1f22] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#333] transition-colors"
                    />
                </div>
            </div>

            {/* Create Project Input */}
            {isCreating && (
                <div className="px-3 pb-3 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-[#18181b] p-2 rounded-lg border border-[#333]">
                        <input
                            type="text"
                            placeholder="Project Title"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateProject();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            autoFocus
                            className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none mb-2"
                        />
                        <div className="flex gap-2">
                             <button onClick={handleCreateProject} className="flex-1 bg-white text-black text-[10px] font-bold py-1 rounded hover:bg-gray-200">Create</button>
                             <button onClick={() => setIsCreating(false)} className="flex-1 bg-[#2a2a2c] text-gray-400 text-[10px] font-bold py-1 rounded hover:text-white">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar pb-4">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-xs">No projects found</div>
                ) : (
                    filteredProjects.map((project) => (
                        <button
                            key={project.uuid}
                            onClick={() => switchProject(project.uuid)}
                            className={`
                                w-full text-left p-3 rounded-xl transition-all group flex items-start gap-3 border
                                ${currentProjectId === project.uuid 
                                    ? 'bg-[#18181b] border-[#333] shadow-md' 
                                    : 'hover:bg-[#121214] border-transparent hover:border-[#1f1f22]'
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                ${currentProjectId === project.uuid ? 'bg-red-600 text-white' : 'bg-[#1e1e20] text-gray-500 group-hover:text-gray-300'}
                            `}>
                                <Clapperboard size={14} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`font-bold text-xs truncate ${currentProjectId === project.uuid ? 'text-white' : 'text-gray-300'}`}>
                                        {project.name}
                                    </span>
                                    {currentProjectId === project.uuid && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                                    <span>{project.settings.resolution}</span>
                                    <span>·</span>
                                    <span>{formatDate(project.updatedAt)}</span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
