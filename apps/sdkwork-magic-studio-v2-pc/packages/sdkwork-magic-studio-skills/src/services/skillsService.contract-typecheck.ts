import type { AppSdkClient } from '@sdkwork/magic-studio-core/sdk';

type SkillClient = AppSdkClient['skill'];
type SkillCategoryListResponse = Awaited<ReturnType<SkillClient['listCategories']>>;
type SkillListResponse = Awaited<ReturnType<SkillClient['list']>>;
type SkillDetailResponse = Awaited<ReturnType<SkillClient['detail']>>;
type SkillMineResponse = Awaited<ReturnType<SkillClient['listMine']>>;
type SkillEnableResponse = Awaited<ReturnType<SkillClient['enable']>>;
type SkillDisableResponse = Awaited<ReturnType<SkillClient['disable']>>;

const assertSkillClientSurface = (client: SkillClient): void => {
  void client.listCategories();
  void client.list({
    page: 1,
    pageNum: 1,
    pageSize: 20,
    size: 20,
    sortBy: 'recommended',
  });
  void client.detail('skill-video-1');
  void client.listMine();
  void client.enable('skill-video-1');
  void client.disable('skill-video-1');
};

const validSkillCategoryListResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-categories-1',
  errorName: '',
  data: [
    {
      id: 12,
      code: 'video',
      name: 'Video',
    },
  ],
} satisfies SkillCategoryListResponse;

const validSkillListResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-list-1',
  errorName: '',
  data: {
    content: [
      {
        id: 'skill-video-1',
        name: 'Video Styler',
        description: 'Cinematic video skill',
      },
    ],
    totalElements: 1,
  },
} satisfies SkillListResponse;

const validSkillDetailResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-detail-1',
  errorName: '',
  data: {
    id: 'skill-video-1',
    name: 'Video Styler',
    description: 'Cinematic video skill',
  },
} satisfies SkillDetailResponse;

const validSkillMineResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-mine-1',
  errorName: '',
  data: [
    {
      userSkillId: 1,
      skillId: 12,
      enabled: true,
      skill: {
        id: 'skill-video-1',
        name: 'Video Styler',
      },
    },
  ],
} satisfies SkillMineResponse;

const validSkillEnableResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-enable-1',
  errorName: '',
  data: {
    enabled: true,
  },
} satisfies SkillEnableResponse;

const validSkillDisableResponse = {
  code: '2000',
  msg: 'ok',
  requestId: 'req-skill-disable-1',
  errorName: '',
  data: true,
} satisfies SkillDisableResponse;

void assertSkillClientSurface;
void validSkillCategoryListResponse;
void validSkillListResponse;
void validSkillDetailResponse;
void validSkillMineResponse;
void validSkillEnableResponse;
void validSkillDisableResponse;
