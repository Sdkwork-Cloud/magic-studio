import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@sdkwork/react-i18n';
import { RefreshCw, MessageCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { authBusinessService } from '../services';

interface QrCodeLoginProps {
    onLoginSuccess?: () => void;
    size?: 'md' | 'lg';
}

type QrStatus = 'loading' | 'pending' | 'scanned' | 'confirmed' | 'expired' | 'error';

// Generate QR code data URL from content using canvas
const generateQrDataUrl = (content: string, size: number = 200): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = size;
    canvas.height = size;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Generate a simple pattern based on content
    // In production, you would use a proper QR code library like qrcode.js
    ctx.fillStyle = '#000000';
    const cellSize = 10;
    const cells = Math.floor(size / cellSize);
    
    // Simple hash-based pattern for demo
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash = hash & hash;
    }

    for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
            const pseudoRandom = Math.abs(Math.sin(hash + i * cells + j));
            if (pseudoRandom > 0.5) {
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }

    // Draw position detection patterns (corners)
    const drawPositionPattern = (x: number, y: number) => {
        ctx.fillRect(x, y, 70, 70);
        ctx.clearRect(x + 10, y + 10, 50, 50);
        ctx.fillRect(x + 20, y + 20, 30, 30);
    };

    drawPositionPattern(10, 10);
    drawPositionPattern(size - 80, 10);
    drawPositionPattern(10, size - 80);

    return canvas.toDataURL('image/png');
};

export const QrCodeLogin: React.FC<QrCodeLoginProps> = ({ onLoginSuccess, size = 'md' }) => {
    const { t } = useTranslation();
    const [qrUrl, setQrUrl] = useState<string>('');
    const [qrContent, setQrContent] = useState<string>('');
    const [qrKey, setQrKey] = useState<string>('');
    const [status, setStatus] = useState<QrStatus>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [countdown, setCountdown] = useState<number>(300); // 5 minutes

    const qrSize = size === 'lg' ? 208 : 176;
    const qrContainerClass = size === 'lg' ? 'w-52 h-52' : 'w-44 h-44';

    const generateQrCode = useCallback(async () => {
        setStatus('loading');
        setErrorMessage('');
        setCountdown(300);
        
        const result = await authBusinessService.generateQrCode();
        if (result.success && result.data) {
            const { qrUrl: url, qrContent: content, qrKey: key } = result.data;
            
            // Determine how to render the QR code
            if (url) {
                // Server provided image URL
                setQrUrl(url);
                setQrContent('');
            } else if (content) {
                // Server provided content, render locally
                const dataUrl = generateQrDataUrl(content, qrSize);
                setQrUrl(dataUrl);
                setQrContent(content);
            } else {
                setStatus('error');
                setErrorMessage(t('auth.error.invalid_qr_data'));
                return;
            }
            
            setQrKey(key);
            setStatus('pending');
        } else {
            setStatus('error');
            setErrorMessage(result.message || t('auth.error.generate_qr_failed'));
        }
    }, [qrSize, t]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);

    // Poll QR code status
    useEffect(() => {
        if (!qrKey || status === 'confirmed' || status === 'expired' || status === 'error') {
            return;
        }

        const pollInterval = setInterval(async () => {
            const result = await authBusinessService.checkQrCodeStatus(qrKey);
            if (result.success && result.data) {
                const response = result.data;
                
                switch (response.status) {
                    case 'scanned':
                        setStatus('scanned');
                        break;
                    case 'confirmed':
                        setStatus('confirmed');
                        if (onLoginSuccess) {
                            onLoginSuccess();
                        }
                        break;
                    case 'expired':
                        setStatus('expired');
                        break;
                }
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [qrKey, status, onLoginSuccess]);

    // Countdown timer
    useEffect(() => {
        if (status !== 'pending' && status !== 'scanned') {
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'scanned':
                return <CheckCircle2 size={20} className="text-blue-400" />;
            case 'expired':
                return <AlertCircle size={20} className="text-red-400" />;
            default:
                return <Clock size={16} className="text-gray-400" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'loading':
                return t('auth.qr.loading');
            case 'pending':
                return t('auth.qr.pending');
            case 'scanned':
                return t('auth.qr.scanned');
            case 'confirmed':
                return t('auth.qr.confirmed');
            case 'expired':
                return t('auth.qr.expired');
            case 'error':
                return errorMessage;
            default:
                return '';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            {/* QR Code Container */}
            <div className="relative mb-4">
                <div className={`
                    ${qrContainerClass} bg-white p-3 rounded-xl shadow-2xl transition-all duration-300
                    ${status === 'expired' || status === 'error' ? 'opacity-50' : ''}
                `}>
                    {qrUrl ? (
                        <img 
                            src={qrUrl} 
                            className="w-full h-full object-contain" 
                            alt={t('auth.page.qr_alt')} 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                            <RefreshCw size={32} className="text-gray-400 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Overlay for expired/error states */}
                {(status === 'expired' || status === 'error') && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={generateQrCode}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={16} />
                            {t('auth.page.refresh_qr')}
                        </button>
                    </div>
                )}

                {/* Scanned indicator */}
                {status === 'scanned' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                        <div className="text-center text-white">
                            <CheckCircle2 size={40} className="mx-auto mb-2 text-green-400" />
                            <p className="text-sm font-medium">{t('auth.qr.scanned')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Info */}
            <div className="flex items-center gap-2 text-sm mb-2">
                {getStatusIcon()}
                <span className={`
                    ${status === 'scanned' ? 'text-blue-400' : ''}
                    ${status === 'expired' ? 'text-red-400' : ''}
                    ${status === 'error' ? 'text-red-400' : ''}
                    ${status === 'pending' ? 'text-gray-400' : ''}
                `}>
                    {getStatusText()}
                </span>
            </div>

            {/* Countdown */}
            {(status === 'pending' || status === 'scanned') && (
                <div className="text-xs text-gray-500">
                    {t('auth.qr.expires_in')} {formatTime(countdown)}
                </div>
            )}

            {/* WeChat Branding */}
            <div className="flex items-center gap-2 mt-4 text-green-400">
                <MessageCircle size={18} />
                <span className="text-sm font-medium">{t('auth.page.scan_wechat')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('auth.page.scan_tip')}</p>
        </div>
    );
};

