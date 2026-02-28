
import { MediaAccountConfig, MediaPlatformType } from '../entities'
import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore'

import { useTranslation } from '@sdkwork/react-i18n';
import { 
    MessageCircle, Newspaper, Globe, Plus, Trash2, 
    Share2,
    Twitter, Facebook, Linkedin, Instagram, Youtube, MessagesSquare, Hash
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingToggle } from './SettingsWidgets';

// Custom icons not in Lucide or needing specific style
const TikTokIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
);

const DiscordIcon = ({size}: {size:number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-[#5865F2]">
       <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.7728-.6083 1.1581a18.4061 18.4061 0 0 0-5.49 0 12.636 12.636 0 0 0-.616-1.1581.0827.0827 0 0 0-.0797-.0371 19.7363 19.7363 0 0 0-4.8804 1.515.0688.0688 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/>
    </svg>
);

const MediaSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const accounts = Object.values(settings.media || {}) as MediaAccountConfig[];

    // --- Helpers ---
    const updateAccount = (id: string, updates: Partial<MediaAccountConfig>) => {
        const newAccount = { ...settings.media[id], ...updates };
        const newSettings = {
            ...settings,
            media: { ...settings.media, [id]: newAccount }
        };
        updateSettings(newSettings);
    };

    const handleCreate = () => {
        const id = `media-${Date.now()}`;
        const newAccount: MediaAccountConfig = {
            id,
            name: 'New Account',
            platform: 'twitter', // Default
            enabled: true
        };
        const newSettings = {
            ...settings,
            media: { ...settings.media, [id]: newAccount }
        };
        updateSettings(newSettings);
        setSelectedAccountId(id);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextMedia = { ...settings.media };
            delete nextMedia[id];
            updateSettings({ ...settings, media: nextMedia });
            if (selectedAccountId === id) setSelectedAccountId(null);
        }
    };

    const getPlatformIcon = (type: MediaPlatformType) => {
        switch (type) {
            // Global
            case 'twitter': return <Twitter size={18} className="text-[#1DA1F2] dark:text-white" />;
            case 'facebook': return <Facebook size={18} className="text-[#1877F2]" />;
            case 'instagram': return <Instagram size={18} className="text-[#E4405F]" />;
            case 'linkedin': return <Linkedin size={18} className="text-[#0A66C2]" />;
            case 'youtube': return <Youtube size={18} className="text-[#FF0000]" />;
            case 'tiktok': return <TikTokIcon size={18} />;
            case 'discord': return <DiscordIcon size={18} />;
            case 'slack': return <Hash size={18} className="text-[#4A154B]" />;
            case 'telegram': return <MessagesSquare size={18} className="text-[#0088cc]" />;
            case 'whatsapp': return <MessageCircle size={18} className="text-[#25D366]" />;
            case 'reddit': return <div className="font-bold text-[#FF4500] text-[10px] bg-white rounded-full w-5 h-5 flex items-center justify-center">r</div>;
            case 'medium': return <div className="font-serif font-bold text-black dark:text-white text-sm">M</div>;
            
            // China
            case 'wechat-mp': return <MessageCircle size={18} className="text-[#07C160]" />;
            case 'toutiao': return <Newspaper size={18} className="text-[#F85959]" />;
            case 'zhihu': return <span className="text-[10px] font-bold bg-[#0084FF] text-white px-1 rounded">֪</span>;
            case 'bilibili': return <span className="text-[10px] font-bold bg-[#FB7299] text-white px-1 rounded">B</span>;
            case 'weibo': return <span className="text-[10px] font-bold bg-[#E6162D] text-white px-1 rounded">W</span>;
            case 'douyin': return <span className="text-[10px] font-bold bg-black text-white px-1 rounded border border-white">D</span>;
            case 'xiaohongshu': return <span className="text-[10px] font-bold bg-[#FF2442] text-white px-1 rounded">Red</span>;
            
            default: return <Globe size={18} className="text-gray-400" />;
        }
    };

    const getPlatformLabel = (type: MediaPlatformType) => {
        // Fallback to type string if translation missing, but using i18n key is safer
        const key = `settings.media.platforms.${type}`;
        const label = t(key);
        return label === key ? type : label; // Rudimentary fallback check
    };

    // Grouping Platforms for Select
    const platformGroups = [
        { 
            label: t('settings.media.groups.global'), 
            options: ['twitter', 'facebook', 'instagram', 'linkedin', 'reddit', 'medium'] 
        },
        { 
            label: t('settings.media.groups.video'), 
            options: ['youtube', 'tiktok', 'bilibili', 'douyin'] 
        },
        { 
            label: t('settings.media.groups.chat'), 
            options: ['discord', 'slack', 'telegram', 'whatsapp', 'wechat-mp'] 
        },
        { 
            label: t('settings.media.groups.china'), 
            options: ['toutiao', 'zhihu', 'weibo', 'xiaohongshu'] 
        },
        {
            label: t('settings.media.groups.generic'),
            options: ['custom']
        }
    ];

    const selectedAccount = selectedAccountId ? settings.media[selectedAccountId] : null;

    // --- Dynamic Field Rendering Logic ---
    const renderPlatformFields = () => {
        if (!selectedAccount) return null;
        
        const type = selectedAccount.platform;
        
        // 1. WeChat Type (AppID, Secret, Token, AES)
        if (type === 'wechat-mp') {
            return (
                <SettingsSection title={t('settings.media.credentials')}>
                    <SettingInput label={t('settings.media.app_id')} value={selectedAccount.appId || ''} onChange={v => updateAccount(selectedAccount.id, { appId: v })} fullWidth fontMono placeholder="AppID" />
                    <SettingInput label={t('settings.media.app_secret')} type="password" value={selectedAccount.appSecret || ''} onChange={v => updateAccount(selectedAccount.id, { appSecret: v })} fullWidth fontMono />
                    <SettingInput label={t('settings.media.token')} value={selectedAccount.token || ''} onChange={v => updateAccount(selectedAccount.id, { token: v })} fullWidth fontMono placeholder="Token" />
                    <SettingInput label={t('settings.media.encoding_aes_key')} value={selectedAccount.encodingAesKey || ''} onChange={v => updateAccount(selectedAccount.id, { encodingAesKey: v })} fullWidth fontMono />
                </SettingsSection>
            );
        }

        // 2. OAuth Type (Client ID, Client Secret, Redirect URI)
        const isOAuth = ['twitter', 'facebook', 'linkedin', 'instagram', 'reddit', 'google', 'youtube', 'tiktok'].includes(type);
        if (isOAuth) {
            return (
                <SettingsSection title={t('settings.media.credentials')}>
                    <SettingInput label="Client ID / Key" value={selectedAccount.appId || ''} onChange={v => updateAccount(selectedAccount.id, { appId: v })} fullWidth fontMono />
                    <SettingInput label="Client Secret" type="password" value={selectedAccount.appSecret || ''} onChange={v => updateAccount(selectedAccount.id, { appSecret: v })} fullWidth fontMono />
                    <SettingInput label={t('settings.media.redirect_uri')} value={selectedAccount.redirectUri || ''} onChange={v => updateAccount(selectedAccount.id, { redirectUri: v })} fullWidth fontMono placeholder="https://..." />
                    <SettingInput label="Access Token (Optional)" type="password" value={selectedAccount.token || ''} onChange={v => updateAccount(selectedAccount.id, { token: v })} fullWidth fontMono description="If you have a long-lived token" />
                </SettingsSection>
            );
        }

        // 3. Bot Token Type (Token only)
        const isBot = ['discord', 'slack', 'telegram', 'whatsapp'].includes(type);
        if (isBot) {
            return (
                <SettingsSection title={t('settings.media.credentials')}>
                    <SettingInput label={t('settings.media.token')} type="password" value={selectedAccount.token || ''} onChange={v => updateAccount(selectedAccount.id, { token: v })} fullWidth fontMono placeholder="Bot Token / API Key" />
                    {type === 'slack' && (
                        <SettingInput label="Signing Secret" type="password" value={selectedAccount.appSecret || ''} onChange={v => updateAccount(selectedAccount.id, { appSecret: v })} fullWidth fontMono />
                    )}
                </SettingsSection>
            );
        }

        // 4. Default / Custom
        return (
            <SettingsSection title={t('settings.media.credentials')}>
                <SettingInput label={t('settings.media.app_id')} value={selectedAccount.appId || ''} onChange={v => updateAccount(selectedAccount.id, { appId: v })} fullWidth fontMono placeholder="API Key / ID" />
                <SettingInput label={t('settings.media.app_secret')} type="password" value={selectedAccount.appSecret || ''} onChange={v => updateAccount(selectedAccount.id, { appSecret: v })} fullWidth fontMono placeholder="Secret" />
                <SettingInput label={t('settings.media.token')} value={selectedAccount.token || ''} onChange={v => updateAccount(selectedAccount.id, { token: v })} fullWidth fontMono placeholder="Token / Webhook" />
            </SettingsSection>
        );
    };

    return (
        <div className="flex h-full min-h-[500px]">
             {/* Left Sidebar: Account List */}
             <div className="w-64 border-r border-gray-200 dark:border-[#333] pr-0 py-2 flex flex-col gap-1 bg-gray-50/50 dark:bg-[#1e1e1e]/50">
                <div className="px-3 mb-2 flex items-center justify-between">
                     <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {t('settings.media.accounts')}
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                        title={t('common.actions.add')}
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 custom-scrollbar px-2">
                    {accounts.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400 italic">
                            {t('settings.media.no_accounts')}
                        </div>
                    ) : (
                        accounts.map(acc => (
                            <button
                                key={acc.id}
                                onClick={() => setSelectedAccountId(acc.id)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 rounded-md text-left group border border-transparent
                                    ${selectedAccountId === acc.id 
                                        ? 'bg-blue-50 dark:bg-[#094771] text-blue-700 dark:text-white font-medium shadow-sm border-blue-200 dark:border-blue-900' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] hover:text-gray-900 dark:hover:text-gray-200'
                                    }
                                `}
                            >
                                <span className="flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-[#252526] rounded-md shadow-sm border border-gray-100 dark:border-[#333]">
                                    {getPlatformIcon(acc.platform)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="truncate">{acc.name}</div>
                                    <div className="text-[10px] text-gray-400 truncate opacity-70">{getPlatformLabel(acc.platform)}</div>
                                </div>
                                
                                {acc.enabled ? (
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Content: Configuration */}
            <div className="flex-1 pl-8 pr-8 py-4 overflow-y-auto w-full">
                {selectedAccount ? (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-200 w-full max-w-4xl mx-auto">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-[#333]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-[#252526] rounded-xl border border-gray-200 dark:border-[#333] shadow-sm">
                                    {getPlatformIcon(selectedAccount.platform)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            className="bg-transparent border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none w-auto max-w-[200px]"
                                            value={selectedAccount.name}
                                            onChange={(e) => updateAccount(selectedAccount.id, { name: e.target.value })}
                                        />
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-[#252526] px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#333]">
                                            {selectedAccount.platform}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <SettingToggle 
                                    checked={selectedAccount.enabled} 
                                    onChange={(v) => updateAccount(selectedAccount.id, { enabled: v })}
                                />
                                <button 
                                    onClick={() => handleDelete(selectedAccount.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className={!selectedAccount.enabled ? 'opacity-50 pointer-events-none grayscale transition-opacity' : ''}>
                            
                            <SettingsSection title={t('settings.media.platform_config')}>
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('settings.media.platform')}</label>
                                    <div className="relative group/select w-full">
                                        <select
                                            value={selectedAccount.platform}
                                            onChange={(e) => updateAccount(selectedAccount.id, { platform: e.target.value as MediaPlatformType })}
                                            className="w-full appearance-none cursor-pointer bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#52525b] text-sm text-gray-900 dark:text-gray-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm h-9"
                                        >
                                            {platformGroups.map(group => (
                                                <optgroup key={group.label} label={group.label}>
                                                    {group.options.map(opt => (
                                                        <option key={opt} value={opt}>{getPlatformLabel(opt as MediaPlatformType)}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">��</div>
                                    </div>
                                </div>
                            </SettingsSection>

                            {/* Dynamic Fields based on Platform Type */}
                            {renderPlatformFields()}

                            <SettingsSection title="Advanced">
                                <SettingInput 
                                    label={t('settings.media.endpoint')}
                                    value={selectedAccount.endpoint || ''}
                                    onChange={(v) => updateAccount(selectedAccount.id, { endpoint: v })}
                                    fullWidth
                                    fontMono
                                    placeholder="https://api..."
                                    description="Override default API endpoint if using a proxy or custom gateway."
                                />
                            </SettingsSection>

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Share2 size={48} className="opacity-20 mb-4" />
                        <p>{t('settings.media.select_account')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaSettings;
export { MediaSettings };
