
export interface SubtitleCue {
    id: string;
    index: number;
    startTime: number;
    endTime: number;
    text: string;
    style?: SubtitleStyle;
}

export interface SubtitleStyle {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    position?: 'bottom' | 'top' | 'middle';
    alignment?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

export interface SubtitleTrack {
    id: string;
    language: string;
    label: string;
    cues: SubtitleCue[];
    isDefault?: boolean;
}

export class SubtitleService {
    public parseSRT(content: string): SubtitleCue[] {
        const cues: SubtitleCue[] = [];
        const blocks = content.trim().split(/\n\s*\n/);
        
        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 3) continue;
            
            const indexLine = lines[0].trim();
            const timeLine = lines[1].trim();
            const textLines = lines.slice(2);
            
            const index = parseInt(indexLine, 10);
            if (isNaN(index)) continue;
            
            const timeMatch = timeLine.match(
                /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/
            );
            
            if (!timeMatch) continue;
            
            const startTime = this.parseTime(
                parseInt(timeMatch[1], 10),
                parseInt(timeMatch[2], 10),
                parseInt(timeMatch[3], 10),
                parseInt(timeMatch[4], 10)
            );
            
            const endTime = this.parseTime(
                parseInt(timeMatch[5], 10),
                parseInt(timeMatch[6], 10),
                parseInt(timeMatch[7], 10),
                parseInt(timeMatch[8], 10)
            );
            
            const text = textLines.join('\n').trim();
            
            cues.push({
                id: `cue-${index}`,
                index,
                startTime,
                endTime,
                text
            });
        }
        
