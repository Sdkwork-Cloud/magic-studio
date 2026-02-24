import type { I18nNamespaceResource } from 'sdkwork-react-i18n';

export const promptZhCN: I18nNamespaceResource = {
    common: {
        title: '提示词优化',
        create: '创建',
        edit: '编辑',
        delete: '删除',
        cancel: '取消',
        confirm: '确认',
        save: '保存',
        loading: '加载中...',
        noData: '暂无数据',
        optimize: '优化',
        copy: '复制',
        copied: '已复制！',
        regenerate: '重新生成',
        continueInChat: '在聊天中继续',
    },
    page: {
        optimize: '优化提示词',
        history: '历史记录',
        templates: '模板',
    },
    form: {
        inputPlaceholder: '请输入您的描述...',
        styleOptional: '目标风格（可选）',
        additionalInstructions: '附加说明（可选）',
        uploadImage: '上传图片',
        uploadVideo: '上传视频',
    },
    message: {
        optimizeSuccess: '提示词优化成功',
        optimizeFailed: '优化失败',
        copiedToClipboard: '已复制到剪贴板',
    },
    error: {
        networkError: '网络错误，请稍后重试',
        serverError: '服务器错误',
        unknownError: '未知错误',
        noInput: '请提供优化输入',
    },
};
