
import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
    rightElement?: React.ReactNode;
}

export const AuthInput: React.FC<AuthInputProps> = ({ 
    label, icon, error, rightElement, className = '', type = 'text', ...props 
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    
    // Determine actual input type based on toggle state
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 select-none">
                    {label}
                </label>
            )}
            <div className={`
                relative group transition-all duration-200
                ${error ? 'animate-shake' : ''}
            `}>
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        {icon}
                    </div>
                )}
                
                <input 
                    type={inputType}
                    className={`
                        w-full bg-[#09090b] border rounded-xl py-3 text-sm text-white placeholder-gray-600 transition-all outline-none
                        ${icon ? 'pl-10' : 'pl-4'} 
                        ${rightElement ? 'pr-24' : (isPasswordType ? 'pr-10' : 'pr-4')}
                        ${error 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
                            : 'border-[#27272a] hover:border-[#3f3f46] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                        }
                        ${className}
                    `}
                    {...props}
                />
                
                {/* Render Custom Right Element (like "Get Code" button) */}
                {rightElement && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}

                {/* Render Password Toggle if no custom right element */}
                {!rightElement && isPasswordType && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors focus:outline-none p-1 rounded-md hover:bg-white/10"
                        tabIndex={-1}
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-[10px] text-red-400 ml-1 animate-in slide-in-from-top-1 font-medium">{error}</p>
            )}
        </div>
    );
};
