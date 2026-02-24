
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
    onDelete: () => void;
    className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onDelete, className = '' }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                onRecordingComplete(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            
            timerRef.current = window.setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const togglePlayback = () => {
        if (!audioPlayerRef.current || !audioUrl) return;

        if (isPlaying) {
            audioPlayerRef.current.pause();
        } else {
            audioPlayerRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleDelete = () => {
        setAudioUrl(null);
        setDuration(0);
        setIsPlaying(false);
        onDelete();
    };

    // --- RENDER ---

    if (audioUrl) {
        return (
            <div className={`bg-[#18181b] border border-[#333] rounded-xl p-4 flex flex-col gap-3 ${className}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={togglePlayback}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">Recording Captured</span>
                            <span className="text-xs text-gray-500 font-mono">{formatTime(duration)}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleDelete}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#252526] rounded-lg transition-colors"
                        title="Delete and Re-record"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                {/* Hidden Audio Element */}
                <audio 
                    ref={audioPlayerRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)} 
                />
            </div>
        );
    }

    if (isRecording) {
        return (
            <div className={`bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 ${className}`}>
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                        <Mic size={32} className="text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />
                </div>
                <div className="text-center">
                    <div className="text-xl font-mono font-bold text-white mb-1">{formatTime(duration)}</div>
                    <div className="text-xs text-red-400 uppercase tracking-widest font-bold">Recording...</div>
                </div>
                <button 
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] rounded-full text-sm text-gray-200 transition-colors mt-2"
                >
                    <Square size={12} fill="currentColor" /> Stop Recording
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-[#18181b] border border-[#333] border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#555] transition-colors ${className}`}>
            <button 
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-[#252526] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg group"
            >
                <Mic size={32} className="group-hover:scale-110 transition-transform" />
            </button>
            <div className="text-center">
                <div className="text-sm font-medium text-gray-300">Click to Record</div>
                <div className="text-xs text-gray-500 mt-1">Use your microphone to capture a voice sample</div>
            </div>
        </div>
    );
};
