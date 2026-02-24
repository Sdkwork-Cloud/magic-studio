import type { I18nNamespaceResource } from 'sdkwork-react-i18n';

export const promptEnUS: I18nNamespaceResource = {
    common: {
        title: 'Prompt Optimizer',
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        loading: 'Loading...',
        noData: 'No Data',
        optimize: 'Optimize',
        copy: 'Copy',
        copied: 'Copied!',
        regenerate: 'Regenerate',
        continueInChat: 'Continue in Chat',
    },
    page: {
        optimize: 'Optimize Prompt',
        history: 'History',
        templates: 'Templates',
    },
    form: {
        inputPlaceholder: 'Enter your description...',
        styleOptional: 'Target Style (Optional)',
        additionalInstructions: 'Additional Instructions (Optional)',
        uploadImage: 'Upload Image',
        uploadVideo: 'Upload Video',
    },
    message: {
        optimizeSuccess: 'Prompt optimized successfully',
        optimizeFailed: 'Optimization failed',
        copiedToClipboard: 'Copied to clipboard',
    },
    error: {
        networkError: 'Network error, please try again later',
        serverError: 'Server error',
        unknownError: 'Unknown error',
        noInput: 'Please provide input for optimization',
    },
};
