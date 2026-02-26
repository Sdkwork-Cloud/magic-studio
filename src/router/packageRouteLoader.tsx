import React, { lazy, Suspense } from 'react';
import { ROUTES, RoutePath } from './routes';

export type LayoutType = 'main' | 'none' | 'generation' | 'vibe' | 'magic-cut' | 'creation' | 'notes';

export interface RouteDefinition {
    path: RoutePath;
    component: React.ComponentType<any>;
    layout: LayoutType;
    leftPane?: React.ComponentType<any>;
    provider?: React.ComponentType<any>;
}

const PageLoadingFallback = () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading...</span>
        </div>
    </div>
);

const PanelLoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
    </div>
);

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PanelLoadingFallback />}>
        <Component {...props} />
    </Suspense>
);

const LazyPageWrapper = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PageLoadingFallback />}>
        <LazyComponent {...props} />
    </Suspense>
);

export const PACKAGE_BASED_ROUTES: RouteDefinition[] = [
    {
        path: ROUTES.CHAT,
        component: lazy(() => import('@sdkwork/react-chat').then(m => ({ default: m.ChatPage }))),
        layout: 'main'
    },
    {
        path: ROUTES.DRIVE,
        component: lazy(() => import('@sdkwork/react-drive').then(m => ({ default: m.DrivePage }))),
        layout: 'main'
    },
    {
        path: ROUTES.BROWSER,
        component: lazy(() => import('@sdkwork/react-browser').then(m => ({ default: m.BrowserPage }))),
        layout: 'main'
    },
    {
        path: ROUTES.NOTES,
        component: lazy(() => import('@sdkwork/react-notes').then(m => ({ default: m.NotesPage }))),
        layout: 'notes'
    },
    {
        path: ROUTES.VIP,
        component: lazy(() => import('@sdkwork/react-vip').then(m => ({ default: m.PricingPage }))),
        layout: 'main'
    },
    
    {
        path: ROUTES.ASSETS,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-assets').then(m => ({ default: m.AssetsPage })))),
        layout: 'creation',
        leftPane: lazy(() => import('@sdkwork/react-assets').then(m => ({ default: m.AssetSidebar }))),
        provider: lazy(() => import('@sdkwork/react-assets').then(m => ({ default: m.AssetStoreProvider })))
    },
    
    {
        path: ROUTES.IMAGE,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImagePage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageStoreProvider })))
    },
    
    {
        path: ROUTES.VIDEO,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoPage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoStoreProvider })))
    },
    
    {
        path: ROUTES.MUSIC,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicPage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicStoreProvider })))
    },
    
    {
        path: ROUTES.SFX,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxPage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxStoreProvider })))
    },
    
    {
        path: ROUTES.VOICE,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoicePage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceStoreProvider })))
    },
    
    {
        path: ROUTES.AUDIO,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioPage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioStoreProvider })))
    },
    
    {
        path: ROUTES.CHARACTER,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterPage })))),
        layout: 'generation',
        leftPane: withSuspense(lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterLeftGeneratorPanel })))),
        provider: lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterStoreProvider })))
    },
    
    {
        path: ROUTES.EDITOR,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-editor').then(m => ({ default: m.EditorPage })))),
        layout: 'main'
    },
    
    {
        path: ROUTES.MAGIC_CUT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-magiccut').then(m => ({ default: m.MagicCutPage })))),
        layout: 'magic-cut',
        provider: lazy(() => import('@sdkwork/react-magiccut').then(m => ({ default: m.MagicCutStoreProvider })))
    },
    
    {
        path: ROUTES.FILM,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-film').then(m => ({ default: m.FilmHomePage })))),
        layout: 'none'
    },
    
    {
        path: ROUTES.FILM_EDITOR,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-film').then(m => ({ default: m.FilmEditorPage })))),
        layout: 'none'
    },
    
    {
        path: ROUTES.PORTAL,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.PortalPage })))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_VIDEO,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.PortalPage })))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_TOOLS,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.AIToolsPage })))),
        layout: 'none'
    },
    
    {
        path: ROUTES.PORTAL_DISCOVER,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.DiscoverPage })))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_COMMUNITY,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.CommunityPage })))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_THEATER,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.TheaterPage })))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_SKILLS,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-skills'))),
        layout: 'none'
    },

    {
        path: ROUTES.PORTAL_PLUGINS,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-plugins'))),
        layout: 'none'
    },

    {
        path: ROUTES.CHAT_PPT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.ChatPPTPage })))),
        layout: 'vibe',
        leftPane: lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.PPTExplorer }))),
        provider: lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.ChatPPTStoreProvider })))
    },
    
    {
        path: ROUTES.CANVAS,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-canvas').then(m => ({ default: m.CanvasPage })))),
        layout: 'none'
    }
];

export const FALLBACK_ROUTES: RouteDefinition[] = [
    {
        path: ROUTES.HOME,
        component: LazyPageWrapper(lazy(() => import('../pages/HomePage'))),
        layout: 'main'
    },
    {
        path: ROUTES.SETTINGS,
        component: LazyPageWrapper(lazy(() => import('../pages/SettingsPage'))),
        layout: 'none'
    },
    {
        path: ROUTES.LOGIN,
        component: LazyPageWrapper(lazy(() => import('../pages/LoginPage'))),
        layout: 'none'
    },
    {
        path: ROUTES.PROFILE,
        component: LazyPageWrapper(lazy(() => import('../pages/ProfilePage'))),
        layout: 'main'
    },
    {
        path: ROUTES.IMAGE_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.VIDEO_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.MUSIC_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.SFX_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.VOICE_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.AUDIO_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioChatPage })))),
        layout: 'none'
    },
    {
        path: ROUTES.CHARACTER_CHAT,
        component: LazyPageWrapper(lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterChatPage })))),
        layout: 'generation',
        provider: lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterStoreProvider })))
    }
];

export const COMPLETE_ROUTE_REGISTRY = [...PACKAGE_BASED_ROUTES, ...FALLBACK_ROUTES];
