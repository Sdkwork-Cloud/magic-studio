import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Character, CharacterConfig, CharacterTask } from '../entities/character.entity';
import { CHARACTER_MODELS as _CHARACTER_MODELS } from '../constants'; // eslint-disable-line @typescript-eslint/no-unused-vars

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
    model: 'gemini-3-flash-image',
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
    voiceId: 'male',
    avatarMode: 'full-body',
    avatarImage: ''
  });

  const setConfig = (updates: Partial<CharacterConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }));
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      // Stub implementation - to be connected to actual AI service
      console.log('Generating character with config:', config);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTask = async (id: string) => {
    setHistory(prev => prev.filter(t => t.id !== id));
  };

  const deleteCharacter = async (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const clearHistory = async () => {
    setHistory([]);
  };

  const toggleFavorite = async (id: string) => {
    setHistory(prev => prev.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const importTask = (task: CharacterTask) => {
    setHistory(prev => [...prev, task]);
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
