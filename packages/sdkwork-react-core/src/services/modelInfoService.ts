
import { GenerationType, ModelInfoResponse } from 'sdkwork-react-commons';
import { ServiceResult, Result } from 'sdkwork-react-commons';

class ModelInfoService {
    
    public async getModelsByType(type: GenerationType): Promise<ServiceResult<ModelInfoResponse>> {
        let response: ModelInfoResponse = { channels: [] };

        switch (type) {
            case GenerationType.FILM:
            case GenerationType.VIDEO:
                response = {
                    channels: [
                        {
                            name: "Google",
                            description: "Veo Series",
                            icon: "Globe",
                            color: "text-blue-500",
                            models: [
                                { id: "veo-3.1", model: "veo-3.1-generate-preview", description: "Cinematic quality, high coherence", badge: "PRO", badgeColor: "bg-blue-600" },
                                { id: "veo-3.1-fast", model: "veo-3.1-fast-generate-preview", description: "Low latency previews", badge: "FAST", badgeColor: "bg-green-600" }
                            ]
                        },
                        {
                            name: "Sdkwork",
                            description: "Pro Video Gen",
                            icon: "Zap",
                            color: "text-yellow-400",
                            models: [
                                { id: "sdkwork-2.5", model: "sdkwork-2.5", description: "High fidelity output" }
                            ]
                        },
                        {
                            name: "Runway",
                            icon: "Film",
                            color: "text-pink-500",
                            models: [
                                { id: "gen-3-alpha", model: "gen-3-alpha", description: "Realistic motion", badge: "ART" }
                            ]
                        }
                    ]
                };
                break;

            case GenerationType.IMAGE:
                response = {
                    channels: [
                        {
                            name: "Google",
                            icon: "Globe",
                            color: "text-green-500",
                            models: [
                                { id: "gemini-3-pro", model: "gemini-3-pro-image-preview", description: "Complex reasoning & detail", badge: "ULTRA", badgeColor: "bg-purple-600" },
                                { id: "gemini-3-flash", model: "gemini-2.5-flash-image", description: "Speed & efficiency", badge: "FAST" }
                            ]
                        },
                        {
                            name: "Midjourney",
                            icon: "Image",
                            color: "text-purple-500",
                            models: [
                                { id: "mj-v6", model: "midjourney-v6", description: "Artistic excellence", badge: "V6" }
                            ]
                        },
                        {
                            name: "Black Forest",
                            icon: "Cpu",
                            color: "text-white",
                            models: [
                                { id: "flux-pro", model: "flux-pro", description: "State of the art photorealism" }
                            ]
                        }
                    ]
                };
                break;

            case GenerationType.CHARACTER:
                response = {
                    channels: [
                        {
                            name: "HeyGen",
                            icon: "Smile",
                            color: "text-orange-500",
                            models: [
                                { id: "heygen-v2", model: "heygen-avatar-v2", description: "Interactive streaming avatar", badge: "REAL" }
                            ]
                        },
                        {
                            name: "Google",
                            icon: "Globe",
                            models: [
                                { id: "gemini-avatar", model: "gemini-avatar-preview", description: "Character consistency" }
                            ]
                        }
                    ]
                };
                break;

            case GenerationType.MUSIC:
                response = {
                    channels: [
                        {
                            name: "Suno",
                            icon: "Music",
                            color: "text-indigo-500",
                            models: [
                                { id: "suno-v3.5", model: "suno-v3.5", description: "Full song generation", badge: "NEW" },
                                { id: "suno-v3", model: "suno-v3", description: "Stable instrumental" }
                            ]
                        },
                        {
                            name: "Udio",
                            icon: "Music",
                            models: [
                                { id: "udio-v1", model: "udio-v1", description: "High fidelity music" }
                            ]
                        }
                    ]
                };
                break;

            case GenerationType.SPEECH:
                response = {
                    channels: [
                        {
                            name: "Google",
                            icon: "Globe",
                            color: "text-blue-400",
                            models: [
                                { id: "gemini-tts", model: "gemini-2.5-flash-preview-tts", description: "Natural multilingual speech", badge: "FAST" }
                            ]
                        },
                        {
                            name: "ElevenLabs",
                            icon: "Mic",
                            color: "text-green-500",
                            models: [
                                { id: "eleven-v2", model: "eleven_multilingual_v2", description: "Emotive speech synthesis", badge: "PRO" }
                            ]
                        }
                    ]
                };
                break;
            
            default:
                 response = { channels: [] };
        }

        return Result.success(response);
    }
}

export const modelInfoService = new ModelInfoService();
