import React, { useState, useRef, useEffect } from 'react';
import { Gift, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface InviteCodeInputProps {
    value: string;
    onChange: (value: string) => void;
    onValidate?: (isValid: boolean, data?: any) => void;
    error?: string;
    className?: string;
}

interface ValidationState {
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message?: string;
    inviter?: string;
    reward?: string;
}

export const InviteCodeInput: React.FC<InviteCodeInputProps> = ({
    value,
    onChange,
    onValidate,
    error,
    className = '',
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [localValue, setLocalValue] = useState(value.split('').concat(Array(6 - value.length).fill('')));

    // Sync with external value
    useEffect(() => {
        const chars = value.split('').concat(Array(6 - value.length).fill(''));
        setLocalValue(chars);
    }, [value]);

    const handleChange = (index: number, char: string) => {
        const newChar = char.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!newChar) return;

        const newValue = [...localValue];
        newValue[index] = newChar;
        setLocalValue(newValue);

        const codeString = newValue.join('').replace(/\s/g, '');
        onChange(codeString);

        // Auto-focus next input
        if (index < 5 && newChar) {
            inputRefs.current[index + 1]?.focus();
        }

        // Validate when complete
        if (codeString.length === 6) {
            validateCode(codeString);
        } else {
            setValidation({ status: 'idle' });
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newValue = [...localValue];
            
            if (localValue[index]) {
                newValue[index] = '';
                setLocalValue(newValue);
                onChange(newValue.join('').replace(/\s/g, ''));
                setValidation({ status: 'idle' });
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
                newValue[index - 1] = '';
                setLocalValue(newValue);
                onChange(newValue.join('').replace(/\s/g, ''));
                setValidation({ status: 'idle' });
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        
        const newValue = pasted.split('').concat(Array(6 - pasted.length).fill(''));
        setLocalValue(newValue);
        onChange(pasted);

        if (pasted.length === 6) {
            validateCode(pasted);
        }

        // Focus the appropriate input
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const validateCode = async (code: string) => {
        setValidation({ status: 'validating' });
        
        // Simulate API validation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock validation - codes starting with 'VIP' or having specific pattern are valid
        const isValid = code.length === 6 && (code.startsWith('VIP') || /^[A-Z0-9]{6}$/.test(code));
        
        if (isValid) {
            const mockData = {
                inviter: '用户' + Math.floor(Math.random() * 10000),
                reward: '7天高级会�?,
            };
            setValidation({
                status: 'valid',
                message: '邀请码有效',
                inviter: mockData.inviter,
                reward: mockData.reward,
            });
            onValidate?.(true, mockData);
        } else {
            setValidation({
                status: 'invalid',
                message: '邀请码无效或已过期',
            });
            onValidate?.(false);
        }
    };

    const clearCode = () => {
        setLocalValue(['', '', '', '', '', '']);
        onChange('');
        setValidation({ status: 'idle' });
        inputRefs.current[0]?.focus();
    };

    if (!isExpanded) {
        return (
            <div className={className}>
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[#333] bg-[#111]/50 text-gray-400 hover:text-gray-300 hover:border-[#444] hover:bg-[#18181b] transition-all group"
                >
                    <Gift size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm">有邀请码？点击输入领取奖�?/span>
                    <Sparkles size={14} className="text-yellow-500/70" />
                </button>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                    <Gift size={14} className="text-yellow-500" />
                    邀请码
                    {validation.status === 'valid' && (
                        <span className="flex items-center gap-1 text-green-400">
                            <Check size={12} />
                            已验�?                        </span>
                    )}
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setIsExpanded(false);
                        clearCode();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                    跳过
                </button>
            </div>

            {/* Code Input Boxes */}
            <div className="flex items-center gap-2">
                {localValue.map((char, index) => (
                    <React.Fragment key={index}>
                        <input
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            maxLength={1}
                            value={char}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={validation.status === 'validating'}
                            className={`
                                w-12 h-14 text-center text-lg font-bold uppercase rounded-xl border-2 
                                bg-[#111] transition-all duration-200 outline-none
                                ${validation.status === 'valid' 
                                    ? 'border-green-500/50 text-green-400 bg-green-500/10' 
                                    : validation.status === 'invalid'
                                    ? 'border-red-500/50 text-red-400 bg-red-500/10'
                                    : char 
                                        ? 'border-blue-500/50 text-white bg-blue-500/10'
                                        : 'border-[#2a2a2a] text-white focus:border-blue-500/50 focus:bg-blue-500/5'
                                }
                                ${validation.status === 'validating' ? 'animate-pulse' : ''}
                            `}
                        />
                        {index === 2 && (
                            <span className="text-gray-600 font-bold">-</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Validation Status */}
            {validation.status === 'validating' && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span>正在验证邀请码...</span>
                </div>
            )}

            {validation.status === 'valid' && validation.reward && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                        <Check size={16} />
                        <span className="font-medium">邀请码有效</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        邀请人�?span className="text-gray-300">{validation.inviter}</span>
                    </p>
                    <p className="text-xs text-green-400/80 mt-1">
                        注册成功后将获得�?span className="font-medium">{validation.reward}</span>
                    </p>
                </div>
            )}

            {validation.status === 'invalid' && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={14} />
                    <span>{validation.message}</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
