
import {
    AudioEffectConfig,
    EQParams,
    CompressorParams,
    NoiseGateParams,
    ReverbParams,
    LimiterParams,
    DeEsserParams,
    DEFAULT_EQ,
    DEFAULT_COMPRESSOR,
    DEFAULT_NOISE_GATE,
    DEFAULT_REVERB,
    DEFAULT_LIMITER,
    DEFAULT_DE_ESSER
} from './AudioEffectTypes';

export class AudioEffectProcessor {
    private context: AudioContext;
    private masterInput: GainNode;
    private masterOutput: GainNode;
    private effectNodes: Map<string, AudioNode[]> = new Map();

    constructor(context: AudioContext) {
        this.context = context;
        this.masterInput = context.createGain();
        this.masterOutput = context.createGain();
    }

    createEQ(params: Partial<EQParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_EQ, ...params };
        
        const lowFilter = this.context.createBiquadFilter();
        lowFilter.type = 'lowshelf';
        lowFilter.frequency.value = config.lowFreq;
        lowFilter.gain.value = config.lowGain;

        const midFilter = this.context.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.value = config.midFreq;
        midFilter.Q.value = config.midQ;
        midFilter.gain.value = config.midGain;

        const highFilter = this.context.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = config.highFreq;
        highFilter.gain.value = config.highGain;

        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);

        return { input: lowFilter, output: highFilter };
    }

    createCompressor(params: Partial<CompressorParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_COMPRESSOR, ...params };
        
        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = config.threshold;
        compressor.knee.value = config.knee;
        compressor.ratio.value = config.ratio;
        compressor.attack.value = config.attack;
        compressor.release.value = config.release;

        const makeupGain = this.context.createGain();
        makeupGain.gain.value = Math.pow(10, config.makeupGain / 20);

        compressor.connect(makeupGain);

        return { input: compressor, output: makeupGain };
    }

    createNoiseGate(params: Partial<NoiseGateParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_NOISE_GATE, ...params };
        
        const gate = this.context.createDynamicsCompressor();
        gate.threshold.value = config.threshold;
        gate.knee.value = 0;
        gate.ratio.value = 100;
        gate.attack.value = config.attack;
        gate.release.value = config.release;

        return { input: gate, output: gate };
    }

    createLimiter(params: Partial<LimiterParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_LIMITER, ...params };
        
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = config.threshold;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = config.release;

        return { input: limiter, output: limiter };
    }

    createDeEsser(params: Partial<DeEsserParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_DE_ESSER, ...params };
        
        const highPass = this.context.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = config.frequency;
        highPass.Q.value = 2;

        const compressor = this.context.createDynamicsCompressor();
        compressor.threshold.value = config.threshold;
        compressor.ratio.value = config.ratio;
        compressor.attack.value = config.attack;
        compressor.release.value = config.release;

        const inputGain = this.context.createGain();
        const outputGain = this.context.createGain();

        inputGain.connect(highPass);
        highPass.connect(compressor);
        compressor.connect(outputGain);
        inputGain.connect(outputGain);

        return { input: inputGain, output: outputGain };
    }

    createReverb(params: Partial<ReverbParams> = {}): { input: AudioNode; output: AudioNode } {
        const config = { ...DEFAULT_REVERB, ...params };
        
        const convolver = this.context.createConvolver();
        const dryGain = this.context.createGain();
        const wetGain = this.context.createGain();
        const outputGain = this.context.createGain();

        dryGain.gain.value = config.dryLevel;
        wetGain.gain.value = config.wetLevel;

        this.generateImpulseResponse(convolver, config.roomSize, config.damping);

        const inputGain = this.context.createGain();
        inputGain.connect(dryGain);
        inputGain.connect(convolver);
        convolver.connect(wetGain);
        dryGain.connect(outputGain);
        wetGain.connect(outputGain);

        return { input: inputGain, output: outputGain };
    }

    private generateImpulseResponse(convolver: ConvolverNode, roomSize: number, damping: number) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * (1 + roomSize * 3);
        const impulse = this.context.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.exp(-damping * i / sampleRate);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }

        convolver.buffer = impulse;
    }

    buildEffectChain(
        inputNode: AudioNode,
        outputNode: AudioNode,
        effects: AudioEffectConfig[]
    ): void {
        let currentNode: AudioNode = inputNode;

        effects.forEach((effect, index) => {
            if (!effect.params.enabled || effect.params.bypass) return;

            let nodes: { input: AudioNode; output: AudioNode };

            switch (effect.type) {
                case 'eq':
                    nodes = this.createEQ(effect.params);
                    break;
                case 'compressor':
                    nodes = this.createCompressor(effect.params);
                    break;
                case 'noiseGate':
                    nodes = this.createNoiseGate(effect.params);
                    break;
                case 'reverb':
                    nodes = this.createReverb(effect.params);
                    break;
                case 'limiter':
                    nodes = this.createLimiter(effect.params);
                    break;
                case 'deEsser':
                    nodes = this.createDeEsser(effect.params);
                    break;
                default:
                    return;
            }

            currentNode.connect(nodes.input);
            currentNode = nodes.output;
            this.effectNodes.set(`effect_${index}`, [nodes.input, nodes.output]);
        });

        currentNode.connect(outputNode);
    }

    updateEffect(index: number, config: AudioEffectConfig): void {
        const key = `effect_${index}`;
        const existingNodes = this.effectNodes.get(key);
        
        if (existingNodes) {
            this.effectNodes.delete(key);
        }
    }

    dispose(): void {
        this.effectNodes.forEach(nodes => {
            nodes.forEach(node => {
                if ('disconnect' in node) {
                    node.disconnect();
                }
            });
        });
        this.effectNodes.clear();
    }
}

export const createAudioEffectChain = (
    context: AudioContext,
    effects: AudioEffectConfig[]
): { input: GainNode; output: GainNode; processor: AudioEffectProcessor } => {
    const processor = new AudioEffectProcessor(context);
    const input = context.createGain();
    const output = context.createGain();

    processor.buildEffectChain(input, output, effects);

    return { input, output, processor };
};
