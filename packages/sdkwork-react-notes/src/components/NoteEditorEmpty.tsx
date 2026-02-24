
import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { useTranslation } from 'sdkwork-react-i18n';
import { useNoteStore } from '../store/noteStore';

export const NoteEditorEmpty: React.FC = () => {
    const { createNote } = useNoteStore();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-in fade-in duration-300 select-none bg-[#050505]">
            <div className="w-24 h-24 bg-[#18181b] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#27272a]">
                <FileText size={48} className="opacity-20" />
            </div>
            <h3 className="text-xl font-medium text-gray-400">{t('notes.no_note_selected')}</h3>
            <p className="text-sm opacity-60 mt-2 max-w-xs text-center leading-relaxed">
                {t('notes.select_or_create')}
            </p>
            <div className="mt-8 flex gap-3">
                <button 
                    onClick={() => createNote('Untitled Note', 'doc')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> {t('notes.sidebar.actions.new_page')}
                </button>
            </div>
        </div>
    );
};
