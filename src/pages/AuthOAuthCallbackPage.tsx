import React from 'react';
import { ROUTES } from '@sdkwork/magic-studio-core/router';
import { AuthOAuthCallbackPage as AuthCallbackPage } from '@sdkwork/magic-studio-auth';
import '../styles/auth.css';

interface AuthOAuthCallbackPageProps {
  provider?: string;
}

const AuthOAuthCallbackPage: React.FC<AuthOAuthCallbackPageProps> = ({
  provider,
}) => {
  return (
    <AuthCallbackPage
      homePath={ROUTES.HOME}
      provider={provider}
    />
  );
};

export default AuthOAuthCallbackPage;
