import type {
  PresentationSettings,
  Slide,
  SlideLayout,
  SlideTheme,
} from '@sdkwork/magic-studio-types/chatppt';

export interface MagicStudioPresentationsListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface MagicStudioPresentationCreateRequest {
  title: string;
  theme?: SlideTheme;
  settings?: PresentationSettings;
}

export interface MagicStudioPresentationUpdateRequest {
  title?: string;
  theme?: SlideTheme;
  settings?: PresentationSettings;
  slides?: Slide[];
}

export interface MagicStudioPresentationSlideCreateRequest {
  layout?: SlideLayout;
  title?: string;
  heading?: string;
}

export interface MagicStudioPresentationSlideUpdateRequest {
  title?: string;
  notes?: string;
  elements?: Slide['elements'];
  layout?: SlideLayout;
  backgroundColor?: string;
  backgroundImage?: string;
  transition?: string;
}
