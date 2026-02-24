import { ServiceResult, Result } from 'sdkwork-react-commons';
import { sdk, hasSdkworkClient } from 'sdkwork-react-core';
import type { LoginVO, UserInfo, LoginRequest, RegisterRequest } from '@sdkwork/app-sdk';
import { User } from '../entities/user.entity';

function mapUserInfoToUser(userInfo: UserInfo): User {
    return {
        id: String(userInfo.id),
        uuid: String(userInfo.id),
        name: userInfo.nickname || userInfo.username,
        email: userInfo.email || '',
        avatar: userInfo.avatar,
        phone: userInfo.phone,
        createdAt: userInfo.createdAt ? new Date(userInfo.createdAt).getTime() : Date.now(),
        updatedAt: Date.now(),
    };
}

class AuthService {
    private getAuthModule() {
        if (!hasSdkworkClient()) {
            throw new Error('SDK not initialized. Call initSdkworkClient() first.');
        }
        return sdk.auth;
    }

    async login(username: string, password: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        try {
            const auth = this.getAuthModule();
            const request: LoginRequest = { username, password };
            const loginVO = await auth.login(request);
            
            const user = mapUserInfoToUser(loginVO.userInfo);
            
            return Result.success({ user, loginVO });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            return Result.failure(message);
        }
    }

    async loginWithEmail(email: string, password: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        return this.login(email, password);
    }

    async loginWithPhone(phone: string, password: string): Promise<ServiceResult<{ user: User; loginVO: LoginVO }>> {
        return this.login(phone, password);
    }

    async logout(): Promise<ServiceResult<void>> {
        try {
            const auth = this.getAuthModule();
            await auth.logout();
            return Result.success(undefined);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Logout failed';
            return Result.failure(message);
        }
    }

    async register(username: string, password: string, email?: string, phone?: string): Promise<ServiceResult<User>> {
        try {
            const auth = this.getAuthModule();
            const request: RegisterRequest = { username, password, email, phone };
            const userInfo = await auth.register(request);
            
            const user = mapUserInfoToUser(userInfo);
            return Result.success(user);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            return Result.failure(message);
        }
    }

    async refreshToken(refreshToken: string): Promise<ServiceResult<LoginVO>> {
        try {
            const auth = this.getAuthModule();
            const loginVO = await auth.refreshToken({ refreshToken });
            return Result.success(loginVO);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Token refresh failed';
            return Result.failure(message);
        }
    }

    async sendSmsCode(_phone: string): Promise<ServiceResult<void>> {
        console.warn('[AuthService] sendSmsCode not implemented in SDK yet');
        return Result.success(undefined);
    }

    async verifySmsCode(_phone: string, _code: string): Promise<ServiceResult<boolean>> {
        console.warn('[AuthService] verifySmsCode not implemented in SDK yet');
        return Result.success(true);
    }

    async resetPassword(_email: string): Promise<ServiceResult<void>> {
        console.warn('[AuthService] resetPassword not implemented in SDK yet');
        return Result.success(undefined);
    }
}

export const authService = new AuthService();
