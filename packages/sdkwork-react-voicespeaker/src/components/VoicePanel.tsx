import React, { useState, useCallback } from 'react';
import { Mic, StopCircle, Play, Pause, Volume2 } from 'lucide-react';
import classNames from 'classnames';

export interface VoicePanelProps {
  className?: string;
  onVoiceGenerated?: (voiceData: Blob) => void;
  disabled?: boolean;
}

export const VoicePanel: React.FC<VoicePanelProps> = ({
  className,
  onVoiceGenerated,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onVoiceGenerated?.(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      (window as any).__voiceRecorder = { mediaRecorder, stream };
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [onVoiceGenerated]);

  const stopRecording = useCallback(() => {
    const recorder = (window as any).__voiceRecorder;
    if (recorder) {
      recorder.mediaRecorder.stop();
      recorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      delete (window as any).__voiceRecorder;
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  }, [audioUrl, isPlaying]);

  return (
    <div className={classNames('p-4', className)}>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">语音合成</h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRecording}
            disabled={disabled}
            className={classNames(
              'p-3 rounded-full transition-colors',
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>

          {audioBlob && (
            <button
              onClick={togglePlayback}
              disabled={disabled}
              className={classNames(
                'p-3 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          )}
        </div>

        {isRecording && (
          <p className="text-sm text-red-500 animate-pulse">正在录音...</p>
        )}

        {audioBlob && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Volume2 size={16} />
            <span>录音已完�?({Math.round(audioBlob.size / 1024)} KB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePanel;
