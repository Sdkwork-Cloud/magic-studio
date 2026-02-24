
import { ServiceResult, Result } from 'sdkwork-react-commons';
import { User } from '../entities/user.entity';

class AuthService {
    async login(method: 'email' | 'phone' | 'wechat', credentials: any): Promise<ServiceResult<User>> {
        // TODO: Implement actual authentication logic
        // For now, return a mock user
        const mockUser: User = {
            id: '1',
            uuid: 'user-1',
            name: credentials.email || 'User',
            email: credentials.email || 'user@example.com',
            avatar: undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        return Result.success(mockUser);
    }

    async logout(): Promise<ServiceResult<void>> {
        // TODO: Implement actual logout logic
        return Result.success(undefined);
    }

    async register(email: string, password: string): Promise<ServiceResult<User>> {
        // TODO: Implement actual registration logic
        const mockUser: User = {
            id: '1',
            uuid: 'user-1',
            name: email.split('@')[0],
            email: email,
            avatar: undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        return Result.success(mockUser);
    }

    async sendSmsCode(phone: string): Promise<ServiceResult<void>> {
        // TODO: Implement SMS code sending
        console.log(`Sending SMS code to ${phone}`);
        return Result.success(undefined);
    }

    async verifySmsCode(phone: string, code: string): Promise<ServiceResult<boolean>> {
        // TODO: Implement SMS code verification
        return Result.success(true);
    }

    async resetPassword(email: string): Promise<ServiceResult<void>> {
        // TODO: Implement password reset logic
        console.log(`Sending password reset email to ${email}`);
        return Result.success(undefined);
    }
}

export const authService = new AuthService();
