
import React, { useState } from 'react';
import { useFilmStore } from '../store/filmStore';
import { FilmShot } from '../entities/film.entity';
import { ShotModal } from './ShotModal';
import { StoryboardPanel } from './overview/StoryboardPanel';

export const StoryboardView: React.FC = () => {
    const { 
        project, 
        selectItem, 
        updateShot, 
        addShot, 
        generateShotImage 
    } = useFilmStore();
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShot, setEditingShot] = useState<FilmShot | undefined>(undefined);
    const [editingSceneIndex, setEditingSceneIndex] = useState<number>(0);

    const handleEditShot = (shot: FilmShot, sceneIndex: number) => {
        setEditingShot(shot);
        setEditingSceneIndex(sceneIndex);
        setIsModalOpen(true);
        selectItem(shot.uuid, 'shot');
    };

    const handleSaveShot = (data: Partial<FilmShot>) => {
        if (editingShot) {
            updateShot(editingShot.sceneUuid, editingShot.uuid, data);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#111]">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-[1920px] mx-auto">
                    <StoryboardPanel 
                        scenes={project.scenes}
                        shots={project.shots}
                        locations={project.locations}
                        characters={project.characters}
                        props={project.props}
                        onEditShot={handleEditShot}
                        onAddShot={addShot}
                        onGenerateShot={(shotId) => {
                            const shot = project.shots.find(s => s.uuid === shotId);
                            if(shot) generateShotImage(shot.sceneUuid, shot.uuid);
                        }}
                        // No onViewAll prop, so the link is hidden
                    />
                </div>
            </div>
            
            {/* Shot Editing Modal */}
            <ShotModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingShot}
                onSave={handleSaveShot}
                sceneIndex={editingSceneIndex}
                characters={project.characters}
            />
        </div>
    );
};
