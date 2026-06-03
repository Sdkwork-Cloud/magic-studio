import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioAssetImportFileRequest,
  MagicStudioProjectCreateRequest,
  MagicStudioWorkspaceCreateRequest,
  MagicStudioWorkspaceUpdateRequest,
  MagicStudioServerClient,
  StudioProject,
  StudioWorkspace,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeWorkspaceList = Awaited<
  ReturnType<MagicStudioServerClient['listWorkspaces']>
>;
type RuntimeWorkspaceCreateRequest =
  Parameters<MagicStudioServerClient['createWorkspace']>[0];
type RuntimeWorkspaceCreateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createWorkspace']>
>;
type RuntimeWorkspaceUpdateRequest =
  Parameters<MagicStudioServerClient['updateWorkspace']>[1];
type RuntimeWorkspaceUpdateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateWorkspace']>
>;
type RuntimeProjectCreateRequest =
  Parameters<MagicStudioServerClient['createWorkspaceProject']>[1];
type RuntimeProjectCreateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createWorkspaceProject']>
>;
type RuntimeProjectList = Awaited<
  ReturnType<MagicStudioServerClient['listWorkspaceProjects']>
>;
type RuntimeAssetImportRequest =
  Parameters<MagicStudioServerClient['importAssetFile']>[0];
type RuntimeAssetImportEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['importAssetFile']>
>;

const runtimeWorkspaceListMatchesServerType: AssertAssignable<
  RuntimeWorkspaceList,
  MagicStudioApiListEnvelope<StudioWorkspace>
> = true;
const runtimeWorkspaceCreateRequestMatchesServerType: AssertAssignable<
  RuntimeWorkspaceCreateRequest,
  MagicStudioWorkspaceCreateRequest
> = true;
const serverWorkspaceCreateRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioWorkspaceCreateRequest,
  RuntimeWorkspaceCreateRequest
> = true;
const runtimeWorkspaceCreateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeWorkspaceCreateEnvelope,
  MagicStudioApiEnvelope<StudioWorkspace>
> = true;
const runtimeWorkspaceUpdateRequestMatchesServerType: AssertAssignable<
  RuntimeWorkspaceUpdateRequest,
  MagicStudioWorkspaceUpdateRequest
> = true;
const runtimeWorkspaceUpdateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeWorkspaceUpdateEnvelope,
  MagicStudioApiEnvelope<StudioWorkspace>
> = true;
const runtimeProjectCreateRequestMatchesServerType: AssertAssignable<
  RuntimeProjectCreateRequest,
  MagicStudioProjectCreateRequest
> = true;
const runtimeProjectCreateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeProjectCreateEnvelope,
  MagicStudioApiEnvelope<StudioProject>
> = true;
const runtimeProjectListMatchesServerType: AssertAssignable<
  RuntimeProjectList,
  MagicStudioApiListEnvelope<StudioProject>
> = true;
const runtimeAssetImportRequestMatchesServerType: AssertAssignable<
  RuntimeAssetImportRequest,
  MagicStudioAssetImportFileRequest
> = true;
const runtimeAssetImportEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAssetImportEnvelope,
  MagicStudioApiEnvelope<UnifiedDigitalAsset>
> = true;

const validWorkspace = {
  id: 'workspace-1',
  uuid: 'client-entity:workspace-1',
  name: 'Creative Lab',
  description: 'Workspace for image, video, and audio projects.',
  icon: 'https://cdn.example.com/workspaces/creative-lab.png',
  projects: [],
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies StudioWorkspace;

const validProject = {
  id: 'project-1',
  uuid: 'client-entity:project-1',
  workspaceId: validWorkspace.id,
  name: 'Launch Film',
  description: 'Generate launch assets',
  type: 'FILM',
  thumbnailUrl:
    'assets://workspaces/workspace-1/projects/project-1/media/originals/image/project-cover.png',
  archivedAt: null,
  lastOpenedAt: null,
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies StudioProject;

const validWorkspaceCreateRequest = {
  name: 'Creative Lab',
  description: 'Workspace for image, video, and audio projects.',
  icon: 'https://cdn.example.com/workspaces/creative-lab.png',
} satisfies RuntimeWorkspaceCreateRequest;

const validWorkspaceUpdateRequest = {
  name: 'Creative Lab Updated',
  description: 'Updated description',
  icon: 'https://cdn.example.com/workspaces/creative-lab-updated.png',
} satisfies RuntimeWorkspaceUpdateRequest;

const validProjectCreateRequest = {
  name: 'Launch Film',
  description: 'Generate launch assets',
  type: 'FILM',
  thumbnailUrl: validProject.thumbnailUrl,
} satisfies RuntimeProjectCreateRequest;

const validAssetImportRequest = {
  scope: {
    workspaceId: validWorkspace.id,
    domain: 'asset-center',
  },
  type: 'image',
  sourcePath: '/tmp/workspace-project-cover.png',
  name: 'project-cover.png',
  metadata: {
    source: 'workspace-project-cover',
  },
} satisfies RuntimeAssetImportRequest;

const validImportedAsset = {
  id: 'asset-db-1',
  uuid: 'asset-uuid-1',
  assetId: 'asset-1',
  key: 'workspace-project-cover',
  title: 'project-cover.png',
  primaryType: 'image',
  payload: {
    assets: [],
  },
  scope: validAssetImportRequest.scope,
  storage: {
    mode: 'hybrid',
    primary: {
      protocol: 'assets',
      uri: validProject.thumbnailUrl,
    },
    cacheable: true,
  },
  status: 'ready',
  versionInfo: {
    version: 1,
  },
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
} satisfies UnifiedDigitalAsset;

const validWorkspaceListResponse = {
  requestId: 'request-workspace-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validWorkspace],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeWorkspaceList;

const validProjectListResponse = {
  requestId: 'request-project-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validProject],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeProjectList;

const validWorkspaceResponse = {
  requestId: 'request-workspace-create',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validWorkspace,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeWorkspaceCreateEnvelope;

const validProjectResponse = {
  requestId: 'request-project-create',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validProject,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeProjectCreateEnvelope;

const validAssetImportResponse = {
  requestId: 'request-asset-import',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validImportedAsset,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeAssetImportEnvelope;

void runtimeWorkspaceListMatchesServerType;
void runtimeWorkspaceCreateRequestMatchesServerType;
void serverWorkspaceCreateRequestMatchesRuntimeType;
void runtimeWorkspaceCreateEnvelopeMatchesServerType;
void runtimeWorkspaceUpdateRequestMatchesServerType;
void runtimeWorkspaceUpdateEnvelopeMatchesServerType;
void runtimeProjectCreateRequestMatchesServerType;
void runtimeProjectCreateEnvelopeMatchesServerType;
void runtimeProjectListMatchesServerType;
void runtimeAssetImportRequestMatchesServerType;
void runtimeAssetImportEnvelopeMatchesServerType;
void validWorkspaceCreateRequest;
void validWorkspaceUpdateRequest;
void validProjectCreateRequest;
void validWorkspaceListResponse;
void validProjectListResponse;
void validWorkspaceResponse;
void validProjectResponse;
void validAssetImportResponse;
