
import React from 'react';
import { useFilmStore } from '../store/filmStore';
import { ScriptEditor } from './ScriptEditor';
import { EntityList } from './EntityList';
import { StoryboardView } from './StoryboardView';
import { LocationList } from './LocationList';
import { PropList } from './PropList';
import { ProjectOverview } from './ProjectOverview';

export const FilmWorkspace: React.FC = () => {
    const { currentView } = useFilmStore();

    return (
        <div className="flex-1 min-w-0 bg-[#09090b] flex flex-col h-full overflow-hidden">
            {currentView === 'overview' && <ProjectOverview />}
            {currentView === 'script' && <ScriptEditor />}
            {currentView === 'characters' && <EntityList />}
            {currentView === 'locations' && <LocationList />}
            {currentView === 'props' && <PropList />}
            {currentView === 'storyboard' && <StoryboardView />}
            {currentView === 'timeline' && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <p className="text-lg font-bold mb-2">生成时间线</p>
                        <p className="text-sm">在此处将分镜序列转换为连贯的视频剪辑工程。</p>
                    </div>
                </div>
            )}
        </div>
    );
};
