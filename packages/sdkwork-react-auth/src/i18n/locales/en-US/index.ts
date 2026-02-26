import type { I18nNamespaceResource } from '@sdkwork/react-i18n';

export const authEnUS: I18nNamespaceResource = {
    common: {
        title: 'Sign In',
        subtitle: 'Welcome back',
    },
    page: {
        login: 'Sign In',
        register: 'Sign Up',
        logout: 'Sign Out',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password?',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
    },
    message: {
        loginSuccess: 'Signed in successfully',
        logoutSuccess: 'Signed out successfully',
        loginFailed: 'Invalid credentials',
    },
};
