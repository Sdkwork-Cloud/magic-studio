
import { useRouter, ROUTES } from '@sdkwork/react-core'
import React from 'react';
import { LoginPage as AuthLoginPage } from '@sdkwork/react-auth';

const LoginPage: React.FC = () => {
  const { navigate } = useRouter();

  const handleLoginSuccess = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <AuthLoginPage 
      onLoginSuccess={handleLoginSuccess} 
    />
  );
};

export default LoginPage;
