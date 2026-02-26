import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const assetsEnUS: I18nNamespaceResource = {
    common: {
        title: 'Assets',
        subtitle: 'Asset Management',
        import: 'Import',
        upload: 'Upload',
        delete: 'Delete',
        favorite: 'Favorite',
    },
    page: {
        allAssets: 'All Assets',
        images: 'Images',
        videos: 'Videos',
        audio: 'Audio',
        music: 'Music',
        voice: 'Voice',
        search: 'Search assets...',
        noAssets: 'No assets yet',
        dropToUpload: 'Drop files here to upload',
    },
    message: {
        importSuccess: 'Imported successfully',
        deleteConfirm: 'Are you sure you want to delete this asset?',
    },
};
