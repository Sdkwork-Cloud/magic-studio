
import { GoogleGenAI } from "@google/genai";
import type {
  FilmProject,
  FilmCharacter,
  FilmProp,
  FilmLocation,
  FilmScene,
  FilmShot,
  FilmAnalysisResult
} from '../entities/film.entity';
import { MediaResourceType, AssetMediaResource, MediaScene } from '../../../types';
import { filmProjectService } from './filmProjectService';
import { generateUUID } from '../../../utils';

// Initialize Gemini API
const API_KEY = process.env.API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Helper to parse JSON from AI response
const parseAIResponse = <T>(text: string): T | null => {
    try {
        // Strip markdown code blocks if present
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned) as T;
    } catch (e) {
        console.error("Failed to parse AI JSON", e);
        return null;
    }
};

/**
 * Film Domain Service
 * Handles business logic, AI operations, and entity factories.
 * Delegates persistence to FilmProjectService.
 */
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
        language: 'zh-CN',
        defaultLanguage: 'zh-CN',
        imageModel: 'default',
        videoModel: 'default',
        aspect: '16:9',
        resolution: '1080P',
        fps: 24,
        quality: 'standard',
        generation: {
          autoImage: false,
          autoVideo: false,
          parallel: true,
          maxConcurrent: 3,
        },
      },
      createdAt: now,
      updatedAt: now,
    };
  },

  // --- Factory Methods for Manual Creation ---

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

  getCharacterAssetByScene: (character: FilmCharacter, scene: MediaScene): AssetMediaResource | undefined => {
      return character.refAssets?.find(a => a.scene === scene);
  },

  // 辅助函数：获取角色头像
  getCharacterAvatar: (character: FilmCharacter): AssetMediaResource | undefined => {
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
          characterUuids: [],
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
          sceneUuid,
          locationUuid,
          index,
          duration: 3,
          description: '',
          dialogue: { items: [] },
          characterUuids: [],
          propUuids: [],
          generation: {
              product: 'TEXT_TO_VIDEO',
              modelId: 'default',
              prompt: { base: '' },
              assets: [],
              status: 'PENDING'
          },
          assets: [],
          createdAt: now,
          updatedAt: now
      };
  },
  
  // --- Proxy Persistence Methods to Standard Service ---
  
  saveProject: async (project: FilmProject): Promise<void> => {
      // Validate business rules here if needed
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

  // ============================================================================
  // AI Logic: Script Analysis
  // ============================================================================
  
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

    const data = parseAIResponse<any>(response.text || '{}');
    if (!data) throw new Error("Failed to parse AI response");

    const now = Date.now();

    // Map Raw AI Data to Entities
    const characters: Partial<FilmCharacter>[] = (data.characters || []).map((c: any) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_CHARACTER',
        name: c.name,
        characterType: c.characterType || 'HUMAN',
        status: 'ACTIVE',
        description: c.description,
        appearance: {
            ageGroup: c.age,
            gender: c.gender
        },
        personality: { traits: [] },
        createdAt: now, updatedAt: now
    }));

    const locations: Partial<FilmLocation>[] = (data.locations || []).map((l: any) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_LOCATION',
        name: l.name,
        indoor: l.indoor,
        timeOfDay: l.timeOfDay || 'DAY',
        visualDescription: l.visualDescription,
        atmosphereTags: [],
        createdAt: now, updatedAt: now
    }));

    const props: Partial<FilmProp>[] = (data.props || []).map((p: any) => ({
        id: generateUUID(),
        uuid: generateUUID(),
        type: 'FILM_PROP',
        name: p.name,
        description: p.description,
        tags: [],
        characterUuids: [],
        assets: [],
        createdAt: now, updatedAt: now
    }));

    const scenes: Partial<FilmScene>[] = (data.scenes || []).map((s: any) => {
        // Find links
        const loc = locations.find(l => l.name === s.locationName) || locations[0];
        const chars = characters.filter(c => s.characterNames?.includes(c.name)).map(c => c.uuid!);

        return {
            id: generateUUID(),
            uuid: generateUUID(),
            type: 'FILM_SCENE',
            index: s.index,
            locationUuid: loc?.uuid,
            summary: s.summary,
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

  // ============================================================================
  // AI Logic: Granular Extraction
  // ============================================================================

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

      const data = parseAIResponse<any>(response.text || '{}');
      const now = Date.now();
      
      return (data.characters || []).map((c: any) => ({
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_CHARACTER',
          name: c.name,
          characterType: 'HUMAN',
          status: 'ACTIVE',
          description: c.description,
          appearance: {
              gender: c.gender,
              ageGroup: c.age
          },
          personality: {
              traits: c.traits || []
          },
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

      const data = parseAIResponse<any>(response.text || '{}');
      const now = Date.now();
      
      return (data.props || []).map((p: any) => ({
          id: generateUUID(),
          uuid: generateUUID(),
          type: 'FILM_STORY_PROP',
          name: p.name,
          description: p.description,
          tags: [],
          characterUuids: [],
          assets: [],
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
            config: { imageConfig: { aspectRatio: aspectRatio as any } }
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
    // Mock implementation - replace with real AI service when available (Veo)
    await new Promise(resolve => setTimeout(resolve, 5000));
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  },
};
