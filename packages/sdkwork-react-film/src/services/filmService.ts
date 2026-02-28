
import { GoogleGenAI } from "@google/genai";
import type {
  FilmProject,
  FilmCharacter,
  FilmCharacterType,
  FilmProp,
  FilmLocation,
  FilmScene,
  FilmShot,
  FilmAssetMediaResource
} from '@sdkwork/react-commons';
import { MediaScene } from '@sdkwork/react-commons';
import { filmProjectService } from './filmProjectService';
import { generateUUID } from '@sdkwork/react-commons';

export interface FilmAnalysisResult {
  characters: Partial<FilmCharacter>[];
  locations: Partial<FilmLocation>[];
  props: Partial<FilmProp>[];
  scenes: Partial<FilmScene>[];
  shots: Partial<FilmShot>[];
}

interface AnalyzeScriptCharacter {
  name?: string;
  characterType?: string;
  description?: string;
  age?: string;
  gender?: string;
}

interface AnalyzeScriptLocation {
  name?: string;
  indoor?: boolean;
  timeOfDay?: string;
  visualDescription?: string;
}

interface AnalyzeScriptProp {
  name?: string;
  description?: string;
}

interface AnalyzeScriptScene {
  index?: number;
  locationName?: string;
  summary?: string;
  moodTags?: string[];
  characterNames?: string[];
  visualPrompt?: string;
}

interface AnalyzeScriptResponse {
  characters?: AnalyzeScriptCharacter[];
  locations?: AnalyzeScriptLocation[];
  props?: AnalyzeScriptProp[];
  scenes?: AnalyzeScriptScene[];
}

interface ExtractCharactersResponse {
  characters?: Array<{
    name?: string;
    role?: string;
    gender?: string;
    age?: string;
    description?: string;
    traits?: string[];
  }>;
}

interface ExtractPropsResponse {
  props?: Array<{
    name?: string;
    role?: string;
    description?: string;
  }>;
}

const FILM_CHARACTER_TYPES: readonly FilmCharacterType[] = [
  'HUMAN',
  'PET',
  'ANIMAL',
  'ROBOT',
  'OTHER'
];

const normalizeFilmCharacterType = (value: string | undefined): FilmCharacterType => {
  const normalized = typeof value === 'string' ? value.toUpperCase() : '';
  return FILM_CHARACTER_TYPES.find((item) => item === normalized) || 'HUMAN';
};

const SUPPORTED_IMAGE_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;
type SupportedImageAspectRatio = (typeof SUPPORTED_IMAGE_ASPECT_RATIOS)[number];

const normalizeImageAspectRatio = (aspectRatio: string): SupportedImageAspectRatio => {
  const normalized = SUPPORTED_IMAGE_ASPECT_RATIOS.find((item) => item === aspectRatio);
  return normalized || '16:9';
};

const API_KEY = process.env.API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const parseAIResponse = <T>(text: string): T | null => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error("Failed to parse AI JSON", e);
        return null;
    }
};

