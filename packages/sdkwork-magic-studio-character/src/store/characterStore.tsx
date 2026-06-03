import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Character, CharacterConfig, CharacterTask } from '../entities';
import { CHARACTER_MODELS as _CHARACTER_MODELS } from '../constants'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { characterBusinessService } from '../services/characterBusinessService';
import { matchesEntityKey } from '@sdkwork/magic-studio-types/entity';

const matchesCharacterTaskIdentity = (item: CharacterTask, task: CharacterTask): boolean => {
  const matchesById =
    typeof task.id === 'string' && task.id.length > 0 ? matchesEntityKey(item, task.id) : false;
  const matchesByUuid =
    typeof task.uuid === 'string' && task.uuid.length > 0
      ? matchesEntityKey(item, task.uuid)
      : false;
  return matchesById || matchesByUuid;
};

interface CharacterStoreContextType {
  characters: Character[];
  history: CharacterTask[];
  config: CharacterConfig;
  isGenerating: boolean;
  setConfig: (config: Partial<CharacterConfig>) => void;
  generate: () => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  importTask: (task: CharacterTask) => void;
}

const CharacterStoreContext = createContext<CharacterStoreContextType | undefined>(undefined);

export const CharacterStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [history, setHistory] = useState<CharacterTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfigState] = useState<CharacterConfig>({
    model: 'gemini-2.5-flash-image',
    prompt: '',
    gender: 'male',
    archetype: 'hero',
    age: 30,
    outfit: '',
    hairstyle: '',
    hairColor: '',
    eyeColor: '',
    skinTone: '',
    accessories: '',
    aspectRatio: '9:16',
    mediaType: 'character',
    voiceId: 'Puck',
    avatarMode: 'full-body',
    avatar: undefined,
  });

  const setConfig = (updates: Partial<CharacterConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const result = await characterBusinessService.characterHistoryService.findAll({ page: 0, size: 100 });
        if (!cancelled && result.success && result.data) {
          setHistory(result.data.content);
        }
      } catch (error) {
        console.error('Failed to load character history', error);
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const task = await characterBusinessService.characterService.generate(config);
      await characterBusinessService.characterHistoryService.save(task);
      setHistory(prev => [task, ...prev.filter(item => !matchesCharacterTaskIdentity(item, task))]);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await characterBusinessService.characterHistoryService.deleteById(id);
    } finally {
      setHistory(prev => prev.filter(t => t.id !== id && t.uuid !== id));
    }
  };

  const deleteCharacter = async (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const clearHistory = async () => {
    await characterBusinessService.characterHistoryService.clear();
    setHistory([]);
  };

  const toggleFavorite = async (id: string) => {
    await characterBusinessService.characterHistoryService.toggleFavorite(id);
    setHistory(prev => prev.map(t =>
      matchesEntityKey(t, id) ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const importTask = (task: CharacterTask) => {
    void characterBusinessService.characterHistoryService.save(task);
    setHistory(prev => [task, ...prev.filter(item => !matchesCharacterTaskIdentity(item, task))]);
  };

  return <CharacterStoreContext.Provider value={{ 
    characters,
    history,
    config,
    isGenerating,
    setConfig, 
    generate,
    deleteTask,
    deleteCharacter,
    clearHistory,
    toggleFavorite,
    importTask
  }}>{children}</CharacterStoreContext.Provider>;
};

export const useCharacterStore = () => {
  const context = useContext(CharacterStoreContext);
  if (!context) throw new Error('useCharacterStore must be used within CharacterStoreProvider');
  return context;
};
