import { ROUTES } from '@sdkwork/magic-studio-core/router';
import React from 'react';
import { LoginPage as AuthLoginPage } from '@sdkwork/magic-studio-auth';
import '../styles/auth.css';

const LoginPage: React.FC = () => {
  return <AuthLoginPage homePath={ROUTES.HOME} />;
};

export default LoginPage;
