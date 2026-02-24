// NotificationCenter has been moved to sdkwork-react-notifications to avoid circular dependencies
// Please import from 'sdkwork-react-notifications' instead
// This file is kept for backward compatibility but will be removed in future versions

import React from 'react';

interface NotificationCenterProps {
    onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = () => {
    console.warn('NotificationCenter from sdkwork-react-commons is deprecated. Please use sdkwork-react-notifications instead.');
    return null;
};

export default NotificationCenter;
