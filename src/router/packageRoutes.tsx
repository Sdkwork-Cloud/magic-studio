import React, { lazy, Suspense } from 'react';
import { ROUTES, RoutePath } from './routes';

// Import pages from packages
import { ChatPage } from '@sdkwork/react-chat';
import { DrivePage } from '@sdkwork/react-drive';
import { BrowserPage } from '@sdkwork/react-browser';
import { NotesPage } from '@sdkwork/react-notes';
import { PricingPage } from '@sdkwork/react-vip';

// Lazy load heavy modules from packages
const EditorPage = lazy(() => import('@sdkwork/react-editor').then(m => ({ default: m.EditorPage })));
const AssetsPage = lazy(() => import('@sdkwork/react-assets').then(m => ({ default: m.AssetsPage })));
const ImagePage = lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImagePage })));
const ImageChatPage = lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageChatPage })));
const VideoPage = lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoPage })));
const VideoChatPage = lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoChatPage })));
const MusicPage = lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicPage })));
const MusicChatPage = lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicChatPage })));
const SfxPage = lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxPage })));
const SfxChatPage = lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxChatPage })));
const VoicePage = lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoicePage })));
const VoiceChatPage = lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceChatPage })));
const AudioPage = lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioPage })));
const AudioChatPage = lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioChatPage })));
const CharacterPage = lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterPage })));
const CharacterChatPage = lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterChatPage })));
const MagicCutPage = lazy(() => import('@sdkwork/react-magiccut').then(m => ({ default: m.MagicCutPage })));
const FilmHomePage = lazy(() => import('@sdkwork/react-film').then(m => ({ default: m.FilmHomePage })));
const FilmEditorPage = lazy(() => import('@sdkwork/react-film').then(m => ({ default: m.FilmEditorPage })));
const PortalPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.PortalPage })));
const AIToolsPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.AIToolsPage })));
const DiscoverPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.DiscoverPage })));
const CommunityPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.CommunityPage })));
const TheaterPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.TheaterPage })));
const DownloadAppPage = lazy(() => import('@sdkwork/react-portal-video').then(m => ({ default: m.DownloadAppPage })));
const SkillsPage = lazy(() => import('@sdkwork/react-skills').then(m => ({ default: m.SkillsPage })));
const PluginsPage = lazy(() => import('@sdkwork/react-plugins'));
const ChatPPTPage = lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.ChatPPTPage })));
const CanvasPage = lazy(() => import('@sdkwork/react-canvas').then(m => ({ default: m.CanvasPage })));
const TaskMarketPage = lazy(() => import('@sdkwork/react-trade').then(m => ({ default: m.TaskMarketPage })));
const MyTasksPage = lazy(() => import('@sdkwork/react-trade').then(m => ({ default: m.MyTasksPage })));

// Lazy load local pages
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.default })));
const ProfilePageLazy = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.default })));
const LoginPageLazy = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.default })));

// TaskMarket wrapper
const TaskMarketWithLayout = () => (
  <React.Suspense fallback={<PageLoadingFallback />}>
    <TaskMarketPage />
  </React.Suspense>
);

// MyTasks wrapper
const MyTasksWithLayout = () => (
  <React.Suspense fallback={<PageLoadingFallback />}>
    <MyTasksPage />
  </React.Suspense>
);

// Import providers and components from packages
import { AssetSidebar, AssetStoreProvider } from '@sdkwork/react-assets';
import { ImageStoreProvider } from '@sdkwork/react-image';
import { VideoStoreProvider } from '@sdkwork/react-video';
import { MusicStoreProvider } from '@sdkwork/react-music';
import { SfxStoreProvider } from '@sdkwork/react-sfx';
import { VoiceStoreProvider } from '@sdkwork/react-voicespeaker';
import { AudioStoreProvider } from '@sdkwork/react-audio';
import { CharacterStoreProvider } from '@sdkwork/react-character';
import { MagicCutStoreProvider } from '@sdkwork/react-magiccut';
import { ChatPPTStoreProvider, PPTExplorer } from '@sdkwork/react-chatppt';

// Import left pane components
const ImageLeftGeneratorPanel = lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageLeftGeneratorPanel })));
const VideoLeftGeneratorPanel = lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoLeftGeneratorPanel })));
const MusicLeftGeneratorPanel = lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicLeftGeneratorPanel })));
const SfxLeftGeneratorPanel = lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxLeftGeneratorPanel })));
const VoiceLeftGeneratorPanel = lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceLeftGeneratorPanel })));
const AudioLeftGeneratorPanel = lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioLeftGeneratorPanel })));
const CharacterLeftGeneratorPanel = lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterLeftGeneratorPanel })));

// Loading fallback component
const PageLoadingFallback = () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Loading...</span>
        </div>
    </div>
);

// Panel loading fallback
const PanelLoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
    </div>
);

// Higher-order component for lazy loading with suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PanelLoadingFallback />}>
        <Component {...props} />
    </Suspense>
);

// Wrap heavy pages with suspense
const LazyPageWrapper = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PageLoadingFallback />}>
        <LazyComponent {...props} />
    </Suspense>
);

export type LayoutType = 'main' | 'none' | 'generation' | 'vibe' | 'magic-cut' | 'creation' | 'notes';

export interface RouteDefinition {
    path: RoutePath;
    component: React.ComponentType<any>;
    layout: LayoutType;
    leftPane?: React.ComponentType<any>;
    provider?: React.ComponentType<any>;
}

