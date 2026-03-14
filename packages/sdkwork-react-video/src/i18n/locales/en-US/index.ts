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
        allRoundReference: 'All-round Reference Video',
        subjectReference: 'Subject Reference Video',
        smartMultiFrame: 'Smart Multi-Frame Video',
        startEndFrame: 'Start-End Frame Video',
        moreTools: 'More Tools',
        faceSwap: 'Face Swap',
        lipSync: 'Lip Sync',
        videoToVideo: 'Video to Video',
        imageToVideo: 'Image to Video',
    },
    message: {
        noHistory: 'No History Yet',
        startCreating: 'Start creating to see your generations here.',
    },
};
