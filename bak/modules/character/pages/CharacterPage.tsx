
import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { GenerationHistoryListPane, GENERATION_TABS } from '../../../components/generate/GenerationHistoryListPane';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { ImportData } from '../../../components/generate/upload/types';
import { CharacterTask } from '../entities/character.entity';
import { CharacterLeftGeneratorPanel } from '../components/CharacterLeftGeneratorPanel';
import { generateUUID } from '../../../utils';

const CharacterPage: React.FC = () => {
    const { history, deleteTask, setConfig, toggleFavorite, importTask } = useCharacterStore();
    const { navigate } = useRouter();
    const [activeTab, setActiveTab] = useState<string>('character');
    const [showFavorites, setShowFavorites] = useState(false);

    const displayTasks = showFavorites 
        ? history.filter(t => t.isFavorite)
        : history;

    const handleImport = (data: ImportData) => {
        const task: CharacterTask = {
            id: data.id,
            uuid: data.id,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            status: 'completed',
            config: {
                name: 'Imported Character',
                description: data.prompt,
                archetype: 'npc',
                gender: 'female',
                age: 'unknown',
                styleId: 'none',
                model: data.model,
                mediaType: 'character',
                aspectRatio: (data.aspectRatio as any) || '3:4',
                batchSize: 1,
                avatarMode: 'full-body',
                referenceImages: [],
                voiceSource: 'preset'
            },
            results: [{
                id: generateUUID(),
                url: data.fileUrl
            }]
        };
        importTask(task);
    };
    
    return (
        <GenerationHistoryListPane 
            tabs={GENERATION_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChatMode={() => navigate(ROUTES.CHARACTER_CHAT)}
            tasks={displayTasks as any[]} 
            onDelete={deleteTask}
            onReuse={(task: any) => setConfig(task.config)}
            showFavorites={showFavorites}
            onToggleFavorites={setShowFavorites}
            filter={activeTab}
            onImport={handleImport}
        />
    );
};

export default CharacterPage;
