
export interface LUTData {
    id: string;
    name: string;
    size: number;
    domainMin: [number, number, number];
    domainMax: [number, number, number];
    data: Float32Array;
    texture: WebGLTexture | null;
}

export interface ColorGradeSettings {
    enabled: boolean;
    lutId?: string;
    lutIntensity: number;
    exposure: number;
    contrast: number;
    saturation: number;
    temperature: number;
    tint: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
    vibrance: number;
    highlightHue: number;
    highlightSat: number;
    shadowHue: number;
    shadowSat: number;
    midtoneHue: number;
    midtoneSat: number;
}

export const DEFAULT_COLOR_GRADE: ColorGradeSettings = {
    enabled: true,
    lutIntensity: 1.0,
    exposure: 0.0,
    contrast: 1.0,
    saturation: 1.0,
    temperature: 0.0,
    tint: 0.0,
    highlights: 0.0,
    shadows: 0.0,
    whites: 0.0,
    blacks: 0.0,
    vibrance: 0.0,
    highlightHue: 0.0,
    highlightSat: 0.0,
    shadowHue: 0.0,
    shadowSat: 0.0,
    midtoneHue: 0.0,
    midtoneSat: 0.0
};

export class LUTService {
    private luts = new Map<string, LUTData>();
    private gl: WebGL2RenderingContext | null = null;
    
    public setContext(gl: WebGL2RenderingContext) {
        this.gl = gl;
    }
    
    public async loadLUTFromUrl(id: string, url: string): Promise<LUTData | null> {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return this.parseCubeLUT(id, text);
        } catch (e) {
            console.error(`[LUTService] Failed to load LUT from URL: ${url}`, e);
            return null;
        }
    }
    
    public async loadLUTFromFile(id: string, file: File): Promise<LUTData | null> {
        try {
            const text = await file.text();
            return this.parseCubeLUT(id, text);
        } catch (e) {
            console.error(`[LUTService] Failed to load LUT from file: ${file.name}`, e);
            return null;
        }
    }
    
    public parseCubeLUT(id: string, content: string): LUTData | null {
        const lines = content.split('\n');
        
        let size = 0;
        let domainMin: [number, number, number] = [0, 0, 0];
        let domainMax: [number, number, number] = [1, 1, 1];
        let name = id;
        
        const dataPoints: number[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('#') || trimmed === '') continue;
            
            if (trimmed.toLowerCase().startsWith('title')) {
                name = trimmed.split(' ').slice(1).join(' ') || id;
                continue;
            }
            
            if (trimmed.toLowerCase().startsWith('lut_3d_size')) {
                size = parseInt(trimmed.split(/\s+/)[1], 10);
                continue;
            }
            
            if (trimmed.toLowerCase().startsWith('domain_min')) {
                const parts = trimmed.split(/\s+/).slice(1).map(parseFloat);
                if (parts.length >= 3) {
                    domainMin = [parts[0], parts[1], parts[2]];
                }
                continue;
            }
            
            if (trimmed.toLowerCase().startsWith('domain_max')) {
                const parts = trimmed.split(/\s+/).slice(1).map(parseFloat);
                if (parts.length >= 3) {
                    domainMax = [parts[0], parts[1], parts[2]];
                }
                continue;
            }
            
            const values = trimmed.split(/\s+/).map(parseFloat);
            if (values.length >= 3 && !isNaN(values[0])) {
                dataPoints.push(values[0], values[1], values[2]);
            }
        }
        
        if (size === 0 || dataPoints.length === 0) {
            console.error('[LUTService] Invalid CUBE LUT: missing size or data');
            return null;
        }
        
        const expectedPoints = size * size * size * 3;
        if (dataPoints.length < expectedPoints) {
            console.warn(`[LUTService] LUT data incomplete: expected ${expectedPoints}, got ${dataPoints.length}`);
        }
        
        const data = new Float32Array(dataPoints.slice(0, expectedPoints));
        
        const lutData: LUTData = {
            id,
            name,
            size,
            domainMin,
            domainMax,
            data,
            texture: null
        };
        
        this.luts.set(id, lutData);
        
        if (this.gl) {
            this.createLUTTexture(lutData);
        }
        
        return lutData;
    }
    
    public createLUTTexture(lutData: LUTData): WebGLTexture | null {
        if (!this.gl) return null;
        
        const gl = this.gl;
        const { size, data } = lutData;
        
        if (lutData.texture) {
            gl.deleteTexture(lutData.texture);
        }
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_3D, texture);
        
        gl.texImage3D(
            gl.TEXTURE_3D,
            0,
            gl.RGB16F,
            size,
            size,
            size,
            0,
            gl.RGB,
            gl.FLOAT,
            data
        );
        
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        
        lutData.texture = texture;
        
        return texture;
    }
    
    public getLUT(id: string): LUTData | undefined {
        return this.luts.get(id);
    }
    
    public getAllLUTs(): LUTData[] {
        return Array.from(this.luts.values());
    }
    
    public removeLUT(id: string): void {
        const lut = this.luts.get(id);
        if (lut && lut.texture && this.gl) {
            this.gl.deleteTexture(lut.texture);
        }
        this.luts.delete(id);
    }
    
    public getBuiltInLUTs(): Array<{ id: string; name: string }> {
        return [
            { id: 'cinematic_warm', name: 'Cinematic Warm' },
            { id: 'cinematic_cool', name: 'Cinematic Cool' },
            { id: 'vintage', name: 'Vintage' },
            { id: 'bleach_bypass', name: 'Bleach Bypass' },
            { id: 'teal_orange', name: 'Teal & Orange' },
            { id: 'film_stock', name: 'Film Stock' },
            { id: 'high_contrast', name: 'High Contrast' },
            { id: 'low_contrast', name: 'Low Contrast' }
        ];
    }
    
    public generateIdentityLUT(size: number = 32): LUTData {
        const data = new Float32Array(size * size * size * 3);
        
        for (let b = 0; b < size; b++) {
            for (let g = 0; g < size; g++) {
                for (let r = 0; r < size; r++) {
                    const idx = (b * size * size + g * size + r) * 3;
                    data[idx] = r / (size - 1);
                    data[idx + 1] = g / (size - 1);
                    data[idx + 2] = b / (size - 1);
                }
            }
        }
        
        return {
            id: 'identity',
            name: 'Identity (No Change)',
            size,
            domainMin: [0, 0, 0],
            domainMax: [1, 1, 1],
            data,
            texture: null
        };
    }
    
    public cleanup(): void {
        if (this.gl) {
            this.luts.forEach(lut => {
                if (lut.texture) {
                    this.gl!.deleteTexture(lut.texture);
                }
            });
        }
        this.luts.clear();
    }
}

export const lutService = new LUTService();