export const PACKAGE_ROUTES: RouteDefinition[] = [
    // --- Main Layout Routes ---
    { path: ROUTES.HOME, component: LazyPageWrapper(EditorPage), layout: 'main' },
    { path: ROUTES.EDITOR, component: LazyPageWrapper(EditorPage), layout: 'main' },
    { path: ROUTES.CHAT, component: ChatPage, layout: 'main' },
    { path: ROUTES.BROWSER, component: BrowserPage, layout: 'main' },
    { path: ROUTES.DRIVE, component: DrivePage, layout: 'main' },
    { 
        path: ROUTES.ASSETS, 
        component: LazyPageWrapper(AssetsPage), 
        layout: 'creation',
        leftPane: AssetSidebar,
        provider: AssetStoreProvider
    },
    { path: ROUTES.SETTINGS, component: LazyPageWrapper(SettingsPage), layout: 'none' },
    { path: ROUTES.PROFILE, component: LazyPageWrapper(ProfilePageLazy), layout: 'main' },
    { path: ROUTES.VIP, component: PricingPage, layout: 'main' },
    
    // --- Specific Tool Layouts ---
    { path: ROUTES.NOTES, component: NotesPage, layout: 'notes' },
    
    // --- Standalone Routes ---
    { path: ROUTES.LOGIN, component: LazyPageWrapper(LoginPageLazy), layout: 'none' },
    
    // --- Generation Tool Routes ---
    { 
        path: ROUTES.IMAGE, 
        component: LazyPageWrapper(ImagePage), 
        layout: 'generation',
        leftPane: withSuspense(ImageLeftGeneratorPanel),
        provider: ImageStoreProvider
    },
    { path: ROUTES.IMAGE_CHAT, component: LazyPageWrapper(ImageChatPage), layout: 'none' },
    
    { 
        path: ROUTES.VIDEO, 
        component: LazyPageWrapper(VideoPage), 
        layout: 'generation',
        leftPane: withSuspense(VideoLeftGeneratorPanel),
        provider: VideoStoreProvider
    },
    { path: ROUTES.VIDEO_CHAT, component: LazyPageWrapper(VideoChatPage), layout: 'none' },
    
    { 
        path: ROUTES.MUSIC, 
        component: LazyPageWrapper(MusicPage), 
        layout: 'generation',
        leftPane: withSuspense(MusicLeftGeneratorPanel),
        provider: MusicStoreProvider
    },
    { path: ROUTES.MUSIC_CHAT, component: LazyPageWrapper(MusicChatPage), layout: 'none' },
    
    { 
        path: ROUTES.SFX, 
        component: LazyPageWrapper(SfxPage), 
        layout: 'generation',
        leftPane: withSuspense(SfxLeftGeneratorPanel),
        provider: SfxStoreProvider
    },
    { path: ROUTES.SFX_CHAT, component: LazyPageWrapper(SfxChatPage), layout: 'none' },
    
    { 
        path: ROUTES.VOICE, 
        component: LazyPageWrapper(VoicePage), 
        layout: 'generation',
        leftPane: withSuspense(VoiceLeftGeneratorPanel),
        provider: VoiceStoreProvider
    },
    { path: ROUTES.VOICE_CHAT, component: LazyPageWrapper(VoiceChatPage), layout: 'none' },
    
    { 
        path: ROUTES.AUDIO, 
        component: LazyPageWrapper(AudioPage), 
        layout: 'generation',
        leftPane: withSuspense(AudioLeftGeneratorPanel),
        provider: AudioStoreProvider
    },
    { path: ROUTES.AUDIO_CHAT, component: LazyPageWrapper(AudioChatPage), layout: 'none' },
    
    { 
        path: ROUTES.CHARACTER, 
        component: LazyPageWrapper(CharacterPage), 
        layout: 'generation',
        leftPane: withSuspense(CharacterLeftGeneratorPanel),
        provider: CharacterStoreProvider
    },
    { 
        path: ROUTES.CHARACTER_CHAT, 
        component: LazyPageWrapper(CharacterChatPage), 
        layout: 'generation',
        provider: CharacterStoreProvider
    },
    
    // --- Advanced Tools ---
    { 
        path: ROUTES.CHAT_PPT, 
        component: LazyPageWrapper(ChatPPTPage), 
        layout: 'vibe',
        leftPane: PPTExplorer,
        provider: ChatPPTStoreProvider
    },
    { 
        path: ROUTES.CANVAS, 
        component: LazyPageWrapper(CanvasPage), 
        layout: 'none'
    },
    {
        path: ROUTES.MAGIC_CUT,
        component: LazyPageWrapper(MagicCutPage),
        layout: 'magic-cut',
        provider: MagicCutStoreProvider
    },
    {
        path: ROUTES.FILM,
        component: LazyPageWrapper(FilmHomePage), 
        layout: 'none'
    },
    {
        path: ROUTES.FILM_EDITOR,
        component: LazyPageWrapper(FilmEditorPage), 
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL,
        component: LazyPageWrapper(PortalPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_VIDEO,
        component: LazyPageWrapper(PortalPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_TOOLS,
        component: LazyPageWrapper(AIToolsPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_DISCOVER,
        component: LazyPageWrapper(DiscoverPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_COMMUNITY,
        component: LazyPageWrapper(CommunityPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_THEATER,
        component: LazyPageWrapper(TheaterPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_SKILLS,
        component: LazyPageWrapper(SkillsPage),
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL_PLUGINS,
        component: LazyPageWrapper(PluginsPage),
        layout: 'none'
    },
    {
        path: ROUTES.TASK_MARKET,
        component: TaskMarketWithLayout,
        layout: 'none'
    },
    {
        path: ROUTES.MY_TASKS,
        component: MyTasksWithLayout,
        layout: 'none'
    },
    {
        path: ROUTES.DOWNLOAD,
        component: LazyPageWrapper(DownloadAppPage),
        layout: 'none'
    }
];
