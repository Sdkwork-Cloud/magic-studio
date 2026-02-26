# Asset Center Comprehensive Guide

## Overview

The Asset Center is the unified foundation for all asset management in the Magic Studio ecosystem. It provides a consistent, type-safe, and scalable way to handle all types of digital assets including images, videos, audio, digital humans, sound effects, and more.

## Core Concepts

### Asset Types

The asset center supports the following asset types:

- **Basic Assets**: `image`, `video`, `audio`, `music`, `voice`
- **Enhanced Assets**: `text`, `effect`, `transition`, `character`
- **Specialized Assets**: `digital-human`, `sfx`, `model3d`, `lottie`

### Enhanced Asset Types

#### DigitalHumanAsset
```typescript
type DigitalHumanAsset = FileMediaResource & { 
    type: MediaResourceType.CHARACTER;
    category?: 'avatar' | 'character' | 'avatar-animation' | 'full-body';
    metadata?: {
        modelName?: string;
        version?: string;
        rigType?: 'face' | 'body' | 'full';
        animationSupport?: boolean;
        morphTargets?: string[];
        thumbnailUrl?: string;
        previewVideoUrl?: string;
        voiceActor?: string;
        personality?: string;
        languages?: string[];
        style?: 'realistic' | 'anime' | 'cartoon' | 'stylized';
    };
};
```

#### SfxAsset
```typescript
type SfxAsset = AudioMediaResource & { 
    type: MediaResourceType.AUDIO;
    category?: 'ambient' | 'ui' | 'foley' | 'weapons' | 'vehicles' | 'nature' | 'sci-fi' | 'fantasy';
    metadata?: {
        intensity?: 'soft' | 'medium' | 'loud';
        duration?: number;
        loopable?: boolean;
        bpm?: number;
        key?: string;
        genreTags?: string[];
        thumbnailUrl?: string;
        waveformUrl?: string;
    };
};
```

## Service Architecture

### Asset Service Registry Pattern

The asset center uses a registry pattern to manage different asset services:

```typescript
import { assetServiceRegistry, initializeAssetServices } from '@sdkwork/react-assets';

// Initialize all services (call once at app startup)
initializeAssetServices();

// Get service for specific category
const videoService = assetServiceRegistry.get('video');
const digitalHumanService = assetServiceRegistry.get('digital-human');

// Check if service exists
if (assetServiceRegistry.has('sfx')) {
    // Handle SFX assets
}
```

### Available Services

- `MediaAssetService` - Handles mixed media queries
- `VideoAssetService` - Video-specific asset handling
- `ImageAssetService` - Image asset handling
- `AudioAssetService` - Audio asset handling
- `TextAssetService` - Text/title asset handling
- `EffectAssetService` - Visual effects handling
- `TransitionAssetService` - Scene transition handling
- `MusicAssetService` - Music-specific asset handling
- `DigitalHumanAssetService` - Digital human asset handling
- `SfxAssetService` - Sound effect asset handling

## Usage Examples

### 1. Basic Asset Operations

```typescript
import { assetService, AssetType } from '@sdkwork/react-assets';

// Import an asset
const imageData = await fetchImageData();
const asset = await assetService.importAsset(
    imageData,
    'my-image.png',
    'image',
    'upload'
);

// Query assets
const imageAssets = await assetService.findAll({ page: 0, size: 20 }, 'image');
```

### 2. Working with Enhanced Assets

```typescript
import { 
    DigitalHumanAsset, 
    SfxAsset, 
    getAssetService 
} from '@sdkwork/react-assets';

// Get digital human assets
const dhService = getAssetService('digital-human');
const digitalHumans = await dhService.findAll({ page: 0, size: 10 });

// Work with specific asset types
digitalHumans.content.forEach((asset: DigitalHumanAsset) => {
    console.log(`${asset.name} - Style: ${asset.metadata?.style}`);
});

// Get SFX assets
const sfxService = getAssetService('sfx');
const soundEffects = await sfxService.findAll({ page: 0, size: 20 });

soundEffects.content.forEach((asset: SfxAsset) => {
    console.log(`${asset.name} - Category: ${asset.category}`);
});
```

### 3. Asset URL Resolution

```typescript
import { useAssetUrl } from '@sdkwork/react-assets';

function AssetDisplay({ assetPath }: { assetPath: string }) {
    const { url, loading } = useAssetUrl(assetPath);
    
    if (loading) return <div>Loading...</div>;
    if (!url) return <div>Asset not found</div>;
    
    return <img src={url} alt="Asset" />;
}
```

