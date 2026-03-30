import type { StyleOption } from '@sdkwork/react-commons';
import { createLocalizedText } from '@sdkwork/react-i18n';
import {
  OFFLINE_DEMO_VIDEO_URL,
  createOfflineArtwork,
  createOfflineAvatar,
} from '@sdkwork/react-core';
import {
  ArrowRightLeft,
  Bot,
  Clapperboard,
  Image as ImageIcon,
  Layers,
  Music,
  ScanFace,
  Sparkles,
  Type,
  Video,
} from 'lucide-react';

export const PORTAL_MODES = [
  {
    id: 'short_drama',
    label: createLocalizedText('AI Short Drama', '\u77ed\u5267'),
    icon: Clapperboard,
    color: 'text-orange-500',
    desc: createLocalizedText(
      'Generate coherent story clips in one click',
      '\u4e00\u952e\u751f\u6210\u8fde\u8d2f\u6545\u4e8b\u77ed\u7247',
    ),
  },
  {
    id: 'video',
    label: createLocalizedText('AI Video', '\u89c6\u9891'),
    icon: Video,
    color: 'text-pink-400',
    desc: createLocalizedText(
      'Generate high-quality video clips',
      '\u751f\u6210\u9ad8\u54c1\u8d28\u89c6\u9891\u7247\u6bb5',
    ),
  },
  {
    id: 'image',
    label: createLocalizedText('AI Image', '\u56fe\u7247'),
    icon: ImageIcon,
    color: 'text-blue-400',
    desc: createLocalizedText(
      'Generate artistic images and assets',
      '\u751f\u6210\u827a\u672f\u56fe\u50cf\u4e0e\u7d20\u6750',
    ),
  },
  {
    id: 'human',
    label: createLocalizedText('Character', '\u89d2\u8272'),
    icon: Bot,
    color: 'text-green-400',
    desc: createLocalizedText(
      'AI character creation and performance',
      'AI \u89d2\u8272\u521b\u4f5c\u4e0e\u64ad\u62a5',
    ),
  },
  {
    id: 'music',
    label: createLocalizedText('AI Music', '\u97f3\u4e50'),
    icon: Music,
    color: 'text-indigo-400',
    desc: createLocalizedText(
      'Generate background music and sound effects',
      '\u751f\u6210\u80cc\u666f\u97f3\u4e50\u4e0e\u97f3\u6548',
    ),
  },
];

export const GEN_MODES = [
  {
    id: 'smart_reference',
    label: createLocalizedText('Smart Reference', '\u5168\u80fd\u53c2\u8003'),
    icon: Sparkles,
    desc: createLocalizedText('Intelligent Reference', '\u667a\u80fd\u53c2\u8003'),
    validTabs: ['video'],
  },
  {
    id: 'start_end',
    label: createLocalizedText('Start & End', '\u9996\u5c3e\u5e27'),
    icon: ArrowRightLeft,
    desc: createLocalizedText('Start & End Frame', '\u9996\u5c3e\u5e27\u751f\u6210'),
    validTabs: ['video'],
  },
  {
    id: 'smart_multi',
    label: createLocalizedText('Multi-Frame', '\u667a\u80fd\u591a\u5e27'),
    icon: Layers,
    desc: createLocalizedText('Multi-Frame Control', '\u591a\u5e27\u53c2\u8003\u63a7\u5236'),
    validTabs: ['video'],
  },
  {
    id: 'subject_ref',
    label: createLocalizedText('Subject Ref', '\u4e3b\u4f53\u53c2\u8003'),
    icon: ScanFace,
    desc: createLocalizedText('Subject Consistency', '\u4e3b\u4f53\u4e00\u81f4\u6027'),
    validTabs: ['video'],
  },
  {
    id: 'text',
    label: createLocalizedText('Text to Content', '\u6587\u751f\u5185\u5bb9'),
    icon: Type,
    desc: createLocalizedText('Generate using prompts', '\u4f7f\u7528\u63d0\u793a\u8bcd\u751f\u6210'),
    validTabs: ['image', 'short_drama'],
  },
  {
    id: 'ref_multi',
    label: createLocalizedText('Reference Gen', '\u53c2\u8003\u751f\u6210'),
    icon: Layers,
    desc: createLocalizedText(
      'Upload style reference images',
      '\u4e0a\u4f20\u98ce\u683c\u53c2\u8003\u56fe',
    ),
    validTabs: ['image', 'short_drama'],
  },
];

