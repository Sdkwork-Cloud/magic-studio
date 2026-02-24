
import React, { useState } from 'react';
import { useSettingsStore } from '../../../store/settingsStore';
import { StorageConfig, StorageProviderType } from '../entities/settings.entity';
import { useTranslation } from '../../../i18n';
import { 
    HardDrive, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, 
    Wifi, Check, Globe, FolderTree, Key, Server, Lock
} from 'lucide-react';
import { SettingsSection, SettingInput, SettingSelect, SettingToggle } from './SettingsWidgets';
import { STORAGE_PROVIDERS } from '../data/storageProviders';
import { Button } from '../../../components/Button/Button';
import { storageManager } from '../../../services/storage/StorageManager';
import { S3Provider } from '../../../services/storage/providers/S3Provider';
import { ServerProvider } from '../../../services/storage/providers/ServerProvider';

const StorageSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const storageList = Object.values(settings.storage || {}) as StorageConfig[];

    const updateStorage = async (id: string, updates: Partial<StorageConfig>) => {
        const newConfig = { ...settings.storage[id], ...updates };
        
        // Handle Default Logic: If setting to default, unset others
        let newStorageMap = { ...settings.storage };
        
        if (updates.isDefault) {
            Object.keys(newStorageMap).forEach(k => {
                if (k !== id) newStorageMap[k].isDefault = false;
            });
        }
        
        newStorageMap[id] = newConfig;

        await updateSettings({
            ...settings,
            storage: newStorageMap
        });
        
        // Reload manager to reflect changes in the app
        storageManager.reload();
    };

    const handleCreate = async () => {
        const id = `storage-${Date.now()}`;
        const newStorage: StorageConfig = {
            id,
            name: 'New Storage',
            provider: 'aws',
            mode: 'client', // Default to client
            enabled: true,
            isDefault: storageList.length === 0,
            accessKeyId: '',
            secretAccessKey: '',
            bucket: '',
            region: '',
            endpoint: ''
        };
        const newSettings = {
            ...settings,
            storage: { ...settings.storage, [id]: newStorage }
        };
        await updateSettings(newSettings);
        setEditingId(id);
        setTestResult(null);
        storageManager.reload();
    };

    const handleDelete = async (id: string) => {
        if (confirm(t('common.actions.delete') + '?')) {
            const nextStorage = { ...settings.storage };
            delete nextStorage[id];
            await updateSettings({ ...settings, storage: nextStorage });
            if (editingId === id) setEditingId(null);
            storageManager.reload();
        }
    };

    const handleTestConnection = async (config: StorageConfig) => {
        setIsTesting(true);
        setTestResult(null);
        
        try {
            let success = false;
            if (config.mode === 'server') {
                const provider = new ServerProvider(config);
                success = await provider.testConnection();
            } else {
                const provider = new S3Provider(config);
                success = await provider.testConnection();
            }
            
            if (success) {
                setTestResult({ success: true, message: t('settings.storage.status.success') });
            } else {
                setTestResult({ success: false, message: t('settings.storage.status.failed') });
            }
        } catch (e: any) {
             setTestResult({ success: false, message: t('settings.storage.status.error', { message: e.message }) });
        } finally {
            setIsTesting(false);
        }
    };

    const selectedStorage = editingId ? settings.storage[editingId] : null;
    const providerDef = selectedStorage ? STORAGE_PROVIDERS.find(p => p.id === selectedStorage.provider) : null;

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-right-2 duration-300 p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
                <div>
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <HardDrive size={28} className="text-blue-500" />
                        {t('settings.storage.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                        {t('settings.storage.subtitle')}
                    </p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg shadow-blue-900/20"
                >
                    <Plus size={16} /> {t('common.actions.add')}
                </button>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* List Column */}
                <div className="lg:col-span-4 space-y-3">
                    {storageList.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl bg-gray-50 dark:bg-[#1e1e1e]/50">
                            <AlertCircle size={32} className="opacity-20 mb-3" />
                            <p>{t('settings.storage.no_accounts')}</p>
                        </div>
                    ) : (
                        storageList.map(item => {
                            const def = STORAGE_PROVIDERS.find(p => p.id === item.provider);
                            return (
                                <div 
                                    key={item.id}
                                    onClick={() => { setEditingId(item.id); setTestResult(null); }}
                                    className={`
                                        group relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200
                                        ${editingId === item.id 
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500/50 shadow-sm' 
                                            : 'bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#52525b] hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-[#333] text-gray-500 border border-gray-200 dark:border-[#444]`}>
                                                {def?.icon || <HardDrive size={18} />}
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold text-sm ${editingId === item.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 font-mono uppercase">{item.provider}</span>
                                                    <span className={`text-[9px] px-1 rounded border ${item.mode === 'server' ? 'border-purple-500/30 text-purple-400' : 'border-gray-500/30 text-gray-500'}`}>
                                                        {item.mode === 'server' ? 'PROXY' : 'DIRECT'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {item.isDefault && (
                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                                    DEFAULT
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Editor Column */}
                <div className="lg:col-span-8 relative">
                    {selectedStorage && providerDef ? (
                        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-2xl p-6 sticky top-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl shadow-black/5">
                             <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-[#2d2d2d]">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Edit2 size={16} className="text-blue-500" />
                                        {t('settings.storage.configuration')}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">ID: <span className="font-mono text-[10px]">{editingId}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <SettingToggle 
                                        checked={selectedStorage.isDefault}
                                        onChange={(v) => updateStorage(selectedStorage.id, { isDefault: v, enabled: true })}
                                        label={t('settings.storage.is_default')}
                                    />
                                    <button 
                                        onClick={() => handleDelete(selectedStorage.id)} 
                                        className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                             </div>

                             <SettingsSection title={t('common.form.required')}>
                                 <div className="grid grid-cols-2 gap-4">
                                     <SettingInput 
                                        label={t('common.form.name')} 
                                        value={selectedStorage.name}
                                        onChange={(v) => updateStorage(selectedStorage.id, { name: v })}
                                     />
                                     <SettingSelect 
                                        label={t('settings.storage.provider')}
                                        value={selectedStorage.provider}
                                        onChange={(v) => updateStorage(selectedStorage.id, { provider: v as StorageProviderType })}
                                        options={STORAGE_PROVIDERS.map(p => ({ label: p.name, value: p.id }))}
                                     />
                                 </div>
                             </SettingsSection>
                             
                             {/* Mode Toggle */}
                             <div className="bg-gray-50 dark:bg-[#252526] p-1 rounded-lg flex mb-6 border border-gray-200 dark:border-[#333]">
                                 <button
                                    onClick={() => updateStorage(selectedStorage.id, { mode: 'client' })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${selectedStorage.mode === 'client' ? 'bg-white dark:bg-[#333] text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500'}`}
                                 >
                                     <Key size={14} /> Client Direct (AK/SK)
                                 </button>
                                 <button
                                    onClick={() => updateStorage(selectedStorage.id, { mode: 'server' })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${selectedStorage.mode === 'server' ? 'bg-white dark:bg-[#333] text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500'}`}
                                 >
                                     <Server size={14} /> Server Proxy (API)
                                 </button>
                             </div>

                             {selectedStorage.mode === 'client' ? (
                                 <SettingsSection title={t('settings.storage.credentials')}>
                                     <SettingInput 
                                        label={t('settings.storage.bucket')}
                                        value={selectedStorage.bucket || ''}
                                        onChange={(v) => updateStorage(selectedStorage.id, { bucket: v })}
                                        fullWidth
                                        fontMono
                                     />
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <SettingInput 
                                            label={t('settings.storage.access_key')}
                                            value={selectedStorage.accessKeyId || ''}
                                            onChange={(v) => updateStorage(selectedStorage.id, { accessKeyId: v })}
                                            fontMono
                                            placeholder="AK..."
                                         />
                                         <SettingInput 
                                            label={t('settings.storage.secret_key')}
                                            value={selectedStorage.secretAccessKey || ''}
                                            onChange={(v) => updateStorage(selectedStorage.id, { secretAccessKey: v })}
                                            type="password"
                                            fontMono
                                            placeholder="SK..."
                                         />
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {providerDef.needsRegion && (
                                             <div className="relative">
                                                <SettingInput 
                                                    label={t('settings.storage.region')}
                                                    value={selectedStorage.region || ''}
                                                    onChange={(v) => updateStorage(selectedStorage.id, { region: v })}
                                                    fontMono
                                                    placeholder="e.g. us-east-1"
                                                />
                                             </div>
                                         )}
                                         {providerDef.needsEndpoint && (
                                             <SettingInput 
                                                label={t('settings.storage.endpoint')}
                                                value={selectedStorage.endpoint || ''}
                                                onChange={(v) => updateStorage(selectedStorage.id, { endpoint: v })}
                                                fontMono
                                                placeholder={providerDef.defaultEndpoint ? `e.g. https://${providerDef.defaultEndpoint}` : 'https://...'}
                                             />
                                         )}
                                     </div>
                                 </SettingsSection>
                             ) : (
                                 <SettingsSection title={t('settings.storage.api_config')}>
                                     <SettingInput 
                                        label={t('settings.storage.api_endpoint')}
                                        value={selectedStorage.apiEndpoint || ''}
                                        onChange={(v) => updateStorage(selectedStorage.id, { apiEndpoint: v })}
                                        fullWidth
                                        fontMono
                                        placeholder="https://api.myapp.com/v1/storage"
                                        description="The backend URL that handles presigned URL generation."
                                     />
                                     <div className="grid grid-cols-2 gap-4">
                                         <SettingInput 
                                            label={t('settings.storage.auth_header')}
                                            value={selectedStorage.authHeaderName || 'Authorization'}
                                            onChange={(v) => updateStorage(selectedStorage.id, { authHeaderName: v })}
                                            fontMono
                                            placeholder="Authorization"
                                         />
                                         <SettingInput 
                                            label={t('settings.storage.auth_token')}
                                            type="password"
                                            value={selectedStorage.authToken || ''}
                                            onChange={(v) => updateStorage(selectedStorage.id, { authToken: v })}
                                            fontMono
                                            placeholder="Bearer ..."
                                         />
                                     </div>
                                 </SettingsSection>
                             )}

                             <SettingsSection title="Advanced">
                                 <SettingInput 
                                    label={t('settings.storage.public_domain')}
                                    value={selectedStorage.publicDomain || ''}
                                    onChange={(v) => updateStorage(selectedStorage.id, { publicDomain: v })}
                                    fullWidth
                                    fontMono
                                    placeholder="https://cdn.example.com"
                                    description="Custom domain for public access URLs."
                                 />
                                 
                                 <div className="flex gap-6 mt-4">
                                     {selectedStorage.mode === 'client' && (
                                         <SettingToggle 
                                            label={t('settings.storage.force_path_style')}
                                            checked={selectedStorage.forcePathStyle || false}
                                            onChange={(v) => updateStorage(selectedStorage.id, { forcePathStyle: v })}
                                            description="Enable for MinIO or self-hosted S3."
                                         />
                                     )}
                                     <SettingInput 
                                        label={t('settings.storage.path_prefix')}
                                        value={selectedStorage.pathPrefix || ''}
                                        onChange={(v) => updateStorage(selectedStorage.id, { pathPrefix: v })}
                                        fontMono
                                        placeholder="uploads/"
                                     />
                                 </div>
                             </SettingsSection>
                             
                             {/* Connection Test */}
                             <div className="bg-gray-50 dark:bg-[#252526] rounded-xl p-4 mt-6 border border-gray-200 dark:border-[#333]">
                                 <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <Wifi size={16} className="text-gray-500" />
                                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection Status</span>
                                     </div>
                                     <Button 
                                        onClick={() => handleTestConnection(selectedStorage)}
                                        disabled={isTesting}
                                        className="h-8 text-xs"
                                        variant="secondary"
                                    >
                                        {isTesting ? 'Testing...' : t('settings.storage.test_connection')}
                                    </Button>
                                 </div>
                                 
                                 {testResult && (
                                     <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${testResult.success ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                         {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                         {testResult.message}
                                     </div>
                                 )}
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl">
                             <div className="w-16 h-16 bg-gray-100 dark:bg-[#252526] rounded-full flex items-center justify-center mb-4">
                                <HardDrive size={24} className="opacity-40" />
                            </div>
                            <span className="text-sm font-medium">Select a storage account to configure</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StorageSettings;
