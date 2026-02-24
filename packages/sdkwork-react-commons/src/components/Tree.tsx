import React from 'react';
import { ChevronRight, Folder, FolderOpen, File } from 'lucide-react';

export interface TreeItem {
    id: string;
    label: string;
    type?: 'file' | 'folder';
    children?: TreeItem[];
    expanded?: boolean;
    selected?: boolean;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    onClick?: (item: TreeItem) => void;
}

export interface TreeProps {
    items: TreeItem[];
    className?: string;
    depth?: number;
}

export const Tree: React.FC<TreeProps> = ({ items, className = '', depth = 0 }) => {
    return (
        <div className={className} style={{ paddingLeft: depth * 16 }}>
            {items.map((item) => (
                <TreeNode key={item.id} item={item} depth={depth} />
            ))}
        </div>
    );
};

const TreeNode: React.FC<{ item: TreeItem; depth: number }> = ({ item, depth }) => {
    const [expanded, setExpanded] = React.useState(item.expanded ?? false);
    const isFolder = item.type === 'folder' || (item.children && item.children.length > 0);

    const handleClick = () => {
        if (isFolder) {
            setExpanded(!expanded);
        }
        item.onClick?.(item);
    };

    const Icon = item.icon || (isFolder ? (expanded ? FolderOpen : Folder) : File);

    return (
        <div>
            <div
                onClick={handleClick}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    item.selected ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                style={{ paddingLeft: 8 + depth * 16 }}
            >
                {isFolder && (
                    <ChevronRight
                        size={12}
                        className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                )}
                <Icon size={14} className={item.selected ? 'text-white' : 'text-gray-500'} />
                <span className="text-sm truncate">{item.label}</span>
            </div>
            {isFolder && expanded && item.children && (
                <Tree items={item.children} depth={depth + 1} />
            )}
        </div>
    );
};

export const TreeItemComponent = Tree;
