
import { FilmLocation } from 'sdkwork-react-commons'
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { Zap, Loader2, Plus } from 'lucide-react';

import { LocationModal } from './LocationModal';
import { LocationCard } from './overview/LocationCard';

export const LocationList: React.FC = () => {
    const { project, selectItem, selectedId, createLocation, updateLocation } = useFilmStore();
    const locations = project.locations || [];
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<FilmLocation | undefined>(undefined);

    const handleCreate = () => {
        setEditingLocation(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (loc: FilmLocation) => {
        setEditingLocation(loc);
        setIsModalOpen(true);
        selectItem(loc.uuid, 'location');
    };

    const handleSave = (data: Partial<FilmLocation>) => {
        if (editingLocation) {
            updateLocation(editingLocation.uuid, data);
        } else {
             // Use temp helper from store hook if direct action unavailable, 
             // but assuming updateLocation handles logic or we use injected method
             if ((window as any)._tempCreateLocation) (window as any)._tempCreateLocation(data);
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-[#111]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white">Locations</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage physical environments and concept art where the story takes place, ensuring scene consistency.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] hover:text-white text-gray-300 rounded-lg text-xs font-bold transition-colors"
                    >
                        <Plus size={14} /> Add Location
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors">
                        <Zap size={14} /> AI Extract Locations
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {locations.map((loc: FilmLocation) => (
                    <LocationCard 
                        key={loc.uuid}
                        location={loc}
                        onClick={() => handleEdit(loc)}
                        isSelected={selectedId === loc.uuid}
                    />
                ))}
                
                {/* Add Card */}
                <button 
                    onClick={handleCreate}
                    className="aspect-video rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#444] bg-[#18181b]/30 hover:bg-[#18181b] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-colors group"
                >
                    <div className="w-10 h-10 rounded-full bg-[#252526] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold uppercase">Add Location</span>
                </button>
            </div>
            
            <LocationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingLocation}
            />
        </div>
    );
};
