
import React, { lazy, Suspense } from 'react';
import { ROUTES, RoutePath } from './routes';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/react-i18n';
import HomePage from '../pages/HomePage';

// Heavy modules: Lazy load to fix circular dependencies and improve startup
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const PricingPage = lazy(() => import('@sdkwork/react-vip').then(m => ({ default: m.PricingPage })));
const ChatPage = lazy(() => import('@sdkwork/react-chat').then(m => ({ default: m.ChatPage })));
const ChatStoreProvider = lazy(() => import('@sdkwork/react-chat').then(m => ({ default: m.ChatStoreProvider })));
const NotificationStoreProvider = lazy(() =>
  import('@sdkwork/react-notifications').then(m => ({ default: m.NotificationStoreProvider })),
);
const DrivePage = lazy(() => import('@sdkwork/react-drive').then(m => ({ default: m.DrivePage })));
const BrowserPage = lazy(() => import('@sdkwork/react-browser').then(m => ({ default: m.BrowserPage })));
const NotesPage = lazy(() => import('@sdkwork/react-notes').then(m => ({ default: m.NotesPage })));
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
const PromptOptimizerPage = lazy(() => import('@sdkwork/react-prompt').then(m => ({ default: m.PromptOptimizerPage })));

const PortalPage = lazy(() => import('@sdkwork/react-portal-video/pages/PortalPage'));
const AIToolsPage = lazy(() => import('@sdkwork/react-portal-video/pages/AIToolsPage'));
const DiscoverPage = lazy(() => import('@sdkwork/react-portal-video/pages/DiscoverPage'));
const CommunityPage = lazy(() => import('@sdkwork/react-portal-video/pages/CommunityPage'));
const TheaterPage = lazy(() => import('@sdkwork/react-portal-video/pages/TheaterPage'));
const DownloadAppPage = lazy(() => import('@sdkwork/react-portal-video/pages/DownloadAppPage'));
const SkillsPage = lazy(() => import('@sdkwork/react-skills').then(m => ({ default: m.SkillsPage })));
const SkillDetailPage = lazy(() => import('@sdkwork/react-skills').then(m => ({ default: m.SkillDetailPage })));
const PluginsPage = lazy(() => import('@sdkwork/react-plugins').then(m => ({ default: m.PluginsPage })));
const ChatPPTPage = lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.ChatPPTPage })));
const CanvasPage = lazy(() => import('@sdkwork/react-canvas').then(m => ({ default: m.CanvasPage })));
const TaskMarketPage = lazy(() => import('@sdkwork/react-trade').then(m => ({ default: m.TaskMarketPage })));
const MyTasksPage = lazy(() => import('@sdkwork/react-trade').then(m => ({ default: m.MyTasksPage })));

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

// Providers
const AssetStoreProvider = lazy(() => import('@sdkwork/react-assets').then(m => ({ default: m.AssetStoreProvider })));
const EditorStoreProvider = lazy(() => import('@sdkwork/react-editor').then(m => ({ default: m.EditorStoreProvider })));
const ImageStoreProvider = lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageStoreProvider })));
const VideoStoreProvider = lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoStoreProvider })));
const MusicStoreProvider = lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicStoreProvider })));
const SfxStoreProvider = lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxStoreProvider })));
const VoiceStoreProvider = lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceStoreProvider })));
const AudioStoreProvider = lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioStoreProvider })));
const CharacterStoreProvider = lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterStoreProvider })));
const MagicCutStoreProvider = lazy(() => import('@sdkwork/react-magiccut').then(m => ({ default: m.MagicCutStoreProvider })));
const ChatPPTStoreProvider = lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.ChatPPTStoreProvider })));
const PPTExplorer = lazy(() => import('@sdkwork/react-chatppt').then(m => ({ default: m.PPTExplorer })));

