
import { StorageProviderType } from '../entities'
import React from 'react';
import { Cloud, Server, Box, Flame } from 'lucide-react';

export interface StorageProviderDefinition {
    id: StorageProviderType;
    name: string;
    icon: React.ReactNode;
    defaultEndpoint?: string;
    regions?: string[];
    needsRegion: boolean;
    needsEndpoint: boolean;
}

// Icons
const AwsIcon = () => (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" className="text-[#FF9900]">
         <path d="M18.66 16.545c-.895 1.706-2.613 2.924-4.57 3.297l-.234.037h-3.712l-.234-.037c-1.957-.373-3.675-1.591-4.57-3.297L4.5 15l.386 2.378c.875 3.398 3.794 5.922 7.114 5.922 3.32 0 6.24-2.524 7.114-5.922L19.5 15l-.84 1.545zM12 0L6.41 3.518l.84 5.176c.454-1.22 1.353-2.22 2.502-2.825l.233-.112 1.83-3.483.185-1.139L12 0zm0 18.066c2.42 0 4.41-1.666 4.908-3.968l.056-.309-2.128-3.666-.307-1.89-2.529 1.591-2.529-1.59-2.128 3.666-.307 1.89-2.128 3.666.056.309c.498 2.302 2.488 3.968 4.908 3.968z"/>
    </svg>
);

const AliyunIcon = () => (
    <div className="text-[#FF6A00] font-bold text-[10px] w-full h-full flex items-center justify-center">ALI</div>
);

const TencentIcon = () => (
    <div className="text-[#0052D9] font-bold text-[10px] w-full h-full flex items-center justify-center">COS</div>
);

const GoogleIcon = () => (
    <div className="text-[#4285F4] font-bold text-[10px] w-full h-full flex items-center justify-center">GCS</div>
);

export const STORAGE_PROVIDERS: StorageProviderDefinition[] = [
    {
        id: 'aws',
        name: 'Amazon S3',
        icon: <AwsIcon />,
        needsRegion: true,
        needsEndpoint: false,
        regions: ['us-east-1', 'us-west-1', 'us-west-2', 'eu-central-1', 'ap-northeast-1']
    },
    {
        id: 'aliyun',
        name: 'Alibaba Cloud OSS',
        icon: <AliyunIcon />,
        defaultEndpoint: 'oss-cn-hangzhou.aliyuncs.com',
        needsRegion: true,
        needsEndpoint: true,
        regions: ['cn-hangzhou', 'cn-shanghai', 'cn-beijing', 'cn-shenzhen', 'us-west-1']
    },
    {
        id: 'tencent',
        name: 'Tencent Cloud COS',
        icon: <TencentIcon />,
        defaultEndpoint: 'cos.ap-guangzhou.myqcloud.com',
        needsRegion: true,
        needsEndpoint: true
    },
    {
        id: 'volcengine',
        name: 'Volcano Engine TOS',
        icon: <Flame size={24} className="text-orange-500" />,
        defaultEndpoint: 'tos-cn-beijing.volces.com',
        needsRegion: true,
        needsEndpoint: true
    },
    {
        id: 'google',
        name: 'Google Cloud Storage',
        icon: <GoogleIcon />,
        defaultEndpoint: 'storage.googleapis.com',
        needsRegion: true,
        needsEndpoint: true
    },
    {
        id: 'azure',
        name: 'Azure Blob (S3)',
        icon: <Cloud size={24} className="text-[#0078D4]" />,
        needsRegion: true,
        needsEndpoint: true
    },
    {
        id: 'minio',
        name: 'MinIO',
        icon: <Server size={24} className="text-primary-500" />,
        needsRegion: false,
        needsEndpoint: true
    },
    {
        id: 'custom',
        name: 'Custom S3',
        icon: <Box size={24} className="text-[var(--text-muted)]" />,
        needsRegion: false,
        needsEndpoint: true
    }
];
