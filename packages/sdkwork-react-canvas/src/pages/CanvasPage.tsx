
import { useRouter, ROUTES } from '@sdkwork/react-core'
import { CanvasBoard } from '../components/CanvasBoard';
import { CanvasToolbar } from '../components/CanvasToolbar';
import React from 'react';
;
;
import { ChevronLeft } from 'lucide-react';
;
;

const CanvasPage: React.FC = () => {
    const { navigate } = useRouter();

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#111] relative">
            
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={() => navigate(ROUTES.HOME)}
                    className="p-2 bg-[#18181b]/90 hover:bg-[#252526] text-gray-400 hover:text-white rounded-xl backdrop-blur-md border border-[#27272a] shadow-lg transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 min-w-0 bg-[#09090b] relative">
                {/* Left Toolbar */}
                <CanvasToolbar />
                
                {/* The Board handles node-specific inputs now */}
                <CanvasBoard />
            </div>
        </div>
    );
};

export default CanvasPage;
