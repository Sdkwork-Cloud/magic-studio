// NotificationCenter has been moved to @sdkwork/magic-studio-notifications to avoid circular dependencies
// Please import from '@sdkwork/magic-studio-notifications' instead
// This file is kept for backward compatibility but will be removed in future versions

import React from 'react';

interface NotificationCenterProps {
    onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = () => {
    console.warn('NotificationCenter from @sdkwork/magic-studio-commons is deprecated. Please use @sdkwork/magic-studio-notifications instead.');
    return null;
};

export default NotificationCenter;
