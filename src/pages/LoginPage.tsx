
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React from 'react';
import { LoginPage as AuthLoginPage } from '@sdkwork/react-auth';
import { useAuthStore } from '@sdkwork/react-auth';
;
;

const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const { navigate } = useRouter();

  const handleLogin = async (method: 'email' | 'phone' | 'wechat', credentials: any) => {
    await login(method, credentials);
  };

  const handleNavigateHome = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <AuthLoginPage 
      onLogin={handleLogin} 
      onNavigateHome={handleNavigateHome} 
    />
  );
};

export default LoginPage;