// Panels (Left Panes) - Lazy load to fix circular dependency issues
const ImageLeftGeneratorPanel = lazy(() => import('@sdkwork/react-image').then(m => ({ default: m.ImageLeftGeneratorPanel })));
const VideoLeftGeneratorPanel = lazy(() => import('@sdkwork/react-video').then(m => ({ default: m.VideoLeftGeneratorPanel })));
const MusicLeftGeneratorPanel = lazy(() => import('@sdkwork/react-music').then(m => ({ default: m.MusicLeftGeneratorPanel })));
const SfxLeftGeneratorPanel = lazy(() => import('@sdkwork/react-sfx').then(m => ({ default: m.SfxLeftGeneratorPanel })));
const VoiceLeftGeneratorPanel = lazy(() => import('@sdkwork/react-voicespeaker').then(m => ({ default: m.VoiceLeftGeneratorPanel })));
const AudioLeftGeneratorPanel = lazy(() => import('@sdkwork/react-audio').then(m => ({ default: m.AudioLeftGeneratorPanel })));
const CharacterLeftGeneratorPanel = lazy(() => import('@sdkwork/react-character').then(m => ({ default: m.CharacterLeftGeneratorPanel })));

// Loading fallback for panels
const PanelLoadingFallback = () => (
    <div className="app-loading-screen w-full h-full flex items-center justify-center">
        <div className="app-loading-spinner w-4 h-4 rounded-full animate-spin" />
    </div>
);

// Wrap lazy panel with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PanelLoadingFallback />}>
        <Component {...props} />
    </Suspense>
);

// Loading fallback for pages
const PageLoadingFallback = () => {
    const { t } = useTranslation();

    return (
        <div className="app-loading-screen w-full h-screen flex items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-primary-500" />
            <span className="text-xs font-medium">{t('appShell.loading_module')}</span>
        </div>
    );
};

// Wrap lazy pages with Suspense
const LazyPageWrapper = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => (props: any) => (
    <Suspense fallback={<PageLoadingFallback />}>
        <LazyComponent {...props} />
    </Suspense>
);

export type LayoutType = 'main' | 'none' | 'blank' | 'generation' | 'vibe' | 'magic-cut' | 'creation' | 'notes';

export interface RouteDefinition {
    path: RoutePath;
    component: React.ComponentType<any>;
    layout?: LayoutType;
    leftPane?: React.ComponentType<any>;
    provider?: React.ComponentType<any>;
    requiresAuth?: boolean;
}