        return cues;
    }
    
    public parseVTT(content: string): SubtitleCue[] {
        const cues: SubtitleCue[] = [];
        const lines = content.split('\n');
        
        let i = 0;
        
        if (lines[0] && lines[0].trim() === 'WEBVTT') {
            i = 1;
        }
        
        while (i < lines.length) {
            if (lines[i].includes('-->')) {
                const timeLine = lines[i].trim();
                const timeMatch = timeLine.match(
                    /(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})/
                );
                
                if (!timeMatch) {
                    const shortTimeMatch = timeLine.match(
                        /(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/
                    );
                    
                    if (shortTimeMatch) {
                        const startTime = this.parseTime(
                            0,
                            parseInt(shortTimeMatch[1], 10),
                            parseInt(shortTimeMatch[2], 10),
                            parseInt(shortTimeMatch[3], 10)
                        );
                        
                        const endTime = this.parseTime(
                            0,
                            parseInt(shortTimeMatch[4], 10),
                            parseInt(shortTimeMatch[5], 10),
                            parseInt(shortTimeMatch[6], 10)
                        );
                        
                        i++;
                        const textLines: string[] = [];
                        while (i < lines.length && lines[i].trim() !== '') {
                            textLines.push(lines[i]);
                            i++;
                        }
                        
                        cues.push({
                            id: `cue-${cues.length + 1}`,
                            index: cues.length + 1,
                            startTime,
                            endTime,
                            text: textLines.join('\n').trim()
                        });
                    }
                } else {
                    const startTime = this.parseTime(
                        parseInt(timeMatch[1], 10),
                        parseInt(timeMatch[2], 10),
                        parseInt(timeMatch[3], 10),
                        parseInt(timeMatch[4], 10)
                    );
                    
                    const endTime = this.parseTime(
                        parseInt(timeMatch[5], 10),
                        parseInt(timeMatch[6], 10),
                        parseInt(timeMatch[7], 10),
                        parseInt(timeMatch[8], 10)
                    );
                    
                    i++;
                    const textLines: string[] = [];
                    while (i < lines.length && lines[i].trim() !== '') {
                        textLines.push(lines[i]);
                        i++;
                    }
                    
                    cues.push({
                        id: `cue-${cues.length + 1}`,
                        index: cues.length + 1,
                        startTime,
                        endTime,
                        text: textLines.join('\n').trim()
                    });
                }
            } else {
                i++;
            }
        }
        
        return cues;
    }
    
    public exportSRT(cues: SubtitleCue[]): string {
        const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
        
        const lines: string[] = [];
        
        sortedCues.forEach((cue, index) => {
            lines.push(`${index + 1}`);
            lines.push(`${this.formatTimeSRT(cue.startTime)} --> ${this.formatTimeSRT(cue.endTime)}`);
            lines.push(cue.text);
            lines.push('');
        });
        
        return lines.join('\n');
    }
    
    public exportVTT(cues: SubtitleCue[]): string {
        const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
        
        const lines: string[] = ['WEBVTT', ''];
        
        sortedCues.forEach((cue) => {
            lines.push(`${this.formatTimeVTT(cue.startTime)} --> ${this.formatTimeVTT(cue.endTime)}`);
            lines.push(cue.text);
            lines.push('');
        });
        
        return lines.join('\n');
    }
    
    private parseTime(hours: number, minutes: number, seconds: number, milliseconds: number): number {
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
    
    private formatTimeSRT(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
    
    private formatTimeVTT(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    public async loadFromFile(file: File): Promise<SubtitleCue[]> {
        const content = await file.text();
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (extension === 'vtt') {
            return this.parseVTT(content);
        } else {
            return this.parseSRT(content);
        }
    }
    
    public async loadFromUrl(url: string): Promise<SubtitleCue[]> {
        const response = await fetch(url);
        const content = await response.text();
        const extension = url.split('.').pop()?.toLowerCase();
        
        if (extension === 'vtt') {
            return this.parseVTT(content);
        } else {
            return this.parseSRT(content);
        }
    }
    
    public downloadSRT(cues: SubtitleCue[], filename: string = 'subtitles.srt'): void {
        const content = this.exportSRT(cues);
        this.download(content, filename, 'text/srt');
    }
    
    public downloadVTT(cues: SubtitleCue[], filename: string = 'subtitles.vtt'): void {
        const content = this.exportVTT(cues);
        this.download(content, filename, 'text/vtt');
    }
    
    private download(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    public shiftCues(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
        return cues.map(cue => ({
            ...cue,
            startTime: Math.max(0, cue.startTime + offsetSeconds),
            endTime: Math.max(0, cue.endTime + offsetSeconds)
        }));
    }
    
    public scaleCues(cues: SubtitleCue[], factor: number, origin: number = 0): SubtitleCue[] {
        return cues.map(cue => ({
            ...cue,
            startTime: origin + (cue.startTime - origin) * factor,
            endTime: origin + (cue.endTime - origin) * factor
        }));
    }
    
    public mergeCues(cues1: SubtitleCue[], cues2: SubtitleCue[]): SubtitleCue[] {
        const merged = [...cues1, ...cues2];
        return merged.sort((a, b) => a.startTime - b.startTime).map((cue, index) => ({
            ...cue,
            index: index + 1,
            id: `cue-${index + 1}`
        }));
    }
    
    public getCueAtTime(cues: SubtitleCue[], time: number): SubtitleCue | undefined {
        return cues.find(cue => time >= cue.startTime && time < cue.endTime);
    }
    
    public getActiveCues(cues: SubtitleCue[], time: number): SubtitleCue[] {
        return cues.filter(cue => time >= cue.startTime && time < cue.endTime);
    }
    
    public validateCues(cues: SubtitleCue[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        cues.forEach((cue, index) => {
            if (cue.startTime < 0) {
                errors.push(`Cue ${index + 1}: Start time is negative`);
            }
            
            if (cue.endTime <= cue.startTime) {
                errors.push(`Cue ${index + 1}: End time must be greater than start time`);
            }
            
            if (!cue.text || cue.text.trim() === '') {
                errors.push(`Cue ${index + 1}: Text is empty`);
            }
        });
        
        const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
        for (let i = 1; i < sortedCues.length; i++) {
            if (sortedCues[i].startTime < sortedCues[i - 1].endTime) {
                errors.push(`Cues ${sortedCues[i - 1].index} and ${sortedCues[i].index} overlap`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export const subtitleService = new SubtitleService();

