import React, { lazy, Suspense } from 'react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';

type RouteComponent = React.ComponentType<any>;
type LazyRouteComponent = React.LazyExoticComponent<RouteComponent>;

const HomePage = lazy(() => import('../../pages/HomePage'));
const SettingsPage = lazy(() => import('../../pages/SettingsPage'));
const LoginPage = lazy(() => import('../../pages/LoginPage'));
const AuthOAuthCallbackPage = lazy(() => import('../../pages/AuthOAuthCallbackPage'));
const ProfilePage = lazy(() => import('../../pages/ProfilePage'));
const PricingPage = lazy(() =>
  import('@sdkwork/magic-studio-vip/pages').then((module) => ({ default: module.PricingPage })),
);
const ChatPage = lazy(() =>
  import('@sdkwork/magic-studio-chat/pages').then((module) => ({ default: module.ChatPage })),
);
const DrivePage = lazy(() =>
  import('@sdkwork/magic-studio-drive/pages').then((module) => ({ default: module.DrivePage })),
);
const BrowserPage = lazy(() =>
  import('@sdkwork/magic-studio-browser/pages').then((module) => ({ default: module.BrowserPage })),
);
const NotesPage = lazy(() =>
  import('@sdkwork/magic-studio-notes/pages').then((module) => ({ default: module.NotesPage })),
);
const EditorPage = lazy(() =>
  import('@sdkwork/magic-studio-editor/pages').then((module) => ({ default: module.EditorPage })),
);
const AssetsPage = lazy(() =>
  import('@sdkwork/magic-studio-assets/pages').then((module) => ({ default: module.AssetsPage })),
);
const ImagePage = lazy(() =>
  import('@sdkwork/magic-studio-image/pages').then((module) => ({ default: module.ImagePage })),
);
const ImageChatPage = lazy(() =>
  import('@sdkwork/magic-studio-image/pages').then((module) => ({ default: module.ImageChatPage })),
);
const VideoPage = lazy(() =>
  import('@sdkwork/magic-studio-video/pages').then((module) => ({ default: module.VideoPage })),
);
const VideoChatPage = lazy(() =>
  import('@sdkwork/magic-studio-video/pages').then((module) => ({ default: module.VideoChatPage })),
);
const MusicPage = lazy(() =>
  import('@sdkwork/magic-studio-music/pages').then((module) => ({ default: module.MusicPage })),
);
const MusicChatPage = lazy(() =>
  import('@sdkwork/magic-studio-music/pages').then((module) => ({ default: module.MusicChatPage })),
);
const SfxPage = lazy(() =>
  import('@sdkwork/magic-studio-sfx/pages').then((module) => ({ default: module.SfxPage })),
);
const SfxChatPage = lazy(() =>
  import('@sdkwork/magic-studio-sfx/pages').then((module) => ({ default: module.SfxChatPage })),
);
const VoicePage = lazy(() =>
  import('@sdkwork/magic-studio-voicespeaker/pages').then((module) => ({ default: module.VoicePage })),
);
const VoiceChatPage = lazy(() =>
  import('@sdkwork/magic-studio-voicespeaker/pages').then((module) => ({ default: module.VoiceChatPage })),
);
const AudioPage = lazy(() =>
  import('@sdkwork/magic-studio-audio/pages').then((module) => ({ default: module.AudioPage })),
);
const AudioChatPage = lazy(() =>
  import('@sdkwork/magic-studio-audio/pages').then((module) => ({ default: module.AudioChatPage })),
);
const CharacterPage = lazy(() =>
  import('@sdkwork/magic-studio-character/pages').then((module) => ({ default: module.CharacterPage })),
);
const CharacterChatPage = lazy(() =>
  import('@sdkwork/magic-studio-character/pages').then((module) => ({
    default: module.CharacterChatPage,
  })),
);
const MagicCutPage = lazy(() =>
  import('@sdkwork/magic-studio-magiccut/pages').then((module) => ({ default: module.MagicCutPage })),
);
const FilmHomePage = lazy(() =>
  import('@sdkwork/magic-studio-film/pages').then((module) => ({ default: module.FilmHomePage })),
);
const FilmEditorPage = lazy(() =>
  import('@sdkwork/magic-studio-film/pages').then((module) => ({ default: module.FilmEditorPage })),
);
const PromptOptimizerPage = lazy(() =>
  import('@sdkwork/magic-studio-prompt/pages').then((module) => ({
    default: module.PromptOptimizerPage,
  })),
);

