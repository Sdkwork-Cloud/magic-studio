
import React, { useMemo, useState, useEffect } from 'react';
import { MediaResourceType } from 'sdkwork-react-commons';
import { mediaService } from 'sdkwork-react-core';

interface ClipFilmstripProps {
    resourceUrl: string;
    resourceType: MediaResourceType;
    height: number;
    offset: number; 
    pixelsPerSecond: number;
    metadata?: {
        width?: number;
        height?: number;
        [key: string]: any;
    };
    className?: string;
}

/**
 * Renders a true filmstrip sequence for Video, or a repeating pattern for Images.
 */
export const ClipFilmstrip: React.FC<ClipFilmstripProps> = React.memo(({
    resourceUrl,
    resourceType,
    height,
    offset,
    pixelsPerSecond,
    metadata,
    className = ''
}) => {
    // If it's a static image
    if (resourceType === MediaResourceType.IMAGE) {
        return <ImageFilmstrip 
            resourceUrl={resourceUrl} 
            resourceType={resourceType}
            height={height} 
            offset={offset} 
            pixelsPerSecond={pixelsPerSecond} 
            metadata={metadata} 
            className={className} 
        />;
    }
    
    // If it's a video
    if (resourceType === MediaResourceType.VIDEO) {
        return <VideoFilmstrip 
            resourceUrl={resourceUrl} 
            resourceType={resourceType}
            height={height} 
            offset={offset} 
            pixelsPerSecond={pixelsPerSecond} 
            metadata={metadata} 
            className={className} 
        />;
    }

    return null;
});

const ImageFilmstrip: React.FC<ClipFilmstripProps> = ({ resourceUrl, height, offset, pixelsPerSecond, metadata, className }) => {
    const containerStyle = useMemo(() => {
        const validHeight = Math.max(1, height);
        let tileWidth = validHeight * (16/9);
        
        if (metadata?.width && metadata?.height) {
            const ratio = metadata.width / metadata.height;
            tileWidth = validHeight * ratio;
        }

        const pixelOffset = offset * pixelsPerSecond;
        const phaseShift = -(pixelOffset % tileWidth);

        return {
            backgroundImage: `url(${resourceUrl})`,
            backgroundSize: `${tileWidth}px 100%`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: `${phaseShift}px center`,
            opacity: 1, 
        };
    }, [resourceUrl, height, offset, pixelsPerSecond, metadata]);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
            <div className="absolute inset-0" style={containerStyle} />
        </div>
    );
};

const VideoFilmstrip: React.FC<ClipFilmstripProps> = ({ resourceUrl, height, offset, pixelsPerSecond, metadata, className }) => {
    // 1. Calculate Tile Dimensions
    const validHeight = Math.max(1, height);
    let tileWidth = validHeight * (16/9);
    
    if (metadata?.width && metadata?.height) {
        const ratio = metadata.width / metadata.height;
        tileWidth = validHeight * ratio;
    }

    // 2. Measure Container
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) setContainerWidth(rect.width);
        
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 3. Generate Tile Data
    const tiles = useMemo(() => {
        if (containerWidth === 0 || tileWidth <= 0 || pixelsPerSecond <= 0) return [];
        
        const count = Math.ceil(containerWidth / tileWidth) + 1; 
        const generatedTiles = [];

        // Time span per tile
        const timePerTile = tileWidth / pixelsPerSecond;

        for (let i = 0; i < count; i++) {
            // Absolute time in the source video
            let time = offset + (i * timePerTile);
            
            // Fix: If time is exactly 0 or very close, bump it to 0.1 to avoid black start frame
            if (time < 0.1) time = 0.1;
            
            if (time >= 0) {
                generatedTiles.push({
                    index: i,
                    time: time,
                    // Use time in ID to ensure uniqueness if offset changes
                    id: `${resourceUrl}-${time.toFixed(2)}`
                });
            }
        }
        
        return generatedTiles;
    }, [containerWidth, tileWidth, offset, pixelsPerSecond, resourceUrl]);

    return (
        <div 
            ref={containerRef}
            className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 flex ${className}`}
        >
            {tiles.map(tile => (
                <FilmstripFrame 
                    key={tile.id}
                    resourceUrl={resourceUrl}
                    time={tile.time}
                    width={tileWidth}
                    height={validHeight}
                />
            ))}
        </div>
    );
};

const FilmstripFrame: React.FC<{
    resourceUrl: string;
    time: number;
    width: number;
    height: number;
}> = React.memo(({ resourceUrl, time, width, height }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        let active = true;
        
        // Reset state when props change
        setIsVisible(false);
        
        const load = async () => {
            // Use MediaService with caching
            const thumb = await mediaService.getVideoThumbnail(resourceUrl, resourceUrl, time);
            if (active && thumb) {
                setSrc(thumb);
                setIsVisible(true);
            }
        };
        load();
        return () => { active = false; };
    }, [resourceUrl, time]);

    return (
        <div 
            style={{ 
                width: width, 
                height: height, 
                flexShrink: 0, 
                borderRight: '1px solid rgba(0,0,0,0.5)', 
                backgroundColor: '#000',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {src && (
                <img 
                    src={src} 
                    alt="" 
                    draggable={false}
                    className={`w-full h-full object-cover transition-opacity duration-300 ease-in ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    );
});

