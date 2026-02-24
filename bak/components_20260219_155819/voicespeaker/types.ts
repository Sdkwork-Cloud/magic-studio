
export interface IVoice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral' | string;
  style?: string;   // e.g. 'News', 'Story', 'Whisper'
  language: string; // e.g. 'en-US', 'zh-CN'
  previewUrl?: string;
  tags?: string[];
  provider?: string; // e.g. 'OpenAI', 'ElevenLabs'
}

export interface ChooseVoiceSpeakerProps {
  /** The currently selected voice ID or object */
  value?: string | IVoice | null;
  /** Callback when a voice is confirmed */
  onChange: (voice: IVoice) => void;
  /** Label for the input */
  label?: string;
  /** Optional list of voices. If not provided, defaults to system service. */
  voices?: IVoice[];
  /** Styling override */
  className?: string;
  /** Read only mode */
  readOnly?: boolean;
}

export interface ChooseVoiceSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The currently selected ID */
  selectedId?: string | null;
  onConfirm: (voice: IVoice) => void;
  voices?: IVoice[];
  title?: string;
}
