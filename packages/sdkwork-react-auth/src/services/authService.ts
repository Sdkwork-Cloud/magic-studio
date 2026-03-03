import { ServiceResult, Result } from '@sdkwork/react-commons';
import { sdk, hasSdkworkClient } from '@sdkwork/react-core';
import { i18nService } from '@sdkwork/react-i18n';
import type {
    LoginVO,
    UserInfoVO,
    LoginForm,
    RegisterForm,
    QrCodeVO,
    QrCodeStatusVO,
    VerifyResultVO,
    PasswordResetRequestForm,
    PasswordResetForm,
    VerifyCodeSendForm,
    VerifyCodeCheckForm,
} from '@sdkwork/app-sdk';
import { User } from '../entities/user.entity';

type SmsPurpose = 'login' | 'register' | 'reset_password';
type PasswordResetChannel = 'EMAIL' | 'SMS';
type SmsPurposeUpper = 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';

interface ApiEnvelope<T> {
    data?: T;
}

function extractApiData<T>(value: T | ApiEnvelope<T> | undefined): T | undefined {
    if (!value) {
        return undefined;
    }
    if (typeof value === 'object' && 'data' in value) {
        return (value as ApiEnvelope<T>).data;
    }
    return value as T;
}

function mapUserInfoToUser(userInfo?: UserInfoVO): User {
    const id = userInfo?.id ?? '';
    const username = userInfo?.username || '';
    const nickname = userInfo?.nickname || '';
    return {
        id: String(id),
        uuid: String(id),
        name: nickname || username || 'User',
        username,
        email: userInfo?.email || '',
        avatar: userInfo?.avatar,
        phone: userInfo?.phone,
        createdAt: userInfo?.createdAt ? new Date(userInfo.createdAt).getTime() : Date.now(),
        updatedAt: Date.now(),
    };
}

function mapSmsPurposeToUpperType(purpose: SmsPurpose): SmsPurposeUpper {
    if (purpose === 'reset_password') {
        return 'RESET_PASSWORD';
    }
    if (purpose === 'register') {
        return 'REGISTER';
    }
    return 'LOGIN';
}

class AuthService {
    private getClient() {
        if (!hasSdkworkClient()) {
            throw new Error('SDK not initialized. Call initSdkworkClient() first.');
        }
        return sdk.client;
    }

    async login(username: string, password: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        try {
            const request: LoginForm = { username, password };
            const response = await this.getClient().login.login(request);
            const loginVO = extractApiData<LoginVO>(response);
            if (!loginVO) {
                return Result.error(i18nService.t('auth.error.login_failed'));
            }

            const user = mapUserInfoToUser(loginVO.userInfo);
            return Result.success({ user, loginVO });
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.login_failed');
            return Result.error(message);
        }
    }

    async loginWithEmail(email: string, password: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        return this.login(email, password);
    }

    async loginWithPhone(phone: string, code: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        try {
            const response = await this.getClient().phone.login({ phone, code });
            const loginVO = extractApiData<LoginVO>(response);
            if (!loginVO) {
                return Result.error(i18nService.t('auth.error.login_failed'));
            }

            const user = mapUserInfoToUser(loginVO.userInfo);
            return Result.success({ user, loginVO });
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.login_failed');
            return Result.error(message);
        }
    }

    async logout(): Promise<ServiceResult<void>> {
        try {
            await this.getClient().logout.logout();
            return Result.success(undefined);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.logout_failed');
            return Result.error(message);
        }
    }

    async register(username: string, password: string, email?: string, phone?: string): Promise<ServiceResult<User>> {
        try {
            const request: RegisterForm = {
                username,
                password,
                confirmPassword: password,
                email,
                phone,
            };
            const response = await this.getClient().register.register(request);
            const userInfo = extractApiData<UserInfoVO>(response);
            const user = mapUserInfoToUser(userInfo);
            return Result.success(user);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.registration_failed');
            return Result.error(message);
        }
    }