export const APP_ROUTES: RouteDefinition[] = [
    // --- Main Layout Routes ---
    { path: ROUTES.HOME, component: HomePage, layout: 'none', provider: NotificationStoreProvider },
    { path: ROUTES.EDITOR, component: EditorPage, layout: 'main', provider: EditorStoreProvider },
    { path: ROUTES.CHAT, component: ChatPage, layout: 'none', provider: ChatStoreProvider },
    { path: ROUTES.BROWSER, component: BrowserPage, layout: 'main' },
    { path: ROUTES.DRIVE, component: DrivePage, layout: 'creation' },
    { 
        path: ROUTES.ASSETS, 
        component: AssetsPage, 
        layout: 'creation',
        provider: AssetStoreProvider
    },
    { path: ROUTES.SETTINGS, component: SettingsPage, layout: 'none' },
    { path: ROUTES.PROFILE, component: ProfilePage, layout: 'blank', requiresAuth: true },
    { path: ROUTES.VIP, component: PricingPage, layout: 'main' },
    
    // --- Specific Tool Layouts ---
    { path: ROUTES.NOTES, component: NotesPage, layout: 'notes' },
    
    // --- Standalone Routes ---
    { path: ROUTES.LOGIN, component: LoginPage, layout: 'none' },
    
    // --- Generation Tool Routes ---
    { 
        path: ROUTES.IMAGE, 
        component: ImagePage, 
        layout: 'generation',
        leftPane: withSuspense(ImageLeftGeneratorPanel),
        provider: ImageStoreProvider
    },
    { path: ROUTES.IMAGE_CHAT, component: ImageChatPage, layout: 'none' },
    
    { 
        path: ROUTES.VIDEO, 
        component: VideoPage, 
        layout: 'generation',
        leftPane: withSuspense(VideoLeftGeneratorPanel),
        provider: VideoStoreProvider
    },
    { path: ROUTES.VIDEO_CHAT, component: VideoChatPage, layout: 'none' },
    
    { 
        path: ROUTES.MUSIC, 
        component: MusicPage, 
        layout: 'generation',
        leftPane: withSuspense(MusicLeftGeneratorPanel),
        provider: MusicStoreProvider
    },
    { path: ROUTES.MUSIC_CHAT, component: MusicChatPage, layout: 'none' },
    
    { 
        path: ROUTES.SFX, 
        component: SfxPage, 
        layout: 'generation',
        leftPane: withSuspense(SfxLeftGeneratorPanel),
        provider: SfxStoreProvider
    },
    { path: ROUTES.SFX_CHAT, component: SfxChatPage, layout: 'none' },
    
    { 
        path: ROUTES.VOICE, 
        component: VoicePage, 
        layout: 'generation',
        leftPane: withSuspense(VoiceLeftGeneratorPanel),
        provider: VoiceStoreProvider
    },
    { path: ROUTES.VOICE_CHAT, component: VoiceChatPage, layout: 'none' },
    
    { 
        path: ROUTES.AUDIO, 
        component: AudioPage, 
        layout: 'generation',
        leftPane: withSuspense(AudioLeftGeneratorPanel),
        provider: AudioStoreProvider
    },
    { path: ROUTES.AUDIO_CHAT, component: AudioChatPage, layout: 'none' },
    
    { 
        path: ROUTES.CHARACTER, 
        component: CharacterPage, 
        layout: 'generation',
        leftPane: withSuspense(CharacterLeftGeneratorPanel),
        provider: CharacterStoreProvider
    },
    { 
        path: ROUTES.CHARACTER_CHAT, 
        component: CharacterChatPage, 
        layout: 'generation',
        provider: CharacterStoreProvider
    },
    
    // --- Advanced Tools ---
    { 
        path: ROUTES.CHAT_PPT, 
        component: ChatPPTPage, 
        layout: 'vibe',
        leftPane: PPTExplorer,
        provider: ChatPPTStoreProvider
    },
    { 
        path: ROUTES.CANVAS, 
        component: CanvasPage, 
        layout: 'none', 
    },
    {
        path: ROUTES.MAGIC_CUT,
        component: MagicCutPage,
        layout: 'magic-cut',
        provider: MagicCutStoreProvider
    },
    {
        path: ROUTES.FILM,
        component: FilmHomePage, 
        layout: 'none'
    },
    {
        path: ROUTES.FILM_EDITOR,
        component: FilmEditorPage, 
        layout: 'none'
    },
    {
        path: ROUTES.PROMPT,
        component: PromptOptimizerPage, 
        layout: 'none'
    },
    {
        path: ROUTES.PORTAL,
        component: LazyPageWrapper(PortalPage),
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_VIDEO,
        component: LazyPageWrapper(PortalPage),
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_TOOLS,
        component: AIToolsPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_DISCOVER,
        component: DiscoverPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_COMMUNITY,
        component: CommunityPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_THEATER,
        component: TheaterPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_SKILLS,
        component: SkillsPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: `${ROUTES.PORTAL_SKILLS}/:skillId`,
        component: SkillDetailPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.PORTAL_PLUGINS,
        component: PluginsPage,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.TASK_MARKET,
        component: TaskMarketWithLayout,
        layout: 'none',
        provider: NotificationStoreProvider
    },
    {
        path: ROUTES.MY_TASKS,
        component: MyTasksWithLayout,
        layout: 'none',
        provider: NotificationStoreProvider,
        requiresAuth: true
    },
    {
        path: ROUTES.DOWNLOAD,
        component: LazyPageWrapper(DownloadAppPage),
        layout: 'none',
        provider: NotificationStoreProvider
    }
];
