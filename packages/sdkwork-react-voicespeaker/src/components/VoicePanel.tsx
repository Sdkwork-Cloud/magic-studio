import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import classNames from 'classnames';
import { AudioRecorder } from '@sdkwork/react-audio';

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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob): void => {
    setAudioBlob(blob);
    onVoiceGenerated?.(blob);
  };

  const handleDelete = (): void => {
    setAudioBlob(null);
  };

  return (
    <div className={classNames('p-4', className)}>
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">Voice Recording</h3>

        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onDelete={handleDelete}
          className={classNames('w-full max-w-md', disabled && 'pointer-events-none opacity-60')}
        />

        {audioBlob && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Volume2 size={16} />
            <span>Recording ready ({Math.round(audioBlob.size / 1024)} KB)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePanel;
