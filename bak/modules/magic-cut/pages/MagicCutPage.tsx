
import React, { useEffect, useState, useRef } from 'react';
import { MagicCutEditorContent } from '../components/MagicCutEditor';
import { useRouter } from '../../../router';
import { useMagicCutStore } from '../store/magicCutStore';

const MagicCutPageContent: React.FC = () => {
    const { switchProject, loadLastProject } = useMagicCutStore();
    const { currentQuery } = useRouter();
    
    // Derived state from URL
    const searchParams = new URLSearchParams(currentQuery);
    const projectId = searchParams.get('projectId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // CRITICAL FIX: Track the ID of the last loaded project.
    // If the URL changes (e.g. export new project), this mismatch triggers a reload.
    // Initialized to a special token '__INIT__' to ensure first load always runs.
    const lastLoadedIdRef = useRef<string | null | undefined>('__INIT__');

    useEffect(() => {
        // 1. Prevent double-firing in StrictMode if ID hasn't changed
        if (lastLoadedIdRef.current === projectId) {
            return;
        }

        // 2. Update Ref immediately to lock this load cycle
        lastLoadedIdRef.current = projectId;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                if (projectId) {
                    // Specific Project Load (e.g. from Canvas Export)
                    // Small artificial delay ensures Store has cleared previous state completely if needed
                    await new Promise(r => setTimeout(r, 50)); 
                    await switchProject(projectId);
                } else {
                    // Default Load (Last Project or Empty)
                    await loadLastProject();
                }
            } catch (e: any) {
                console.error("Failed to load project", e);
                setError(e.message || "Failed to load project");
                // Reset ref on error so user can retry
                lastLoadedIdRef.current = '__ERROR__';
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [projectId, switchProject, loadLastProject]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#020202] text-gray-500 gap-4">
                 <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-xs font-medium animate-pulse">Loading Project...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#020202] text-red-500 gap-2">
                 <span className="text-lg font-bold">Error</span>
                 <span className="text-sm">{error}</span>
                 <div className="flex gap-4 mt-4">
                     <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#222] hover:bg-[#333] rounded text-white text-xs">
                         Reload Page
                     </button>
                     <button onClick={() => { lastLoadedIdRef.current = '__RETRY__'; setLoading(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs">
                         Retry Load
                     </button>
                 </div>
            </div>
        );
    }

    return <MagicCutEditorContent minimal={true} />;
};

const MagicCutPage: React.FC = () => {
    // The Route Registry wraps this in MagicCutStoreProvider via 'provider' prop.
    return <MagicCutPageContent />;
};

export default MagicCutPage;
