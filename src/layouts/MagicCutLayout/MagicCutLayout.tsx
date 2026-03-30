
import React from 'react';
import { MagicCutLayoutHeader } from './MagicCutLayoutHeader';

export interface MagicCutLayoutProps {
    children: React.ReactNode;
    leftPane?: React.ComponentType<any>;
}

export const MagicCutLayout: React.FC<MagicCutLayoutProps> = ({ children, leftPane: LeftPane }) => {
    return (
        <div className="flex flex-col w-full h-full bg-[#020202] overflow-hidden text-gray-200 font-sans relative">

            {/* Ambient Background Effects (Matches Portal) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1033]/20 via-[#0a0a0a]/50 to-[#020202]" />
                <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-900/5 blur-[150px] rounded-full mix-blend-screen" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
                />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <MagicCutLayoutHeader />
                <div className="flex-1 overflow-hidden relative flex">
                    {LeftPane && (
                        <div className="w-80 border-r border-white/10 overflow-hidden">
                            <LeftPane />
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
