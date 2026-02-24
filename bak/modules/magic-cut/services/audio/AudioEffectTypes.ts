
export interface AudioEffectParams {
    enabled: boolean;
    bypass: boolean;
}

export interface EQParams extends AudioEffectParams {
    lowGain: number;      // -20 to 20 dB
    lowFreq: number;      // 20 to 500 Hz
    midGain: number;      // -20 to 20 dB
    midFreq: number;      // 200 to 5000 Hz
    midQ: number;         // 0.1 to 10
    highGain: number;     // -20 to 20 dB
    highFreq: number;     // 2000 to 20000 Hz
}

export interface CompressorParams extends AudioEffectParams {
    threshold: number;    // -60 to 0 dB
    knee: number;         // 0 to 40 dB
    ratio: number;        // 1 to 20
    attack: number;       // 0 to 1 second
    release: number;      // 0 to 1 second
    makeupGain: number;   // 0 to 24 dB
}

export interface NoiseGateParams extends AudioEffectParams {
    threshold: number;    // -100 to 0 dB
    attack: number;       // 0 to 1 second
    release: number;      // 0 to 1 second
    range: number;        // -inf to 0 dB
}

export interface ReverbParams extends AudioEffectParams {
    roomSize: number;     // 0 to 1
    damping: number;      // 0 to 1
    wetLevel: number;     // 0 to 1
    dryLevel: number;     // 0 to 1
    preDelay: number;     // 0 to 0.1 second
}

export interface LimiterParams extends AudioEffectParams {
    threshold: number;    // -30 to 0 dB
    release: number;      // 0.01 to 1 second
    lookAhead: number;    // 0 to 0.03 second
}

export interface DeEsserParams extends AudioEffectParams {
    frequency: number;    // 2000 to 16000 Hz
    threshold: number;    // -60 to 0 dB
    ratio: number;        // 1 to 20
    attack: number;       // 0 to 0.1 second
    release: number;      // 0 to 0.5 second
}

export type AudioEffectType = 'eq' | 'compressor' | 'noiseGate' | 'reverb' | 'limiter' | 'deEsser';

export type AudioEffectConfig = 
    | { type: 'eq'; params: EQParams }
    | { type: 'compressor'; params: CompressorParams }
    | { type: 'noiseGate'; params: NoiseGateParams }
    | { type: 'reverb'; params: ReverbParams }
    | { type: 'limiter'; params: LimiterParams }
    | { type: 'deEsser'; params: DeEsserParams };

export interface AudioEffectChain {
    effects: AudioEffectConfig[];
}

export const DEFAULT_EQ: EQParams = {
    enabled: true,
    bypass: false,
    lowGain: 0,
    lowFreq: 100,
    midGain: 0,
    midFreq: 1000,
    midQ: 1,
    highGain: 0,
    highFreq: 8000
};

export const DEFAULT_COMPRESSOR: CompressorParams = {
    enabled: true,
    bypass: false,
    threshold: -24,
    knee: 30,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    makeupGain: 0
};

export const DEFAULT_NOISE_GATE: NoiseGateParams = {
    enabled: true,
    bypass: false,
    threshold: -50,
    attack: 0.001,
    release: 0.1,
    range: -80
};

export const DEFAULT_REVERB: ReverbParams = {
    enabled: true,
    bypass: false,
    roomSize: 0.5,
    damping: 0.5,
    wetLevel: 0.3,
    dryLevel: 0.7,
    preDelay: 0.01
};

export const DEFAULT_LIMITER: LimiterParams = {
    enabled: true,
    bypass: false,
    threshold: -1,
    release: 0.1,
    lookAhead: 0.005
};

export const DEFAULT_DE_ESSER: DeEsserParams = {
    enabled: true,
    bypass: false,
    frequency: 6000,
    threshold: -30,
    ratio: 4,
    attack: 0.001,
    release: 0.05
};
