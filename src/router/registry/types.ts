import type React from 'react';
import type { RoutePath } from '../routes';

export type LayoutType =
  | 'main'
  | 'none'
  | 'blank'
  | 'generation'
  | 'vibe'
  | 'magic-cut'
  | 'creation'
  | 'notes';

export type RouteComponentKey =
  | 'home'
  | 'settings'
  | 'login'
  | 'authOAuthCallback'
  | 'profile'
  | 'pricing'
  | 'chat'
  | 'browser'
  | 'drive'
  | 'notes'
  | 'editor'
  | 'assets'
  | 'image'
  | 'imageChat'
  | 'video'
  | 'videoChat'
  | 'music'
  | 'musicChat'
  | 'sfx'
  | 'sfxChat'
  | 'voice'
  | 'voiceChat'
  | 'audio'
  | 'audioChat'
  | 'character'
  | 'characterChat'
  | 'magicCut'
  | 'filmHome'
  | 'filmEditor'
  | 'promptOptimizer'
  | 'portal'
  | 'portalVideo'
  | 'portalTools'
  | 'portalDiscover'
  | 'portalCommunity'
  | 'portalTheater'
  | 'portalSkills'
  | 'portalSkillDetail'
  | 'portalPlugins'
  | 'chatPpt'
  | 'canvas'
  | 'taskMarket'
  | 'myTasks'
  | 'download';

export type RouteProviderKey =
  | 'assets'
  | 'editor'
  | 'image'
  | 'video'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'audio'
  | 'character'
  | 'magicCut'
  | 'chatPpt';

export type RouteLeftPaneKey =
  | 'image'
  | 'video'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'audio'
  | 'character'
  | 'chatPpt';

export type RoutePreloadKey =
  | 'assets'
  | 'image'
  | 'video'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'audio'
  | 'character'
  | 'magiccut'
  | 'film'
  | 'portal-video'
  | 'skills'
  | 'plugins'
  | 'editor'
  | 'drive'
  | 'notes'
  | 'chatppt'
  | 'canvas'
  | 'trade';

export interface RouteDefinition {
  path: RoutePath;
  component: React.ComponentType<any>;
  layout?: LayoutType;
  leftPane?: React.ComponentType<any>;
  provider?: React.ComponentType<any>;
}

export interface RouteSpec {
  path: RoutePath;
  componentKey: RouteComponentKey;
  layout?: LayoutType;
  leftPaneKey?: RouteLeftPaneKey;
  providerKey?: RouteProviderKey;
  preload?: readonly RoutePreloadKey[];
}
