import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const videoZhCN: I18nNamespaceResource = {
    common: {
        title: '视频工作室',
        subtitle: '创作电影级视频',
        generate: '生成视频',
        creating: '正在生成视频...',
    },
    page: {
        startFrame: '起始帧',
        endFrame: '结束帧',
        subjectReference: '主体参考图',
        allRoundRefs: '全能参考图',
        multiRefs: '多图参考图',
        prompt: '提示词',
        videoStyle: '视频风格',
        advancedSettings: '高级设置',
        outputSettings: '输出设置',
        duration: '时长',
        cost: '消耗 ~{credits} 积分',
        proPlan: '专业版',
        selectFromAssets: '从资产中选择',
        addFrame: '添加帧',
        maxItems: '最多 {count}',
    },
    modes: {
        textToVideo: '文生视频',
        imageToVideo: '图生视频',
        videoToVideo: '视频转视频',
        faceSwap: '换脸',
        lipSync: '对口型',
    },
    message: {
        noHistory: '暂无历史记录',
        startCreating: '开始创作，您的作品将显示在这里',
    },
};
