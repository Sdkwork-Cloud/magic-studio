
import React from 'react';
import { useAuthStore } from '@sdkwork/react-auth';
import { User, Mail, Calendar, Crown } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user } = useAuthStore();
    
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-8">Profile</h1>
                
                <div className="bg-[#111] rounded-xl border border-[#222] p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <User size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
                            <p className="text-gray-400 text-sm">{user?.email || 'user@example.com'}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                            <Mail size={18} className="text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">Email</div>
                                <div className="text-sm">{user?.email || 'user@example.com'}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                            <Calendar size={18} className="text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500">Member Since</div>
                                <div className="text-sm">January 2025</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                            <Crown size={18} className="text-yellow-500" />
                            <div>
                                <div className="text-xs text-gray-500">Plan</div>
                                <div className="text-sm">Free Plan</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
