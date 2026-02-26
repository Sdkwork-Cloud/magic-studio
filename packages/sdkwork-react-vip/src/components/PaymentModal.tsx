import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, CheckCircle2, Loader2, Shield, Zap, RefreshCw, Crown, Sparkles, Smartphone, QrCode } from 'lucide-react';

type PaymentMethod = 'wechat' | 'alipay';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    price: number;
    currency: string;
    billingCycle: string;
}

interface PaymentStatus {
    status: 'pending' | 'scanning' | 'success' | 'expired';
    message: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    planName,
    price,
    currency,
    billingCycle,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
        status: 'pending',
        message: '等待扫码支付...',
    });
    const [countdown, setCountdown] = useState(300);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                `payment:${selectedMethod}:plan:${planName}:price:${price}:${Date.now()}`
            )}`;
            setQrCodeUrl(mockQrCode);
            setPaymentStatus({ status: 'pending', message: '等待扫码支付...' });
            setCountdown(300);
        }
    }, [isOpen, selectedMethod, planName, price]);

    useEffect(() => {
        if (!isOpen || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setPaymentStatus({ status: 'expired', message: '二维码已过期' });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, countdown]);

    useEffect(() => {
        if (!isOpen || paymentStatus.status !== 'pending') return;

        const checkPayment = setInterval(() => {
            if (Math.random() < 0.01) {
                setPaymentStatus({ status: 'success', message: '支付成功！' });
            }
        }, 2000);

        return () => clearInterval(checkPayment);
    }, [isOpen, paymentStatus.status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRefreshQrCode = () => {
        setCountdown(300);
        setPaymentStatus({ status: 'pending', message: '等待扫码支付...' });
        const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
            `payment:${selectedMethod}:plan:${planName}:price:${price}:${Date.now()}`
        )}`;
        setQrCodeUrl(mockQrCode);
    };

    const getPlanIcon = () => {
        if (planName.includes('高级')) return <Crown className="w-8 h-8 text-yellow-500" />;
        if (planName.includes('标准')) return <Sparkles className="w-8 h-8 text-cyan-400" />;
        return <Zap className="w-8 h-8 text-blue-400" />;
    };

    const getPlanColor = () => {
        if (planName.includes('高级')) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
        if (planName.includes('标准')) return 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30';
        return 'from-blue-500/20 to-indigo-500/20 border-blue-500/30';
    };

    const getMethodColor = (method: PaymentMethod) => {
        if (method === 'wechat') return '#07c160';
        return '#1677ff';
    };

    const getMethodName = (method: PaymentMethod) => {
        if (method === 'wechat') return '微信';
        return '支付宝';
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-[800px] bg-[#0d0d0d] rounded-2xl border border-[#333] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#111]">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-500" />
                        <span className="text-white font-medium">安全收银台</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex">
                    {/* Left Side - Product Info */}
                    <div className="w-[380px] p-6 border-r border-[#222] bg-gradient-to-b from-[#111] to-[#0a0a0a]">
                        {/* Plan Card */}
                        <div className={`p-5 rounded-xl border bg-gradient-to-br ${getPlanColor()} mb-6`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center">
                                    {getPlanIcon()}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{planName}</h3>
                                    <p className="text-gray-400 text-sm">{billingCycle}付会员</p>
                                </div>
                            </div>
                            
                            <div className="flex items-baseline gap-1">
                                <span className="text-gray-400 text-lg">{currency === 'CNY' ? '¥' : '$'}</span>
                                <span className="text-4xl font-bold text-white">{price}</span>
                                <span className="text-gray-500 text-sm ml-1">/{billingCycle}</span>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="space-y-4 mb-6">
                            <h4 className="text-gray-300 font-medium text-sm uppercase tracking-wider">订单详情</h4>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-[#222]">
                                    <span className="text-gray-500 text-sm">商品名称</span>
                                    <span className="text-gray-300 text-sm">{planName}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-[#222]">
                                    <span className="text-gray-500 text-sm">计费周期</span>
                                    <span className="text-gray-300 text-sm">{billingCycle}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-[#222]">
                                    <span className="text-gray-500 text-sm">会员权益</span>
                                    <span className="text-gray-300 text-sm">立即生效</span>
                                </div>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t border-[#333]">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">实付金额</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-gray-400">{currency === 'CNY' ? '¥' : '$'}</span>
                                    <span className="text-3xl font-bold text-white">{price}</span>
                                </div>
                            </div>
                        </div>

                        {/* Security Badges */}
                        <div className="mt-6 pt-4 border-t border-[#222]">
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Shield size={12} className="text-green-500" />
                                    SSL加密
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-green-500" />
                                    官方支付
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Zap size={12} className="text-yellow-500" />
                                    即时到账
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Payment */}
                    <div className="flex-1 p-6 bg-[#0a0a0a] flex flex-col">
                        {/* QR Code Area - Main Content */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {/* Current Payment Method Badge */}
                            <div 
                                className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                                style={{ 
                                    backgroundColor: `${getMethodColor(selectedMethod)}15`,
                                    border: `1px solid ${getMethodColor(selectedMethod)}30`
                                }}
                            >
                                {selectedMethod === 'wechat' ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={getMethodColor('wechat')}>
                                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={getMethodColor('alipay')}>
                                        <path d="M5.5 2h13A2.5 2.5 0 0 1 21 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-15A2.5 2.5 0 0 1 5.5 2z" />
                                    </svg>
                                )}
                                <span 
                                    className="text-sm font-medium"
                                    style={{ color: getMethodColor(selectedMethod) }}
                                >
                                    {getMethodName(selectedMethod)}支付
                                </span>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-center gap-2 mb-4 text-sm">
                                <Clock size={14} className={countdown < 60 ? 'text-red-400' : 'text-gray-500'} />
                                <span className={countdown < 60 ? 'text-red-400' : 'text-gray-400'}>
                                    支付剩余时间：{formatTime(countdown)}
                                </span>
                            </div>

                            {/* QR Code */}
                            <div className="relative mb-6">
                                <div className="p-5 bg-white rounded-2xl shadow-xl">
                                    {paymentStatus.status === 'success' ? (
                                        <div className="w-[200px] h-[200px] flex flex-col items-center justify-center bg-green-50 rounded-xl">
                                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                                <CheckCircle2 size={32} className="text-green-500" />
                                            </div>
                                            <span className="text-green-600 font-semibold">支付成功</span>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={qrCodeUrl}
                                                alt="支付二维码"
                                                className={`w-[200px] h-[200px] rounded-lg ${
                                                    paymentStatus.status === 'expired' ? 'opacity-30' : ''
                                                }`}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Expired Overlay */}
                                {paymentStatus.status === 'expired' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={handleRefreshQrCode}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff2449] text-white rounded-xl font-medium hover:bg-[#e02040] transition-all shadow-lg"
                                        >
                                            <RefreshCw size={16} />
                                            刷新二维码
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Scan Hint */}
                            <div className="text-center mb-2">
                                {paymentStatus.status === 'success' ? (
                                    <div className="space-y-2">
                                        <p className="text-green-400 font-medium">感谢您的购买！</p>
                                        <p className="text-gray-500 text-sm">会员权益已生效，正在跳转...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center gap-2 text-gray-300">
                                            <QrCode size={16} className="text-gray-500" />
                                            <span className="text-sm">请使用{getMethodName(selectedMethod)}扫一扫</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            {paymentStatus.status === 'pending' && (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-gray-500" />
                                                    <span className="text-gray-500 text-sm">{paymentStatus.message}</span>
                                                </>
                                            )}
                                            {paymentStatus.status === 'expired' && (
                                                <span className="text-red-400 text-sm">{paymentStatus.message}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Switch - Bottom */}
                        <div className="pt-4 border-t border-[#222]">
                            <p className="text-gray-500 text-xs text-center mb-3">切换支付方式</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedMethod('wechat')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                                        selectedMethod === 'wechat'
                                            ? 'border-[#07c160] bg-[#07c160]/10'
                                            : 'border-[#2a2a2a] bg-[#151515] hover:border-[#333]'
                                    }`}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill={selectedMethod === 'wechat' ? '#07c160' : '#666'}
                                    >
                                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
                                    </svg>
                                    <span
                                        className={`font-medium text-sm ${
                                            selectedMethod === 'wechat' ? 'text-[#07c160]' : 'text-gray-400'
                                        }`}
                                    >
                                        微信支付
                                    </span>
                                </button>
                                <button
                                    onClick={() => setSelectedMethod('alipay')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                                        selectedMethod === 'alipay'
                                            ? 'border-[#1677ff] bg-[#1677ff]/10'
                                            : 'border-[#2a2a2a] bg-[#151515] hover:border-[#333]'
                                    }`}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill={selectedMethod === 'alipay' ? '#1677ff' : '#666'}
                                    >
                                        <path d="M5.5 2h13A2.5 2.5 0 0 1 21 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-15A2.5 2.5 0 0 1 5.5 2zm0 1A1.5 1.5 0 0 0 4 4.5v15A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 18.5 3h-13z" />
                                        <path d="M7 8h10v1H7zm0 3h10v1H7zm0 3h7v1H7z" />
                                    </svg>
                                    <span
                                        className={`font-medium text-sm ${
                                            selectedMethod === 'alipay' ? 'text-[#1677ff]' : 'text-gray-400'
                                        }`}
                                    >
                                        支付宝
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
