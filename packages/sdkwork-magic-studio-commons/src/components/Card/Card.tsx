import React from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, hoverable }) => {
    return (
        <div 
            className={cn(
                'rounded-lg border bg-card text-card-foreground shadow-sm',
                hoverable && 'transition-shadow hover:shadow-md cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
