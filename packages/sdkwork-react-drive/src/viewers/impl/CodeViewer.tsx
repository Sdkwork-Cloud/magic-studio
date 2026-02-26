
import { pathUtils, useTheme } from '@sdkwork/react-commons'
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import { FileViewerProps } from '../types';
import { Save, Loader2, Check } from 'lucide-react';
import { useSettingsStore } from '@sdkwork/react-settings';

export const CodeViewer: React.FC<FileViewerProps> = ({ item, url, onSave, isReadOnly, headerElement }) => {
    const { settings } = useSettingsStore();
    const { isDark } = useTheme();
    
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Fetch text content from the blob URL
    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(url);
                const text = await response.text();
                setContent(text);
            } catch (e) {
                console.error("Failed to load text content", e);
                setContent("// Error loading file content");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [url]);

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            await onSave(content);
            setIsDirty(false);
        } catch (e) {
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const getLanguage = (filename: string) => {
        const ext = pathUtils.extname(filename).toLowerCase();
        const map: Record<string, string> = {
            '.ts': 'typescript', '.tsx': 'typescript',
            '.js': 'javascript', '.jsx': 'javascript',
            '.json': 'json', '.html': 'html', '.css': 'css',
            '.md': 'markdown', '.py': 'python', '.rs': 'rust'
        };
        return map[ext] || 'plaintext';
    };

    const editorOptions = {
        readOnly: isReadOnly,
        minimap: { enabled: false }, // Minimal UI for preview
        fontSize: settings.editor.fontSize,
        fontFamily: settings.editor.fontFamily,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16 }
    };

    return (
        <>
            {/* 1. Portal Actions to Modal Header */}
            {headerElement && createPortal(
                <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 text-xs">
                         {isDirty ? (
                             <span className="text-yellow-500 font-medium">Modified</span>
                         ) : (
                             <span className="text-gray-500">Synced</span>
                         )}
                    </div>

                    {/* Save Button */}
                    {onSave && !isReadOnly && (
                        <button 
                            onClick={handleSave} 
                            disabled={!isDirty || isSaving}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                ${isDirty 
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                    : 'bg-[#333] text-gray-500 cursor-not-allowed'
                                }
                            `}
                        >
                            {isSaving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Save size={14} />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                    )}
                </div>,
                headerElement
            )}

            {/* 2. Main Editor Content */}
            <div className="flex flex-col h-full w-full bg-[#1e1e1e] relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-500" />
                    </div>
                ) : (
                    <Editor
                        height="100%"
                        language={getLanguage(item.name)}
                        value={content}
                        theme={isDark ? 'vs-dark' : 'light'}
                        onChange={(val) => {
                            setContent(val || '');
                            setIsDirty(true);
                        }}
                        options={editorOptions as any}
                    />
                )}
            </div>
        </>
    );
};
