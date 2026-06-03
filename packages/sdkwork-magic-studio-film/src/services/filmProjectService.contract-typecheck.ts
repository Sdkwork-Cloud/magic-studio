import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioFilmProjectCreateRequest,
  MagicStudioFilmProjectListQuery,
  MagicStudioFilmProjectUpdateRequest,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type { FilmProject } from '@sdkwork/magic-studio-types/film';

type AssertAssignable<T extends U, U> = true;

type RuntimeProjectListQuery = NonNullable<
  Parameters<MagicStudioServerClient['listFilmProjects']>[0]
>;
type RuntimeProjectList = Awaited<
  ReturnType<MagicStudioServerClient['listFilmProjects']>
>;
type RuntimeProjectCreateRequest =
  Parameters<MagicStudioServerClient['createFilmProject']>[0];
type RuntimeProjectCreateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createFilmProject']>
>;
type RuntimeProjectReadEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readFilmProject']>
>;
type RuntimeProjectUpdateRequest =
  Parameters<MagicStudioServerClient['updateFilmProject']>[1];
type RuntimeProjectUpdateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateFilmProject']>
>;
type RuntimeProjectDeleteEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteFilmProject']>
>;

const runtimeProjectListQueryMatchesServerType: AssertAssignable<
  RuntimeProjectListQuery,
  MagicStudioFilmProjectListQuery
> = true;
const runtimeProjectListMatchesServerType: AssertAssignable<
  RuntimeProjectList,
  MagicStudioApiListEnvelope<FilmProject>
> = true;
const runtimeProjectCreateRequestMatchesServerType: AssertAssignable<
  RuntimeProjectCreateRequest,
  MagicStudioFilmProjectCreateRequest
> = true;
const serverProjectCreateRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioFilmProjectCreateRequest,
  RuntimeProjectCreateRequest
> = true;
const runtimeProjectCreateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeProjectCreateEnvelope,
  MagicStudioApiEnvelope<FilmProject>
> = true;
const runtimeProjectReadEnvelopeMatchesServerType: AssertAssignable<
  RuntimeProjectReadEnvelope,
  MagicStudioApiEnvelope<FilmProject>
> = true;
const runtimeProjectUpdateRequestMatchesServerType: AssertAssignable<
  RuntimeProjectUpdateRequest,
  MagicStudioFilmProjectUpdateRequest
> = true;
const runtimeProjectUpdateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeProjectUpdateEnvelope,
  MagicStudioApiEnvelope<FilmProject>
> = true;
const runtimeProjectDeleteEnvelopeMatchesServerType: AssertAssignable<
  RuntimeProjectDeleteEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;

const validFilmProject = {
  id: 'film-project-1',
  uuid: 'film-project-1',
  createdAt: 1,
  updatedAt: 1,
  type: 'FILM_PROJECT',
  name: 'Hero Journey',
  description: 'A cinematic test project',
  status: 'DRAFT',
  input: {
    id: 'film-input-1',
    uuid: 'film-input-1',
    createdAt: 1,
    updatedAt: 1,
    type: 'FILM_USER_INPUT',
    text: 'INT. SHANGHAI ALLEY - NIGHT',
    language: 'zh-CN',
  },
  script: {
    id: 'film-script-1',
    uuid: 'film-script-1',
    createdAt: 1,
    updatedAt: 1,
    type: 'FILM_SCRIPT',
    title: 'Hero Journey',
    genres: ['sci-fi'],
    styles: ['cinematic'],
    content: 'INT. SHANGHAI ALLEY - NIGHT',
    standardized: false,
    version: '1',
  },
  characters: [],
  props: [],
  locations: [],
  scenes: [],
  shots: [],
  media: [],
  settings: {
    id: 'film-settings-1',
    uuid: 'film-settings-1',
    createdAt: 1,
    updatedAt: 1,
    theme: 'cinematic',
    aspectRatio: '16:9',
  },
} satisfies FilmProject;

const validProjectListQuery = {
  page: 1,
  size: 20,
  keyword: 'hero',
  sort: ['updatedAt,desc'],
} satisfies RuntimeProjectListQuery;

const validProjectCreateRequest = {
  project: validFilmProject,
} satisfies RuntimeProjectCreateRequest;

const validProjectUpdateRequest = {
  project: validFilmProject,
} satisfies RuntimeProjectUpdateRequest;

const validProjectResponse = {
  requestId: 'request-film-project',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validFilmProject,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeProjectCreateEnvelope;

const validProjectListResponse = {
  requestId: 'request-film-project-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validFilmProject],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeProjectList;

const validProjectDeleteResponse = {
  requestId: 'request-film-project-delete',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeProjectDeleteEnvelope;

void runtimeProjectListQueryMatchesServerType;
void runtimeProjectListMatchesServerType;
void runtimeProjectCreateRequestMatchesServerType;
void serverProjectCreateRequestMatchesRuntimeType;
void runtimeProjectCreateEnvelopeMatchesServerType;
void runtimeProjectReadEnvelopeMatchesServerType;
void runtimeProjectUpdateRequestMatchesServerType;
void runtimeProjectUpdateEnvelopeMatchesServerType;
void runtimeProjectDeleteEnvelopeMatchesServerType;
void validProjectListQuery;
void validProjectCreateRequest;
void validProjectUpdateRequest;
void validProjectResponse;
void validProjectListResponse;
void validProjectDeleteResponse;