export const filmService = {
  
  createProject: (name: string, description?: string): FilmProject => {
    const now = Date.now();
    const uuid = generateUUID();
    
    return {
      id: uuid,
      uuid,
      type: 'FILM_PROJECT',
      name,
      description: description || 'A new masterpiece',
      status: 'DRAFT',
      input: {
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_USER_INPUT',
        text: '',
        language: 'zh',
        createdAt: now,
        updatedAt: now,
      },
      script: {
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_SCRIPT',
        title: name,
        genres: [],
        styles: [],
        content: '',
        standardized: false,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
      },
      characters: [],
      props: [],
      locations: [],
      scenes: [],
      shots: [],
      media: [],
      settings: {
        id: generateUUID(),
        uuid: generateUUID(),
        theme: 'default',
        style: 'cinematic',
        aspect: '16:9',
        resolution: '1080P',
        fps: 24,
        quality: 'standard',
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now,
    };
  },

  createEmptyCharacter: (): FilmCharacter => {
      const now = Date.now();
      return {
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_CHARACTER',
          name: 'New Character',
          characterType: 'HUMAN',
          status: 'ACTIVE',
          description: '',
          appearance: { ageGroup: 'Unknown', gender: 'Unknown' },
          personality: { traits: [] },
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  getCharacterAssetByScene: (character: FilmCharacter, scene: MediaScene): FilmAssetMediaResource | undefined => {
      return character.refAssets?.find(a => a.scene === scene);
  },

  getCharacterAvatar: (character: FilmCharacter): FilmAssetMediaResource | undefined => {
      return filmService.getCharacterAssetByScene(character, MediaScene.AVATAR);
  },

  createEmptyProp: (): FilmProp => {
      const now = Date.now();
      return {
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_PROP',
          name: 'New Prop',
          description: '',
          tags: [],
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  createEmptyLocation: (): FilmLocation => {
      const now = Date.now();
      return {
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_LOCATION',
          name: 'New Location',
          indoor: true,
          timeOfDay: 'DAY',
          tags: [],
          atmosphereTags: [],
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  createEmptyShot: (sceneUuid?: string, index: number = 1, locationUuid?: string): FilmShot => {
      const now = Date.now();
      return {
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_SHOT',
          shotNumber: index + 1,
          index,
          sceneUuid,
          locationUuid,
          duration: 3,
          description: '',
          dialogue: { items: [] },
          characterIds: [],
          generation: {
              status: 'PENDING',
              prompt: '',
              base: '',
              assets: []
          },
          assets: [],
          createdAt: now,
          updatedAt: now
      };
  },
  
  saveProject: async (project: FilmProject): Promise<void> => {
      await filmProjectService.save(project);
  },
  
  loadProject: async (uuid: string): Promise<FilmProject | null> => {
      const res = await filmProjectService.findById(uuid);
      return res.data || null;
  },
  
  getAllProjects: async (): Promise<FilmProject[]> => {
      const res = await filmProjectService.findAll({ page: 0, size: 1000 });
      return res.data?.content || [];
  },

  deleteProject: async (uuid: string): Promise<void> => {
      await filmProjectService.deleteById(uuid);
  },

  analyzeScript: async (content: string): Promise<FilmAnalysisResult> => {
    if (!ai) throw new Error("API Key not configured");

    const prompt = `
      As a professional Assistant Director, analyze the following screenplay/script.
      
      Script Content:
      """
      ${content.slice(0, 15000)}
      """
      
      Task:
      1. Identify all speaking Characters.
      2. Identify all Locations (INT/EXT).
      3. Break down the script into Scenes.
      4. Suggest a list of Key Props needed.
      
      Return a JSON object with the following structure:
      {
        "characters": [{ "name": "string", "characterType": "HUMAN|ANIMAL|ROBOT", "description": "string", "age": "string", "gender": "string" }],
        "locations": [{ "name": "string", "indoor": boolean, "timeOfDay": "DAY|NIGHT", "visualDescription": "string" }],
        "props": [{ "name": "string", "description": "string", "role": "PLOT_DEVICE|ATMOSPHERE" }],
        "scenes": [{ 
            "index": number, 
            "locationName": "string", 
            "summary": "string", 
            "moodTags": ["string"], 
            "characterNames": ["string"],
            "visualPrompt": "string"
        }]
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const data = parseAIResponse<AnalyzeScriptResponse>(response.text || '{}');
    if (!data) throw new Error("Failed to parse AI response");

    const now = Date.now();

    const characters: Partial<FilmCharacter>[] = (data.characters || []).map((c) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_CHARACTER',
        name: c.name || 'Unknown Character',
        characterType: normalizeFilmCharacterType(c.characterType),
        status: 'ACTIVE',
        description: c.description || '',
        appearance: {
            ageGroup: c.age,
            gender: c.gender
        },
        personality: { traits: [] },
        refAssets: [],
        createdAt: now, updatedAt: now
    }));

    const locations: Partial<FilmLocation>[] = (data.locations || []).map((l) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_LOCATION',
        name: l.name || 'Unknown Location',
        indoor: l.indoor ?? true,
        timeOfDay: l.timeOfDay || 'DAY',
        visualDescription: l.visualDescription,
        atmosphereTags: [],
        createdAt: now, updatedAt: now
    }));

    const props: Partial<FilmProp>[] = (data.props || []).map((p) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_PROP',
        name: p.name || 'Unknown Prop',
        description: p.description || '',
        tags: [],
        createdAt: now, updatedAt: now
    }));

    const scenes: Partial<FilmScene>[] = (data.scenes || []).map((s) => {
        const loc = locations.find(l => l.name === s.locationName) || locations[0];
        const chars = characters
            .filter((c) => {
                if (!c.name || !s.characterNames) {
                    return false;
                }
                return s.characterNames.includes(c.name);
            })
            .map((c) => c.uuid)
            .filter((uuid): uuid is string => typeof uuid === 'string');

        return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: 'FILM_SCENE',
            index: s.index || 1,
            locationUuid: loc?.uuid,
            summary: s.summary || '',
            moodTags: s.moodTags || [],
            characterUuids: chars,
            propUuids: [],
            visualPrompt: s.visualPrompt,
            createdAt: now, updatedAt: now
        };
    });

    return {
        characters,
        locations,
        props,
        scenes,
        shots: []
    };
  },

  extractCharacters: async (content: string): Promise<FilmCharacter[]> => {
      if (!ai) throw new Error("API Key not configured");

      const prompt = `
        Analyze the script and extract a detailed list of all characters.
        For each character, infer their physical appearance, personality traits, and role in the story.
        
        Script:
        """${content.slice(0, 15000)}"""
        
        Return JSON: { 
            "characters": [{ 
                "name": "string", 
                "role": "PROTAGONIST|ANTAGONIST|SUPPORTING|EXTRA", 
                "gender": "MALE|FEMALE|NON_BINARY|UNKNOWN",
                "age": "string (e.g. '30s', 'Teenager')",
                "description": "Visual description suitable for AI image generation prompts",
                "traits": ["string", "string"]
            }] 
        }
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: "application/json" }
      });

      const data = parseAIResponse<ExtractCharactersResponse>(response.text || '{}');
      const now = Date.now();
      
      return (data?.characters || []).map((c) => ({
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_CHARACTER',
          name: c.name || 'Unknown Character',
          characterType: 'HUMAN',
          status: 'ACTIVE',
          description: c.description || '',
          appearance: {
              gender: c.gender,
              ageGroup: c.age
          },
          personality: {
              traits: c.traits || []
          },
          refAssets: [],
          createdAt: now, 
          updatedAt: now
      }));
  },

  extractProps: async (content: string): Promise<FilmProp[]> => {
      if (!ai) throw new Error("API Key not configured");

      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Extract a list of significant props (objects) from this script. 
          Focus on items that characters interact with or are crucial to the plot.
          
          Script:
          """${content.slice(0, 10000)}"""
          
          Return JSON: { "props": [{ "name": "string", "role": "PLOT_DEVICE|SYMBOL|CHARACTER_BIND|ATMOSPHERE", "description": "visual description for image generation" }] }`,
          config: { responseMimeType: "application/json" }
      });

      const data = parseAIResponse<ExtractPropsResponse>(response.text || '{}');
      const now = Date.now();
      
      return (data?.props || []).map((p) => ({
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_PROP',
          name: p.name || 'Unknown Prop',
          description: p.description || '',
          tags: [],
          createdAt: now, 
          updatedAt: now
      }));
  },

  generateImage: async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
    if (!ai) return `https://placehold.co/1280x720/1a1a1a/FFF?text=${encodeURIComponent(prompt.slice(0, 30))}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: normalizeImageAspectRatio(aspectRatio) } }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data");
    } catch (e) {
        console.error("Generate Image Failed", e);
        return `https://placehold.co/1280x720/331a1a/FFF?text=Error`;
    }
  },
  
  generateVideo: async (prompt: string, imageUrl?: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  },
};