const CINEMATIC_SCENE_ART = createOfflineArtwork({
  title: 'Cinematic Scene',
  subtitle: 'Layered depth, dramatic light, and bundled offline preview',
  eyebrow: 'Magic Studio Film',
  badge: 'Scene',
  accent: '#d97706',
  width: 800,
  height: 520,
});

const CINEMATIC_PORTRAIT_ART = createOfflineAvatar({
  name: 'Film Portrait',
  seed: 'cinematic-portrait',
  accent: '#f97316',
  size: 400,
});

const CINEMATIC_SHEET_ART = createOfflineArtwork({
  title: 'Shot Sheet',
  subtitle: 'Color continuity, framing, and atmosphere references',
  eyebrow: 'Magic Studio Film',
  badge: 'Sheet',
  accent: '#fb923c',
  width: 800,
  height: 800,
});

export const FILM_STYLES: StyleOption[] = [
  {
    id: 'cinematic',
    label: createLocalizedText('Cinematic', '\u7535\u5f71\u8d28\u611f'),
    description: createLocalizedText(
      'Hollywood-style lighting with depth and dramatic contrast.',
      '\u597d\u83b1\u575e\u5f0f\u7535\u5f71\u5149\u5f71\u4e0e\u622f\u5267\u611f\u5c42\u6b21',
    ),
    assets: {
      scene: {
        url: CINEMATIC_SCENE_ART,
      },
      portrait: {
        url: CINEMATIC_PORTRAIT_ART,
      },
      video: {
        url: OFFLINE_DEMO_VIDEO_URL,
      },
      sheet: {
        url: CINEMATIC_SHEET_ART,
      },
    },
    usage: [
      createLocalizedText('Drama', '\u5267\u60c5'),
      createLocalizedText('Commercial', '\u5546\u4e1a'),
      createLocalizedText('Epic', '\u53f2\u8bd7'),
    ],
    prompt:
      'cinematic lighting, depth of field, movie still, color graded, 8k, highly detailed, atmospheric, anamorphic lens, film grain',
    prompt_zh:
      '\u7535\u5f71\u8d28\u611f\u5149\u6548\uff0c\u666f\u6df1\uff0c\u7535\u5f71\u5267\u7167\uff0c\u4e13\u4e1a\u8c03\u8272\uff0c8k\u5206\u8fa8\u7387\uff0c\u9ad8\u7ec6\u8282\uff0c\u6c1b\u56f4\u611f\uff0c\u53d8\u5f62\u5bbd\u94f6\u5e55\u955c\u5934\uff0c\u80f6\u7247\u9897\u7c92',
    previewColor: '#d97706',
  },
  {
    id: 'custom',
    label: createLocalizedText('Custom', '\u81ea\u5b9a\u4e49'),
    description: createLocalizedText(
      'Do not apply a preset. Generate entirely from the prompt.',
      '\u4e0d\u4f7f\u7528\u9884\u8bbe\u98ce\u683c\uff0c\u5b8c\u5168\u6839\u636e\u63d0\u793a\u8bcd\u751f\u6210',
    ),
    usage: [createLocalizedText('Any scenario', '\u4efb\u610f\u573a\u666f')],
    prompt: '',
    prompt_zh: '',
    previewColor: '#6b7280',
    isCustom: true,
  },
];
