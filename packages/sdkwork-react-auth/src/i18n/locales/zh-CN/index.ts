import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const authZhCN: I18nNamespaceResource = {
    common: {
        title: '登录',
        subtitle: '欢迎回来',
    },
    page: {
        login: '登录',
        register: '注册',
        logout: '退出登录',
        email: '邮箱',
        password: '密码',
        confirmPassword: '确认密码',
        forgotPassword: '忘记密码？',
        noAccount: '还没有账号？',
        hasAccount: '已有账号？',
    },
    message: {
        loginSuccess: '登录成功',
        logoutSuccess: '退出成功',
        loginFailed: '登录失败，请检查账号密码',
    },
};
