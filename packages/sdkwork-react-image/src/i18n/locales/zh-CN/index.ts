import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const imageZhCN: I18nNamespaceResource = {
    common: {
        title: '图像生成',
        subtitle: 'AI 图像生成',
        generate: '生成',
        generating: '生成中...',
    },
    page: {
        textToImage: '文生图',
        imageToImage: '图生图',
        styleTransfer: '风格迁移',
        nineGrid: '九宫格',
        refImages: '参考图',
        aspectRatio: '画面比例',
        batchSize: '生成数量',
        stylePresets: '风格预设',
        aiEnhance: 'AI 润色',
        negativePrompt: '反向提示词',
    },
    message: {
        noHistory: '暂无历史记录',
        startCreating: '开始创作，您的作品将显示在这里。',
    },
};
