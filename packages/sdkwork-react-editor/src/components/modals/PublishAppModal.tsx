
import { Button } from '@sdkwork/react-commons'
import { PublishOptions } from '../../types';
import React, { useState } from 'react';
import { X, Rocket, Globe, Package, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
;
import { useTranslation } from '@sdkwork/react-i18n';
;
import { platform } from '@sdkwork/react-core';

interface PublishAppModalProps {
    onClose: () => void;
    onPublish: (options: PublishOptions) => Promise<string>;
    initialName?: string;
}

export const PublishAppModal: React.FC<PublishAppModalProps> = ({ onClose, onPublish, initialName = 'my-app' }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(initialName);
    const [version, setVersion] = useState('1.0.0');
    const [target, setTarget] = useState('Vercel');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployUrl, setDeployUrl] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setIsDeploying(true);
        try {
            const url = await onPublish({ appName: name, version, target });
            setDeployUrl(url);
        } catch (e) {
            console.error(e);
            setIsDeploying(false);
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
                        <Rocket size={18} className="text-blue-500" />
                        <h3 className="font-bold text-white text-sm">{t('editor.explorer.publish.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {deployUrl ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium mb-1">{t('editor.explorer.publish.success')}</h4>
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); platform.openExternal(deployUrl); }}
                                    className="text-xs text-blue-400 hover:underline flex items-center justify-center gap-1"
                                >
                                    {deployUrl} <ExternalLink size={10} />
                                </a>
                            </div>
                            <Button onClick={onClose} className="w-full mt-4">Close</Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                    <Package size={12} /> {t('editor.explorer.publish.app_name')}
                                </label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={isDeploying}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">
                                        {t('editor.explorer.publish.version')}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                        disabled={isDeploying}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                        <Globe size={12} /> {t('editor.explorer.publish.platform')}
                                    </label>
                                    <select 
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        disabled={isDeploying}
                                    >
                                        <option value="Vercel">Vercel</option>
                                        <option value="Netlify">Netlify</option>
                                        <option value="Cloudflare">Cloudflare Pages</option>
                                    </select>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSubmit}
                                disabled={isDeploying || !name.trim()}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 border-0 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {isDeploying ? (
                                    <><Loader2 size={16} className="animate-spin" /> {t('editor.explorer.publish.deploying')}</>
                                ) : (
                                    <><Rocket size={16} /> {t('editor.explorer.publish.deploy')}</>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