    async registerWithPhone(phone: string, code: string, password: string, email?: string): Promise<ServiceResult<User>> {
        const verifyResult = await this.verifySmsCode(phone, code, 'register');
        if (!verifyResult.success) {
            return Result.error(verifyResult.message || i18nService.t('auth.error.verification_failed'));
        }
        if (!verifyResult.data) {
            return Result.error(i18nService.t('auth.error.invalid_verification_code'));
        }

        const username = email?.split('@')[0] || `user_${phone.slice(-6)}`;
        return this.register(username, password, email, phone);
    }

    async refreshToken(refreshToken: string): Promise<ServiceResult<LoginVO>> {
        try {
            const response = await this.getClient().refresh.token({ refreshToken });
            const loginVO = extractApiData<LoginVO>(response);
            if (!loginVO) {
                return Result.error(i18nService.t('auth.error.token_refresh_failed'));
            }
            return Result.success(loginVO);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.token_refresh_failed');
            return Result.error(message);
        }
    }

    async sendSmsCode(phone: string, purpose: SmsPurpose = 'login'): Promise<ServiceResult<void>> {
        try {
            const request: VerifyCodeSendForm = {
                target: phone,
                type: mapSmsPurposeToUpperType(purpose),
                verifyType: 'PHONE',
            };
            await this.getClient().sms.sendSmsCode(request);
            return Result.success(undefined);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.send_code_failed');
            return Result.error(message);
        }
    }

    async verifySmsCode(phone: string, code: string, purpose: SmsPurpose = 'login'): Promise<ServiceResult<boolean>> {
        try {
            const request: VerifyCodeCheckForm = {
                target: phone,
                type: mapSmsPurposeToUpperType(purpose),
                verifyType: 'PHONE',
                code,
            };
            const response = await this.getClient().sms.verifySmsCode(request);
            const verifyResult = extractApiData<VerifyResultVO>(response);
            return Result.success(Boolean(verifyResult?.valid));
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.verification_failed');
            return Result.error(message);
        }
    }

    async requestPasswordReset(account: string, channel: PasswordResetChannel = 'EMAIL'): Promise<ServiceResult<void>> {
        try {
            const request: PasswordResetRequestForm = {
                account,
                channel,
            };
            await this.getClient().auth.requestPasswordResetChallenge(request);
            return Result.success(undefined);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.send_reset_request_failed');
            return Result.error(message);
        }
    }

    async resetPassword(email: string): Promise<ServiceResult<void>>;
    async resetPassword(account: string, code: string, newPassword: string): Promise<ServiceResult<void>>;
    async resetPassword(accountOrEmail: string, code?: string, newPassword?: string): Promise<ServiceResult<void>> {
        if (!code || !newPassword) {
            return this.requestPasswordReset(accountOrEmail, 'EMAIL');
        }

        try {
            const request: PasswordResetForm = {
                account: accountOrEmail,
                code,
                newPassword,
                confirmPassword: newPassword,
            };
            await this.getClient().password.reset(request);
            return Result.success(undefined);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.reset_password_failed');
            return Result.error(message);
        }
    }

    async generateQrCode(): Promise<ServiceResult<{ qrUrl?: string; qrContent?: string; qrKey: string }>> {
        try {
            const response = await this.getClient().qr.generateQrCode();
            const qrData = extractApiData<QrCodeVO>(response);
            if (!qrData?.qrKey) {
                return Result.error(i18nService.t('auth.error.invalid_qr_data'));
            }

            return Result.success({
                qrKey: String(qrData.qrKey),
                qrUrl: qrData.qrUrl,
                qrContent: qrData.qrContent,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.generate_qr_failed');
            return Result.error(message);
        }
    }

    async checkQrCodeStatus(qrKey: string): Promise<ServiceResult<QrCodeStatusVO>> {
        try {
            const response = await this.getClient().qr.checkQrCodeStatus(qrKey);
            const status = extractApiData<QrCodeStatusVO>(response);
            if (!status) {
                return Result.error(i18nService.t('auth.error.invalid_qr_data'));
            }
            return Result.success(status);
        } catch (error) {
            const message = error instanceof Error ? error.message : i18nService.t('auth.error.check_qr_status_failed');
            return Result.error(message);
        }
    }
}

export const authService = new AuthService();
