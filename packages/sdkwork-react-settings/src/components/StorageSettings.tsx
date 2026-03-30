
import { StorageConfig, StorageProviderType, MaterialStorageConfig } from '../entities'
import { Button } from '@sdkwork/react-commons'
import { storageManager, S3Provider, ServerProvider } from '@sdkwork/react-core'
import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from '@sdkwork/react-i18n';
import {
    HardDrive, Plus, Trash2, Edit2, AlertCircle, CheckCircle2,
    Wifi, Key, Server
} from 'lucide-react';
import { DEFAULT_MAGICSTUDIO_ROOT_DIR } from '../constants';
import { SettingsSection, SettingInput, SettingPathInput, SettingSelect, SettingToggle } from './SettingsWidgets';
import { STORAGE_PROVIDERS } from '../data/storageProviders';
;
;
;
;

const StorageSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const storageList = Object.values(settings.storage || {}) as StorageConfig[];
    const materialStorage = settings.materialStorage;

    type MaterialStorageUpdate = {
        mode?: MaterialStorageConfig['mode'];
        desktop?: Partial<MaterialStorageConfig['desktop']>;
        sync?: Partial<MaterialStorageConfig['sync']>;
        naming?: Partial<MaterialStorageConfig['naming']>;
    };

    const updateMaterialStorage = async (updates: MaterialStorageUpdate) => {
        const nextMaterialStorage: MaterialStorageConfig = {
            ...materialStorage,
            ...updates,
            desktop: {
                ...materialStorage.desktop,
                ...updates.desktop
            },
            sync: {
                ...materialStorage.sync,
                ...updates.sync
            },
            naming: {
                ...materialStorage.naming,
                ...updates.naming
            }
        };

        await updateSettings({
            ...settings,
            materialStorage: nextMaterialStorage
        });
    };

    const updateMaterialStoragePath = async (
        key: keyof MaterialStorageConfig['desktop'],
        value: string
    ) => {
        const normalizedValue = value.trim();
        const desktopUpdate: Partial<MaterialStorageConfig['desktop']> = {
            [key]:
                key === 'rootDir'
                    ? normalizedValue || DEFAULT_MAGICSTUDIO_ROOT_DIR
                    : normalizedValue || undefined
        };
        await updateMaterialStorage({
            desktop: desktopUpdate
        });
    };

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
                const provider = new ServerProvider(config as any);
                success = await provider.testConnection();
            } else {
                const provider = new S3Provider(config as any);
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
                     <h2 className="flex items-center gap-3 text-2xl font-bold text-[var(--text-primary)]">
                        <HardDrive size={28} className="text-primary-500" />
                        {t('settings.storage.title')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                        {t('settings.storage.subtitle')}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-panel-strong)] shadow-md transition-all hover:bg-primary-600 hover:text-white hover:shadow-lg"
                >
                    <Plus size={16} /> {t('common.actions.add')}
                </button>
            </div>

            <div className="app-floating-panel mb-8 rounded-[1.75rem] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--theme-primary-500)_10%,var(--bg-panel-strong))_0%,var(--bg-panel-strong)_58%,color-mix(in_srgb,var(--bg-panel-subtle)_72%,transparent)_100%)] p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        {t('settings.storage.material.title')}
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">
                        {t('settings.storage.material.subtitle')}
                    </p>
                </div>

                <SettingsSection title={t('settings.storage.material.mode.label')}>
                    <SettingSelect
                        label={t('settings.storage.material.mode.label')}
                        description={t('settings.storage.material.mode.desc')}
                        value={materialStorage.mode}
                        onChange={(value) =>
                            updateMaterialStorage({
                                mode: value as MaterialStorageConfig['mode']
                            })
                        }
                        options={[
                            {
                                label: t('settings.storage.material.mode.options.localFirstSync'),
                                value: 'local-first-sync'
                            },
                            {
                                label: t('settings.storage.material.mode.options.localOnly'),
                                value: 'local-only'
                            },
                            {
                                label: t('settings.storage.material.mode.options.serverOnly'),
                                value: 'server-only'
                            }
                        ]}
                        fullWidth
                    />
                </SettingsSection>

                <SettingsSection title={t('settings.storage.material.desktop.title')}>
                    <SettingPathInput
                        label={t('settings.storage.material.desktop.rootDir')}
                        description={t('settings.storage.material.desktop.rootDirDesc')}
                        value={materialStorage.desktop.rootDir}
                        onChange={(value) => updateMaterialStoragePath('rootDir', value)}
                        type="folder"
                        placeholder={DEFAULT_MAGICSTUDIO_ROOT_DIR}
                    />
                    <SettingPathInput
                        label={t('settings.storage.material.desktop.workspacesRootDir')}
                        description={t('settings.storage.material.desktop.workspacesRootDirDesc')}
                        value={materialStorage.desktop.workspacesRootDir || ''}
                        onChange={(value) => updateMaterialStoragePath('workspacesRootDir', value)}
                        type="folder"
                        placeholder={`${DEFAULT_MAGICSTUDIO_ROOT_DIR}/workspaces`}
                    />
                    <SettingPathInput
                        label={t('settings.storage.material.desktop.cacheRootDir')}
                        description={t('settings.storage.material.desktop.cacheRootDirDesc')}
                        value={materialStorage.desktop.cacheRootDir || ''}
                        onChange={(value) => updateMaterialStoragePath('cacheRootDir', value)}
                        type="folder"
                        placeholder={`${DEFAULT_MAGICSTUDIO_ROOT_DIR}/cache-root`}
                    />
                    <SettingPathInput
                        label={t('settings.storage.material.desktop.exportsRootDir')}
                        description={t('settings.storage.material.desktop.exportsRootDirDesc')}
                        value={materialStorage.desktop.exportsRootDir || ''}
                        onChange={(value) => updateMaterialStoragePath('exportsRootDir', value)}
                        type="folder"
                        placeholder={`${DEFAULT_MAGICSTUDIO_ROOT_DIR}/exports-root`}
                    />
                </SettingsSection>

                <SettingsSection title={t('settings.storage.material.behavior.title')}>
                    <SettingToggle
                        label={t('settings.storage.material.behavior.syncEnabled')}
                        description={t('settings.storage.material.behavior.syncEnabledDesc')}
                        checked={materialStorage.sync.enabled}
                        onChange={(checked) =>
                            updateMaterialStorage({
                                sync: {
                                    enabled: checked
                                }
                            })
                        }
                    />
                    <SettingToggle
                        label={t('settings.storage.material.behavior.autoUploadOnImport')}
                        description={t('settings.storage.material.behavior.autoUploadOnImportDesc')}
                        checked={materialStorage.sync.autoUploadOnImport}
                        onChange={(checked) =>
                            updateMaterialStorage({
                                sync: {
                                    autoUploadOnImport: checked
                                }
                            })
                        }
                    />
                    <SettingToggle
                        label={t('settings.storage.material.behavior.keepOriginalFilename')}
                        description={t('settings.storage.material.behavior.keepOriginalFilenameDesc')}
                        checked={materialStorage.naming.keepOriginalFilenameInMetadata}
                        onChange={(checked) =>
                            updateMaterialStorage({
                                naming: {
                                    keepOriginalFilenameInMetadata: checked
                                }
                            })
                        }
                    />
                </SettingsSection>
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* List Column */}
                <div className="lg:col-span-4 space-y-3">
                    {storageList.length === 0 ? (
                         <div className="app-surface-subtle flex flex-col items-center justify-center rounded-3xl border-dashed py-16 text-[var(--text-muted)]">
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
                                        group relative flex cursor-pointer flex-col rounded-[1.5rem] p-4 transition-all duration-200
                                        ${editingId === item.id
                                            ? 'app-surface-strong border-primary-500/40 bg-[color-mix(in_srgb,var(--theme-primary-500)_8%,var(--bg-panel-strong))] shadow-sm'
                                            : 'app-surface-strong hover:border-[var(--border-strong)] hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="app-surface-subtle rounded-xl p-2 text-[var(--text-muted)]">
                                                {def?.icon || <HardDrive size={18} />}
                                            </div>
                                            <div>
                                                <h3 className={`text-sm font-semibold ${editingId === item.id ? 'text-primary-500' : 'text-[var(--text-primary)]'}`}>
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] uppercase text-[var(--text-muted)]">{item.provider}</span>
                                                    <span className="app-status-pill text-[9px] normal-case tracking-normal" data-tone={item.mode === 'server' ? 'primary' : 'neutral'}>
                                                        {item.mode === 'server' ? 'PROXY' : 'DIRECT'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {item.isDefault && (
                                                <span className="app-status-pill" data-tone="primary">
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
                        <div className="app-floating-panel sticky top-6 animate-in fade-in slide-in-from-bottom-4 rounded-[1.75rem] p-6 duration-300">
                             <div className="mb-6 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
                                        <Edit2 size={16} className="text-primary-500" />
                                        {t('settings.storage.configuration')}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">ID: <span className="font-mono text-[10px]">{editingId}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <SettingToggle
                                        checked={selectedStorage.isDefault}
                                        onChange={(v) => updateStorage(selectedStorage.id, { isDefault: v, enabled: true })}
                                        label={t('settings.storage.is_default')}
                                    />
                                    <button
                                        onClick={() => handleDelete(selectedStorage.id)}
                                        className="app-button-danger rounded-xl p-2"
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
                             <div className="app-segmented-control mb-6 flex">
                                 <button
                                    onClick={() => updateStorage(selectedStorage.id, { mode: 'client' })}
                                    className="app-segmented-item flex flex-1 items-center justify-center gap-2 rounded-xl py-1.5 text-xs font-medium"
                                    data-active={selectedStorage.mode === 'client'}
                                 >
                                     <Key size={14} /> Client Direct (AK/SK)
                                 </button>
                                 <button
                                    onClick={() => updateStorage(selectedStorage.id, { mode: 'server' })}
                                    className="app-segmented-item flex flex-1 items-center justify-center gap-2 rounded-xl py-1.5 text-xs font-medium"
                                    data-active={selectedStorage.mode === 'server'}
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
                             <div className="app-surface-subtle mt-6 rounded-2xl p-4">
                                 <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <Wifi size={16} className="text-[var(--text-muted)]" />
                                         <span className="text-sm font-medium text-[var(--text-secondary)]">Connection Status</span>
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
                                     <div className="app-banner mt-3 text-xs" data-tone={testResult.success ? 'success' : 'danger'}>
                                         {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                         {testResult.message}
                                     </div>
                                 )}
                             </div>
                        </div>
                    ) : (
                        <div className="app-surface-subtle flex h-[400px] flex-col items-center justify-center rounded-3xl border-dashed text-[var(--text-muted)]">
                             <div className="app-surface-strong mb-4 flex h-16 w-16 items-center justify-center rounded-full">
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
export { StorageSettings };
