
import { Button } from '@sdkwork/magic-studio-commons'
import { GitSyncOptions } from '../../types';
import React, { useState } from 'react';
import { X, GitBranch, ArrowUpCircle, CheckCircle2, Loader2, GitCommit } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';

interface GitHubSyncModalProps {
    onClose: () => void;
    onSync: (options: GitSyncOptions) => Promise<void>;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ onClose, onSync }) => {
    const { t } = useTranslation();
    const [repository, setRepository] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [branch, setBranch] = useState('main');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!repository.trim() || !branch.trim() || !message.trim()) return;
        setIsSyncing(true);
        try {
            await onSync({
                message,
                branch: branch.trim(),
                repository: repository.trim(),
                token: token.trim(),
            });
            setIsSuccess(true);
            setTimeout(onClose, 1500);
        } catch (e) {
            console.error(e);
            setIsSyncing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#252526]">
                    <div className="flex items-center gap-2">
                        <GitBranch size={18} className="text-white" />
                        <h3 className="font-bold text-white text-sm">{t('editor.explorer.git.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-green-500 gap-3">
                            <CheckCircle2 size={48} className="animate-in zoom-in duration-300" />
                            <span className="font-medium">{t('editor.explorer.git.success')}</span>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    Repository
                                </label>
                                <input 
                                    type="text" 
                                    value={repository}
                                    onChange={(e) => setRepository(e.target.value)}
                                    placeholder="owner/repo or https://github.com/owner/repo.git"
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                    disabled={isSyncing}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    <GitBranch size={12} /> {t('editor.explorer.git.branch')}
                                </label>
                                <input 
                                    type="text" 
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                    disabled={isSyncing}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    Personal Access Token
                                </label>
                                <input 
                                    type="password" 
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Optional when local credentials are already configured"
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={isSyncing}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    <GitCommit size={12} /> {t('editor.explorer.git.commit_msg')}
                                </label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="feat: update feature..."
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                                    disabled={isSyncing}
                                />
                            </div>

                            <Button 
                                onClick={handleSubmit}
                                disabled={isSyncing || !repository.trim() || !branch.trim() || !message.trim()}
                                className="w-full py-2.5 bg-[#2da44e] hover:bg-[#2c974b] border-0 text-white font-medium flex items-center justify-center gap-2"
                            >
                                {isSyncing ? (
                                    <><Loader2 size={16} className="animate-spin" /> {t('editor.explorer.git.syncing')}</>
                                ) : (
                                    <><ArrowUpCircle size={16} /> {t('editor.explorer.git.push')}</>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
