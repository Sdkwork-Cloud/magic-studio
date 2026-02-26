import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const videoEnUS: I18nNamespaceResource = {
    common: {
        title: 'Video Studio',
        subtitle: 'Create cinematic videos',
        generate: 'Generate Video',
        creating: 'Creating Video...',
    },
    page: {
        startFrame: 'Start Frame',
        endFrame: 'End Frame',
        subjectReference: 'Subject Reference',
        allRoundRefs: 'All-round References',
        multiRefs: 'Multi-References',
        prompt: 'Prompt',
        videoStyle: 'Video Style',
        advancedSettings: 'Advanced Settings',
        outputSettings: 'Output Settings',
        duration: 'Duration',
        cost: 'Cost: ~{credits} Credits',
        proPlan: 'Pro Plan',
        selectFromAssets: 'Select from Assets',
        addFrame: 'Add Frame',
        maxItems: 'Max: {count}',
    },
    modes: {
        textToVideo: 'Text to Video',
        imageToVideo: 'Image to Video',
        videoToVideo: 'Video to Video',
        faceSwap: 'Face Swap',
        lipSync: 'Lip Sync',
    },
    message: {
        noHistory: 'No History Yet',
        startCreating: 'Start creating to see your generations here.',
    },
};
