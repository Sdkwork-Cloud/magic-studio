
import React from 'react';
import { useFilmStore } from '../store/filmStore';
import { SettingsSection, SettingInput, SettingTextArea } from '../../settings/components/SettingsWidgets';
import { Button } from '../../../components/Button/Button';
import { Image as ImageIcon, Video } from 'lucide-react';

export const FilmPropertiesPanel: React.FC = () => {
    const { 
        selectedId, selectedType, project, 
        updateCharacter, updateScene, updateShot, updateLocation,
        generateShotImage, generateShotVideo 
    } = useFilmStore();

    if (!selectedId || !selectedType) {
        return (
            <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-gray-500 text-xs select-none">
                Select an item to edit details
            </div>
        );
    }

    const renderCharacterProps = () => {
        const char = project.characters.find(c => c.uuid === selectedId);
        if (!char) return null;
        return (
            <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Character</h3>
                <SettingsSection title="Identity">
                    <SettingInput label="Name" value={char.name} onChange={(v) => updateCharacter(char.uuid, { name: v })} fullWidth />
                    <div className="grid grid-cols-2 gap-4">
                        <SettingInput label="Age" value={char.appearance?.ageGroup || ''} onChange={(v) => updateCharacter(char.uuid, { appearance: { ...char.appearance, ageGroup: v } })} fullWidth />
                        <SettingInput label="Gender" value={char.appearance?.gender || ''} onChange={(v) => updateCharacter(char.uuid, { appearance: { ...char.appearance, gender: v } })} fullWidth />
                    </div>
                </SettingsSection>
                <SettingsSection title="Appearance">
                    <SettingTextArea label="Description" value={char.description || ''} onChange={(v) => updateCharacter(char.uuid, { description: v })} rows={4} fullWidth />
                </SettingsSection>
            </div>
        );
    };

    const renderLocationProps = () => {
        const loc = project.locations.find(l => l.uuid === selectedId);
        if (!loc) return null;
        return (
            <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Location</h3>
                <SettingsSection title="Details">
                    <SettingInput label="Name" value={loc.name} onChange={(v) => updateLocation(loc.uuid, { name: v })} fullWidth />
                    <div className="grid grid-cols-2 gap-4">
                         <SettingInput label="Time of Day" value={loc.timeOfDay || ''} onChange={(v) => updateLocation(loc.uuid, { timeOfDay: v as any })} fullWidth placeholder="DAY/NIGHT" />
                         <div className="flex items-center gap-2 mt-6">
                             <input type="checkbox" checked={loc.indoor} onChange={(e) => updateLocation(loc.uuid, { indoor: e.target.checked })} />
                             <span className="text-xs text-gray-300">Indoor</span>
                         </div>
                    </div>
                </SettingsSection>
                <SettingsSection title="Visuals">
                     <SettingTextArea label="Visual Description" value={loc.visualDescription || ''} onChange={(v) => updateLocation(loc.uuid, { visualDescription: v })} rows={4} fullWidth />
                     <SettingInput label="Atmosphere Tags" value={loc.atmosphereTags?.join(', ') || ''} onChange={(v) => updateLocation(loc.uuid, { atmosphereTags: v.split(',').map(s => s.trim()) })} fullWidth placeholder="Dark, Moody, Rain..." />
                </SettingsSection>
            </div>
        );
    };

    const renderSceneProps = () => {
        const scene = project.scenes.find(s => s.uuid === selectedId);
        if (!scene) return null;
        const location = project.locations.find(l => l.uuid === scene.locationUuid);
        return (
            <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Scene {scene.index}</h3>
                <SettingsSection title="Setting">
                    <SettingInput label="Location" value={location?.name || ''} onChange={(v) => {
                        // Location name is read-only for now, would need to update location entity
                    }} fullWidth disabled />
                    <div className="grid grid-cols-2 gap-4">
                         <SettingInput label="Mood" value={scene.moodTags?.join(', ') || ''} onChange={(v) => updateScene(scene.uuid, { moodTags: v.split(',').map(s => s.trim()) })} fullWidth />
                    </div>
                </SettingsSection>
                <SettingsSection title="Visuals">
                     <SettingTextArea label="Visual Prompt" value={scene.visualPrompt || ''} onChange={(v) => updateScene(scene.uuid, { visualPrompt: v })} rows={6} fullWidth />
                </SettingsSection>
            </div>
        );
    };

    const renderShotProps = () => {
        const shot = project.shots.find(sh => sh.uuid === selectedId);
        if (!shot) return null;
        
        const hasImage = shot.assets && shot.assets.length > 0;

        return (
            <div className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Shot {shot.index}</h3>
                
                <div className="grid grid-cols-2 gap-2 mb-6">
                    <Button 
                        size="sm" 
                        className="gap-2 bg-[#252526] hover:bg-[#333] border border-[#333]"
                        onClick={() => generateShotImage(shot.sceneUuid, shot.uuid)}
                    >
                        <ImageIcon size={14} /> 生成图片
                    </Button>
                    <Button 
                        size="sm" 
                        className="gap-2 bg-blue-600 hover:bg-blue-500 border-0"
                        onClick={() => generateShotVideo(shot.sceneUuid, shot.uuid)}
                        disabled={!hasImage}
                    >
                        <Video size={14} /> 生成结果
                    </Button>
                </div>

                <SettingsSection title="Content">
                     <SettingInput label="Duration (s)" type="number" value={shot.duration.toString()} onChange={(v) => updateShot(shot.sceneUuid, shot.uuid, { duration: parseFloat(v) })} fullWidth />
                     <SettingTextArea label="Description" value={shot.description} onChange={(v) => updateShot(shot.sceneUuid, shot.uuid, { description: v })} rows={4} fullWidth />
                     <SettingTextArea label="Dialogue" value={shot.dialogue?.items?.map(d => d.text).join('\n') || ''} onChange={(v) => updateShot(shot.sceneUuid, shot.uuid, { 
                         dialogue: { items: v.split('\n').filter(Boolean).map((text, i) => ({ id: `d${i}`, characterId: 'narrator', text })) }
                     })} rows={3} fullWidth />
                </SettingsSection>
                
                <SettingsSection title="AI Generation">
                     <SettingTextArea label="Prompt" value={shot.generation?.prompt?.base || ''} onChange={(v) => updateShot(shot.sceneUuid, shot.uuid, { 
                         generation: { ...shot.generation, prompt: { ...shot.generation?.prompt, base: v } }
                     })} rows={6} fullWidth />
                </SettingsSection>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-[#18181b] overflow-y-auto custom-scrollbar">
            {selectedType === 'character' && renderCharacterProps()}
            {selectedType === 'location' && renderLocationProps()}
            {selectedType === 'scene' && renderSceneProps()}
            {selectedType === 'shot' && renderShotProps()}
        </div>
    );
};
