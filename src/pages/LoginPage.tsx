
import { useRouter, ROUTES } from '@sdkwork/react-core';
import React from 'react';
import { LoginPage as AuthLoginPage } from '@sdkwork/react-auth';
import { resolvePostLoginTarget } from '../app/authRouteGuard';

const LoginPage: React.FC = () => {
  const { navigate, currentQuery } = useRouter();

  const handleLoginSuccess = () => {
    const target = resolvePostLoginTarget(currentQuery, ROUTES.HOME);
    navigate(target.path, target.query);
  };

  return (
    <AuthLoginPage 
      onLoginSuccess={handleLoginSuccess} 
    />
  );
};

export default LoginPage;
