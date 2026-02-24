
import { User } from '../entities/user.entity';
import { ServiceResult, Result } from '../../../types/core';

export interface IAuthService {
    login(method: 'email' | 'phone' | 'wechat', credentials: any): Promise<ServiceResult<User>>;
    register(data: any): Promise<ServiceResult<User>>;
    sendSmsCode(phone: string): Promise<ServiceResult<boolean>>;
    resetPassword(email: string): Promise<ServiceResult<boolean>>;
    logout(): Promise<ServiceResult<void>>;
}

class AuthService implements IAuthService {
    /**
     * Authenticate user.
     */
    async login(method: 'email' | 'phone' | 'wechat', credentials: any): Promise<ServiceResult<User>> {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mock Validation
            if (method === 'email' && credentials.password === 'error') {
                return Result.error('Invalid credentials', 401);
            }

            const user: User = {
                id: 'u_' + Math.random().toString(36).substr(2, 9),
                username: credentials.email ? credentials.email.split('@')[0] : 'Demo User',
                email: credentials.email || 'demo@openstudio.com',
                isVip: true,
                avatarUrl: ''
            };

            return Result.success(user);
        } catch (e: any) {
            return Result.error(e.message || 'Login failed');
        }
    }
  
    async register(data: any): Promise<ServiceResult<User>> {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const user: User = {
                id: 'u_new_' + Date.now(),
                username: data.email.split('@')[0],
                email: data.email,
                isVip: false
            };
            return Result.success(user);
        } catch (e: any) {
            return Result.error(e.message || 'Registration failed');
        }
    }

    async sendSmsCode(phone: string): Promise<ServiceResult<boolean>> {
        console.log(`[AuthService] Sending code to ${phone}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Result.success(true);
    }

    async resetPassword(email: string): Promise<ServiceResult<boolean>> {
        console.log(`[AuthService] Reset password for ${email}`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return Result.success(true);
    }
  
    async logout(): Promise<ServiceResult<void>> {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('[AuthService] Logged out');
        return Result.success(undefined);
    }
}

export const authService = new AuthService();
