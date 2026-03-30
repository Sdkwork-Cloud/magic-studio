import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TradeHeader } from './TradeLayout';

const mockUseRouter = vi.fn();
const mockUseAuthStore = vi.fn();
const mockUseWorkspaceStore = vi.fn();
const mockUseNotificationStore = vi.fn();
const mockUseTranslation = vi.fn();
const mockUsePointsAccountBalance = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  ROUTES: {
    PORTAL_VIDEO: '/portal/video',
    PORTAL_COMMUNITY: '/portal/community',
    PORTAL_THEATER: '/portal/theater',
    PORTAL_SKILLS: '/portal/skills',
    PORTAL_PLUGINS: '/portal/plugins',
    TASK_MARKET: '/task-market',
    MY_TASKS: '/my-tasks',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    LOGIN: '/login',
    IMAGE: '/image',
    VIDEO: '/video',
    MUSIC: '/music',
    AUDIO: '/audio',
    VOICE: '/voice',
    CHARACTER: '/character',
    MAGIC_CUT: '/magic-cut',
    FILM: '/film',
    NOTES: '/notes',
    VIP: '/vip',
  },
  useRouter: () => mockUseRouter(),
  usePointsAccountBalance: () => mockUsePointsAccountBalance(),
}));

vi.mock('@sdkwork/react-auth', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

vi.mock('@sdkwork/react-workspace', () => ({
  useWorkspaceStore: () => mockUseWorkspaceStore(),
}));

vi.mock('@sdkwork/react-notifications', () => ({
  useNotificationStore: () => mockUseNotificationStore(),
  NotificationCenter: () => null,
}));

vi.mock('@sdkwork/react-vip', () => ({
  PricingModal: () => null,
}));

vi.mock('@sdkwork/react-i18n', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('TradeHeader', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      navigate: vi.fn(),
      currentPath: '/task-market',
    });
    mockUseAuthStore.mockReturnValue({
      user: {
        name: 'Alex',
        avatar: '',
      },
      logout: vi.fn(),
    });
    mockUseWorkspaceStore.mockReturnValue({
      currentWorkspace: {
        uuid: 'workspace-1',
      },
      currentProject: {
        uuid: 'project-1',
        name: 'Project One',
      },
      setCurrentProject: vi.fn(),
      addProject: vi.fn(),
    });
    mockUseNotificationStore.mockReturnValue({
      unreadCount: 0,
    });
    mockUsePointsAccountBalance.mockReturnValue({
      pointsBalance: 2468,
      isLoading: false,
    });
    mockUseTranslation.mockReturnValue({
      t: (key: string, params?: Record<string, string>) => {
        const translations: Record<string, string> = {
          'market.nav.home': 'Home',
          'market.nav.community': 'Community',
          'market.nav.theater': 'Theater',
          'market.nav.skills': 'Skills',
          'market.nav.plugins': 'Plugins',
          'market.nav.task_market': 'Task Market',
          'market.nav.credits': `${params?.count || '0'} Credits`,
          'market.nav.my_profile': 'My Profile',
          'market.nav.my_tasks': 'My Tasks',
          'market.nav.billing_plans': 'Billing & Plans',
          'market.nav.switch_workspace': 'Switch Workspace',
          'market.nav.preferences': 'Preferences',
          'market.nav.project_name_prompt': 'Project Name',
          'market.nav.create_project': 'Create Project',
          'market.nav.settings': 'Settings',
          'market.nav.sign_out': 'Sign Out',
        };

        return translations[key] ?? key;
      },
    });
  });

  it('renders the real points balance from the points account hook', () => {
    const html = renderToStaticMarkup(<TradeHeader />);

    expect(html).toContain('2468 Credits');
    expect(html).not.toContain('880 Credits');
  });
});
