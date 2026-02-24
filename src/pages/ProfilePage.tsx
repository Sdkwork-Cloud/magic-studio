
import { useRouter, ROUTES } from 'sdkwork-react-core'
import React from 'react';
import { ProfilePage as UserProfilePage } from 'sdkwork-react-user';
import { useAuthStore } from 'sdkwork-react-auth';
import { useVipStore } from 'sdkwork-react-vip';
;
;

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentSubscription } = useVipStore();
  const { navigate } = useRouter();

  if (!user) {
    return (
      <UserProfilePage 
        user={null}
        currentPlanId={null}
        onLogout={async () => {}}
        onNavigate={(route) => navigate(route)}
        onSignIn={() => navigate(ROUTES.LOGIN)}
        routes={{ LOGIN: ROUTES.LOGIN, VIP: ROUTES.VIP }}
      />
    );
  }

  return (
    <UserProfilePage 
      user={{
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVip: user.isVip
      }}
      currentPlanId={currentSubscription?.planId || null}
      onLogout={logout}
      onNavigate={(route) => navigate(route)}
      onSignIn={() => navigate(ROUTES.LOGIN)}
      routes={{ LOGIN: ROUTES.LOGIN, VIP: ROUTES.VIP }}
    />
  );
};

export default ProfilePage;
