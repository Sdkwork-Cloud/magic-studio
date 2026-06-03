import React from 'react';

interface VoicePanelLabelProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export const VoicePanelLabel: React.FC<VoicePanelLabelProps> = ({
    children,
    icon,
    className
}) => (
    <label className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 ${className || ''}`}>
        {icon}
        {children}
    </label>
);
