import { createOfflineQrCode } from '@sdkwork/react-core';

export const AUTH_GRAIN_TEXTURE_URL = '/visual-textures/grain-noise.svg';
export const AUTH_LOGIN_QR_CODE = createOfflineQrCode({
    label: 'Magic Studio Login',
    accent: '#22c55e',
});