// Keep portal pages on the dedicated pages entry to avoid reintroducing root-entry cycles.
const PortalPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({ default: module.PortalPage })),
);
const AIToolsPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({ default: module.AIToolsPage })),
);
const DiscoverPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({ default: module.DiscoverPage })),
);
const CommunityPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({
    default: module.CommunityPage,
  })),
);
const TheaterPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({ default: module.TheaterPage })),
);
const DownloadAppPage = lazy(() =>
  import('@sdkwork/magic-studio-portal-video/pages').then((module) => ({
    default: module.DownloadAppPage,
  })),
);
const SkillsPage = lazy(() =>
  import('@sdkwork/magic-studio-skills/pages').then((module) => ({ default: module.SkillsPage })),
);
const SkillDetailPage = lazy(() =>
  import('@sdkwork/magic-studio-skills/pages').then((module) => ({ default: module.SkillDetailPage })),
);
const PluginsPage = lazy(() =>
  import('@sdkwork/magic-studio-plugins/pages').then((module) => ({ default: module.PluginsPage })),
);
const ChatPPTPage = lazy(() =>
  import('@sdkwork/magic-studio-chatppt/pages').then((module) => ({ default: module.ChatPPTPage })),
);
const CanvasPage = lazy(() =>
  import('@sdkwork/magic-studio-canvas/pages').then((module) => ({ default: module.CanvasPage })),
);
const TaskMarketPage = lazy(() =>
  import('@sdkwork/magic-studio-trade/pages').then((module) => ({ default: module.TaskMarketPage })),
);
const MyTasksPage = lazy(() =>
  import('@sdkwork/magic-studio-trade/pages').then((module) => ({ default: module.MyTasksPage })),
);

const AssetStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-assets/store').then((module) => ({
    default: module.AssetStoreProvider,
  })),
);
const EditorStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-editor/store').then((module) => ({
    default: module.EditorStoreProvider,
  })),
);
const ImageStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-image/store').then((module) => ({
    default: module.ImageStoreProvider,
  })),
);
const VideoStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-video/store').then((module) => ({
    default: module.VideoStoreProvider,
  })),
);
const MusicStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-music/store').then((module) => ({
    default: module.MusicStoreProvider,
  })),
);
const SfxStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-sfx/store').then((module) => ({ default: module.SfxStoreProvider })),
);
const VoiceStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-voicespeaker/store').then((module) => ({
    default: module.VoiceStoreProvider,
  })),
);
const AudioStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-audio/store').then((module) => ({
    default: module.AudioStoreProvider,
  })),
);
const CharacterStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-character/store').then((module) => ({
    default: module.CharacterStoreProvider,
  })),
);
const MagicCutStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-magiccut/store').then((module) => ({
    default: module.MagicCutStoreProvider,
  })),
);
const ChatPPTStoreProvider = lazy(() =>
  import('@sdkwork/magic-studio-chatppt/store').then((module) => ({
    default: module.ChatPPTStoreProvider,
  })),
);

const PPTExplorer = lazy(() =>
  import('@sdkwork/magic-studio-chatppt/panels').then((module) => ({ default: module.PPTExplorer })),
);
const ImageLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-image/panels').then((module) => ({
    default: module.ImageLeftGeneratorPanel,
  })),
);
const VideoLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-video/panels').then((module) => ({
    default: module.VideoLeftGeneratorPanel,
  })),
);
const MusicLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-music/panels').then((module) => ({
    default: module.MusicLeftGeneratorPanel,
  })),
);
const SfxLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-sfx/panels').then((module) => ({
    default: module.SfxLeftGeneratorPanel,
  })),
);
const VoiceLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-voicespeaker/panels').then((module) => ({
    default: module.VoiceLeftGeneratorPanel,
  })),
);
const AudioLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-audio/panels').then((module) => ({
    default: module.AudioLeftGeneratorPanel,
  })),
);
const CharacterLeftGeneratorPanel = lazy(() =>
  import('@sdkwork/magic-studio-character/panels').then((module) => ({
    default: module.CharacterLeftGeneratorPanel,
  })),
);

const PanelLoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
  </div>
);

const PageLoadingFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen w-full items-center justify-center gap-3 bg-[#050505] text-gray-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
      <span className="text-xs font-medium">{t('appShell.loading_module')}</span>
    </div>
  );
};

const wrapLazyWithSuspense = (
  Component: LazyRouteComponent,
  fallback: React.ReactNode,
): RouteComponent => {
  const WrappedComponent = (props: any) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  return WrappedComponent;
};

const wrapPanel = (Component: LazyRouteComponent): RouteComponent =>
  wrapLazyWithSuspense(Component, <PanelLoadingFallback />);
const wrapPage = (Component: LazyRouteComponent): RouteComponent =>
  wrapLazyWithSuspense(Component, <PageLoadingFallback />);

const PortalPageWithFallback = wrapPage(PortalPage);
const DownloadAppPageWithFallback = wrapPage(DownloadAppPage);
const TaskMarketWithLayout = wrapPage(TaskMarketPage);
const MyTasksWithLayout = wrapPage(MyTasksPage);

export const routeComponents = {
  home: HomePage,
  settings: SettingsPage,
  login: LoginPage,
  authOAuthCallback: AuthOAuthCallbackPage,
  profile: ProfilePage,
  pricing: PricingPage,
  chat: ChatPage,
  browser: BrowserPage,
  drive: DrivePage,
  notes: NotesPage,
  editor: EditorPage,
  assets: AssetsPage,
  image: ImagePage,
  imageChat: ImageChatPage,
  video: VideoPage,
  videoChat: VideoChatPage,
  music: MusicPage,
  musicChat: MusicChatPage,
  sfx: SfxPage,
  sfxChat: SfxChatPage,
  voice: VoicePage,
  voiceChat: VoiceChatPage,
  audio: AudioPage,
  audioChat: AudioChatPage,
  character: CharacterPage,
  characterChat: CharacterChatPage,
  magicCut: MagicCutPage,
  filmHome: FilmHomePage,
  filmEditor: FilmEditorPage,
  promptOptimizer: PromptOptimizerPage,
  portal: PortalPageWithFallback,
  portalVideo: PortalPageWithFallback,
  portalTools: AIToolsPage,
  portalDiscover: DiscoverPage,
  portalCommunity: CommunityPage,
  portalTheater: TheaterPage,
  portalSkills: SkillsPage,
  portalSkillDetail: SkillDetailPage,
  portalPlugins: PluginsPage,
  chatPpt: ChatPPTPage,
  canvas: CanvasPage,
  taskMarket: TaskMarketWithLayout,
  myTasks: MyTasksWithLayout,
  download: DownloadAppPageWithFallback,
} as const;

export const routeProviders = {
  assets: AssetStoreProvider,
  editor: EditorStoreProvider,
  image: ImageStoreProvider,
  video: VideoStoreProvider,
  music: MusicStoreProvider,
  sfx: SfxStoreProvider,
  voice: VoiceStoreProvider,
  audio: AudioStoreProvider,
  character: CharacterStoreProvider,
  magicCut: MagicCutStoreProvider,
  chatPpt: ChatPPTStoreProvider,
} as const;

export const routeLeftPanes = {
  image: wrapPanel(ImageLeftGeneratorPanel),
  video: wrapPanel(VideoLeftGeneratorPanel),
  music: wrapPanel(MusicLeftGeneratorPanel),
  sfx: wrapPanel(SfxLeftGeneratorPanel),
  voice: wrapPanel(VoiceLeftGeneratorPanel),
  audio: wrapPanel(AudioLeftGeneratorPanel),
  character: wrapPanel(CharacterLeftGeneratorPanel),
  chatPpt: PPTExplorer,
} as const;
