import type {
  MagicStudioApiListEnvelope,
  MagicStudioGenerationTask,
  MagicStudioGenerationTaskListQuery,
  MagicStudioServerClient,
  MagicStudioSfxCategory,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeSfxCategoryList = Awaited<
  ReturnType<MagicStudioServerClient['listSfxGenerationCategories']>
>;
type RuntimeSfxTaskListQuery = NonNullable<
  Parameters<MagicStudioServerClient['listSfxGenerationTasks']>[0]
>;
type RuntimeSfxTaskList = Awaited<
  ReturnType<MagicStudioServerClient['listSfxGenerationTasks']>
>;

const runtimeSfxCategoryListMatchesServerType: AssertAssignable<
  RuntimeSfxCategoryList,
  MagicStudioApiListEnvelope<MagicStudioSfxCategory>
> = true;
const runtimeSfxTaskListQueryMatchesServerType: AssertAssignable<
  RuntimeSfxTaskListQuery,
  MagicStudioGenerationTaskListQuery
> = true;
const runtimeSfxTaskListMatchesServerType: AssertAssignable<
  RuntimeSfxTaskList,
  MagicStudioApiListEnvelope<MagicStudioGenerationTask>
> = true;

const validSfxCategory = {
  id: 'whoosh',
  label: 'Whoosh',
  description: 'Motion and transition effects',
} satisfies MagicStudioSfxCategory;

const validSfxCategoriesResponse = {
  requestId: 'request-sfx-categories',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validSfxCategory],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeSfxCategoryList;

const validSfxTaskListQuery = {
  product: 'sfx',
  page: 1,
  pageSize: 20,
} satisfies RuntimeSfxTaskListQuery;

void runtimeSfxCategoryListMatchesServerType;
void runtimeSfxTaskListQueryMatchesServerType;
void runtimeSfxTaskListMatchesServerType;
void validSfxCategoriesResponse;
void validSfxTaskListQuery;
