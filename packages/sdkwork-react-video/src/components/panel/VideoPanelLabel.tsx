import React from 'react';

interface VideoPanelLabelProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

export const VideoPanelLabel: React.FC<VideoPanelLabelProps> = ({ children, icon, className }) => (
    <label className={`text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 ${className || ''}`}>
        {icon}
        {children}
    </label>
);