### 4. Asset Selection Component

```typescript
import { ChooseAsset, AssetType } from '@sdkwork/react-assets';

function AssetSelector() {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    
    return (
        <ChooseAsset
            value={selectedAsset}
            onChange={setSelectedAsset}
            accepts={['image', 'video']}
            label="Select Media"
        />
    );
}
```

## Best Practices

### 1. Initialization
Always initialize asset services at application startup:

```typescript
// In your app's entry point
import { initializeAssetServices } from '@sdkwork/react-assets';

initializeAssetServices();
```

### 2. Type Safety
Use the enhanced asset types for better type safety:

```typescript
// Good - Type-safe
const digitalHuman: DigitalHumanAsset = assets[0] as DigitalHumanAsset;
console.log(digitalHuman.metadata?.rigType);

// Avoid - Less type-safe
const asset: any = assets[0];
```

### 3. Error Handling
Always handle potential errors when working with assets:

```typescript
try {
    const service = getAssetService('digital-human');
    const assets = await service.findAll({ page: 0, size: 10 });
    // Process assets
} catch (error) {
    console.error('Failed to load digital humans:', error);
    // Handle error appropriately
}
```

### 4. Performance Optimization
- Use pagination for large asset collections
- Cache frequently accessed assets
- Implement proper cleanup for asset URLs

## Asset Categories and File Extensions

The asset center supports the following categories with their respective file extensions:

| Category | Extensions | Description |
|----------|------------|-------------|
| image | .png, .jpg, .jpeg, .webp, .gif, .svg, .bmp, .tiff | Static images |
| video | .mp4, .mov, .webm, .avi, .mkv, .m4v | Video files |
| audio | .wav, .mp3, .ogg, .flac, .aac, .m4a | Audio clips |
| music | .mp3, .wav, .ogg, .flac | Music tracks |
| voice | .json, .voice, .wav, .mp3 | Voice assets |
| character | .json, .char, .png | Character definitions |
| digital-human | .json, .dh, .glb, .gltf, .fbx | Digital human models |
| sfx | .wav, .mp3, .ogg, .aac | Sound effects |
| model3d | .glb, .gltf, .obj, .fbx | 3D models |
| lottie | .json, .lottie | Lottie animations |

## Extending the Asset Center

### Adding New Asset Types

1. Define the new asset type in `enhancedAsset.entity.ts`:

```typescript
export type NewAssetType = FileMediaResource & {
    type: MediaResourceType.YOUR_TYPE;
    metadata?: {
        // Your specific metadata properties
    };
};
```

2. Add the type to the `AnyAsset` union:

```typescript
export type AnyAsset = AnyMediaResource | DigitalHumanAsset | SfxAsset | NewAssetType | /* other types */;
```

3. Create a specialized service:

```typescript
export class NewAssetService implements IAssetService {
    getCategory(): string {
        return 'new-category';
    }
    
    async findAll(pageable: { page: number; size: number }, query?: string): Promise<Page<AnyAsset>> {
        // Implementation
    }
}
```

4. Register the service in `assetServiceInitializer.ts`:

```typescript
assetServiceRegistry.register(new NewAssetService());
```

5. Add category to `ASSET_CATEGORIES` in `assetService.ts`:

```typescript
{ id: 'new-category', label: 'New Category', accepts: ['.ext1', '.ext2'] }
```

## Troubleshooting

### Common Issues

1. **Service Not Found**: Ensure `initializeAssetServices()` is called
2. **Type Errors**: Check that you're importing from the correct paths
3. **Asset Not Loading**: Verify the asset path and check the asset service logs
4. **Performance Issues**: Implement proper pagination and caching

### Debugging Tips

```typescript
// Check registered services
console.log('Registered categories:', getRegisteredCategories());

// Check if service exists
console.log('Has digital-human service:', hasAssetService('digital-human'));

// Inspect asset structure
const service = getAssetService('image');
const assets = await service.findAll({ page: 0, size: 5 });
console.log('Sample assets:', assets.content);
```

## Migration from Legacy Systems

If you're migrating from the old asset system:

1. Update imports from `'../../services/assets/AssetTypes'` to `'sdkwork-react-assets'`
2. Replace direct service instantiation with registry pattern
3. Use enhanced asset types where appropriate
4. Update component props to use new type definitions

The asset center is designed to be backward compatible while providing enhanced functionality and better developer experience.