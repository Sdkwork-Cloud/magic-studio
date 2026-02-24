
import React, { useMemo } from 'react';

interface TimelineGridProps {
    totalWidth: number;
    viewportHeight: number;
    pixelsPerSecond: number;
    scrollLeft: number;
}

/**
 * TimelineGrid - 时间轴背景网格
 * 
 * 职责：渲染时间轴背景网格线
 * 优化：使用虚拟化只渲染可见区域的网格线
 */
export const TimelineGrid: React.FC<TimelineGridProps> = ({
    totalWidth,
    viewportHeight,
    pixelsPerSecond,
    scrollLeft
}) => {
    // 计算可见时间范围
    const visibleStartTime = scrollLeft / pixelsPerSecond;
    const visibleEndTime = (scrollLeft + totalWidth) / pixelsPerSecond;

    // 生成网格线配置
    const gridLines = useMemo(() => {
        const lines: Array<{ time: number; isMajor: boolean; label?: string }> = [];
        
        // 主要刻度：每 10 秒
        const majorInterval = 10;
        // 次要刻度：每 1 秒
        const minorInterval = 1;
        
        const startMajor = Math.floor(visibleStartTime / majorInterval) * majorInterval;
        const endMajor = Math.ceil(visibleEndTime / majorInterval) * majorInterval;
        
        for (let t = startMajor; t <= endMajor; t += majorInterval) {
            lines.push({
                time: t,
                isMajor: true,
                label: formatTime(t)
            });
            
            // 添加次要刻度
            for (let st = t + minorInterval; st < t + majorInterval && st <= endMajor; st += minorInterval) {
                if (st >= visibleStartTime && st <= visibleEndTime) {
                    lines.push({
                        time: st,
                        isMajor: false
                    });
                }
            }
        }
        
        return lines;
    }, [visibleStartTime, visibleEndTime]);

    return (
        <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: totalWidth, height: viewportHeight }}
        >
            {gridLines.map((line) => {
                const left = line.time * pixelsPerSecond;
                return (
                    <div
                        key={line.time}
                        className={`absolute top-0 bottom-0 ${
                            line.isMajor 
                                ? 'w-px bg-white/10' 
                                : 'w-px bg-white/5'
                        }`}
                        style={{ left }}
                    >
                        {line.label && (
                            <span className="absolute top-2 left-1.5 text-[10px] text-white/20 font-mono select-none">
                                {line.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// 时间格式化辅助函数
const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default TimelineGrid;
