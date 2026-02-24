
import React, { ReactNode } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useVipStore } from '../../../store/vipStore';
import { useRouter } from '../../../router';
import { ROUTES } from '../../../router/routes';
import { Button } from '../../../components/Button/Button';
import { User as UserIcon, LogOut, Crown, Sparkles } from 'lucide-react';
import { PlanTier } from '../../vip/entities/vip.entity';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentSubscription } = useVipStore();
  const { navigate } = useRouter();

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="mb-4">You are not signed in.</p>
            <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
        </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isPro = currentSubscription?.planId === PlanTier.STANDARD || currentSubscription?.planId === PlanTier.PREMIUM;

  return (
    <div className="w-full h-full p-8 text-gray-300">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>
      
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-8 max-w-2xl flex items-start gap-6">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.username[0]}
          </div>
          
          <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-white">{user.username}</h2>
                  {isPro && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 text-[10px] font-bold uppercase rounded flex items-center gap-1 border border-yellow-500/30">
                          <Crown size={10} /> PRO
                      </span>
                  )}
              </div>
              <p className="text-gray-500 text-sm mb-6">{user.email}</p>
              
              <div className="flex gap-4">
                  <Button variant="secondary" size="sm">Edit Profile</Button>
                  <Button variant="danger" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut size={14} /> Sign Out
                  </Button>
              </div>
          </div>
      </div>
      
      {!isPro ? (
          <div className="mt-6 bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-blue-500/20 rounded-lg p-6 max-w-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors" />
              
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <h3 className="text-white font-medium mb-1 flex items-center gap-2">
                         <Sparkles size={14} className="text-blue-400" />
                         Upgrade to Pro
                      </h3>
                      <p className="text-sm text-blue-200/60 max-w-md">
                          Unlock AI features, cloud sync, unlimited history, and support the development of Magic Studio.
                      </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate(ROUTES.VIP)}
                    className="shadow-lg shadow-blue-900/20"
                  >
                      Upgrade Now
                  </Button>
              </div>
          </div>
      ) : (
          <div className="mt-6 p-6 border border-[#333] rounded-lg max-w-2xl">
              <h3 className="text-gray-200 font-medium mb-2">Subscription</h3>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Current Plan: <span className="text-white font-medium uppercase">{currentSubscription?.planId}</span></span>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors" onClick={() => navigate(ROUTES.VIP)}>Manage Subscription</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfilePage;
