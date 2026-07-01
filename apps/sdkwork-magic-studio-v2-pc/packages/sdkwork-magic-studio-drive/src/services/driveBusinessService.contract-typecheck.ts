import type {
  DriveFileContent,
  DriveItem,
  DriveRootDescriptor,
  DriveStats,
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioDriveCreateFolderRequest,
  MagicStudioDriveDeleteRequest,
  MagicStudioDriveEntriesQuery,
  MagicStudioDriveFavoriteRequest,
  MagicStudioDriveImportFileRequest,
  MagicStudioDriveMoveRequest,
  MagicStudioDriveRenameRequest,
  MagicStudioDriveRestoreRequest,
  MagicStudioDriveUpdateFileContentRequest,
  MagicStudioDriveUploadFileRequest,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeRootEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readDriveRoot']>
>;
type RuntimeEntriesQuery = NonNullable<
  Parameters<MagicStudioServerClient['listDriveEntries']>[0]
>;
type RuntimeEntryList = Awaited<
  ReturnType<MagicStudioServerClient['listDriveEntries']>
>;
type RuntimeStatsEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readDriveStats']>
>;
type RuntimeFileContentEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readDriveFileContent']>
>;
type RuntimeUpdateFileContentRequest =
  Parameters<MagicStudioServerClient['updateDriveFileContent']>[1];
type RuntimeUpdateFileContentEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateDriveFileContent']>
>;
type RuntimeCreateFolderRequest =
  Parameters<MagicStudioServerClient['createDriveFolder']>[0];
type RuntimeCreateFolderEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createDriveFolder']>
>;
type RuntimeUploadFileRequest =
  Parameters<MagicStudioServerClient['uploadDriveFile']>[0];
type RuntimeUploadFileEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['uploadDriveFile']>
>;
type RuntimeImportFileRequest =
  Parameters<MagicStudioServerClient['importDriveFile']>[0];
type RuntimeImportFileEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['importDriveFile']>
>;
type RuntimeRenameRequest =
  Parameters<MagicStudioServerClient['renameDriveItem']>[0];
type RuntimeRenameEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['renameDriveItem']>
>;
type RuntimeMoveRequest =
  Parameters<MagicStudioServerClient['moveDriveItems']>[0];
type RuntimeMoveEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['moveDriveItems']>
>;
type RuntimeDeleteRequest =
  Parameters<MagicStudioServerClient['deleteDriveItems']>[0];
type RuntimeDeleteEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteDriveItems']>
>;
type RuntimeRestoreRequest =
  Parameters<MagicStudioServerClient['restoreDriveItems']>[0];
type RuntimeRestoreEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['restoreDriveItems']>
>;
type RuntimeEmptyTrashEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['emptyDriveTrash']>
>;
type RuntimeFavoriteRequest =
  Parameters<MagicStudioServerClient['favoriteDriveItem']>[0];
type RuntimeFavoriteEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['favoriteDriveItem']>
>;

const runtimeRootEnvelopeMatchesServerType: AssertAssignable<
  RuntimeRootEnvelope,
  MagicStudioApiEnvelope<DriveRootDescriptor>
> = true;
const runtimeEntriesQueryMatchesServerType: AssertAssignable<
  RuntimeEntriesQuery,
  MagicStudioDriveEntriesQuery
> = true;
const runtimeEntryListMatchesServerType: AssertAssignable<
  RuntimeEntryList,
  MagicStudioApiListEnvelope<DriveItem>
> = true;
const runtimeStatsEnvelopeMatchesServerType: AssertAssignable<
  RuntimeStatsEnvelope,
  MagicStudioApiEnvelope<DriveStats>
> = true;
const runtimeFileContentEnvelopeMatchesServerType: AssertAssignable<
  RuntimeFileContentEnvelope,
  MagicStudioApiEnvelope<DriveFileContent>
> = true;
const runtimeUpdateFileContentRequestMatchesServerType: AssertAssignable<
  RuntimeUpdateFileContentRequest,
  MagicStudioDriveUpdateFileContentRequest
> = true;
const serverUpdateFileContentRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioDriveUpdateFileContentRequest,
  RuntimeUpdateFileContentRequest
> = true;
const runtimeUpdateFileContentEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpdateFileContentEnvelope,
  MagicStudioApiEnvelope<DriveFileContent>
> = true;
const runtimeCreateFolderRequestMatchesServerType: AssertAssignable<
  RuntimeCreateFolderRequest,
  MagicStudioDriveCreateFolderRequest
> = true;
const serverCreateFolderRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioDriveCreateFolderRequest,
  RuntimeCreateFolderRequest
> = true;
const runtimeCreateFolderEnvelopeMatchesServerType: AssertAssignable<
  RuntimeCreateFolderEnvelope,
  MagicStudioApiEnvelope<DriveItem>
> = true;
const runtimeUploadFileRequestMatchesServerType: AssertAssignable<
  RuntimeUploadFileRequest,
  MagicStudioDriveUploadFileRequest
> = true;
const runtimeUploadFileEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUploadFileEnvelope,
  MagicStudioApiEnvelope<DriveItem>
> = true;
const runtimeImportFileRequestMatchesServerType: AssertAssignable<
  RuntimeImportFileRequest,
  MagicStudioDriveImportFileRequest
> = true;
const runtimeImportFileEnvelopeMatchesServerType: AssertAssignable<
  RuntimeImportFileEnvelope,
  MagicStudioApiEnvelope<DriveItem>
> = true;
const runtimeRenameRequestMatchesServerType: AssertAssignable<
  RuntimeRenameRequest,
  MagicStudioDriveRenameRequest
> = true;
const runtimeRenameEnvelopeMatchesServerType: AssertAssignable<
  RuntimeRenameEnvelope,
  MagicStudioApiEnvelope<DriveItem>
> = true;
const runtimeMoveRequestMatchesServerType: AssertAssignable<
  RuntimeMoveRequest,
  MagicStudioDriveMoveRequest
> = true;
const runtimeMoveEnvelopeMatchesServerType: AssertAssignable<
  RuntimeMoveEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeDeleteRequestMatchesServerType: AssertAssignable<
  RuntimeDeleteRequest,
  MagicStudioDriveDeleteRequest
> = true;
const runtimeDeleteEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDeleteEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeRestoreRequestMatchesServerType: AssertAssignable<
  RuntimeRestoreRequest,
  MagicStudioDriveRestoreRequest
> = true;
const runtimeRestoreEnvelopeMatchesServerType: AssertAssignable<
  RuntimeRestoreEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeEmptyTrashEnvelopeMatchesServerType: AssertAssignable<
  RuntimeEmptyTrashEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeFavoriteRequestMatchesServerType: AssertAssignable<
  RuntimeFavoriteRequest,
  MagicStudioDriveFavoriteRequest
> = true;
const runtimeFavoriteEnvelopeMatchesServerType: AssertAssignable<
  RuntimeFavoriteEnvelope,
  MagicStudioApiEnvelope<DriveItem>
> = true;

const validDriveRoot = {
  rootPath: '/',
  defaultScope: 'my-drive',
  scopes: ['my-drive', 'starred', 'recent', 'trash'],
} satisfies DriveRootDescriptor;

const validDriveItem = {
  id: 'file-1',
  parentId: 'folder-root',
  name: 'poster.png',
  kind: 'file',
  path: '/poster.png',
  size: 1024,
  mimeType: 'image/png',
  extension: '.png',
  status: 'active',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  accessedAt: '2026-04-25T00:02:00.000Z',
  trashedAt: null,
  isFavorite: false,
  hasChildren: false,
} satisfies DriveItem;

const validDriveStats = {
  usedBytes: 1024,
  totalBytes: 4096,
  fileCount: 1,
  folderCount: 1,
  trashedCount: 0,
  favoriteCount: 0,
} satisfies DriveStats;

const validDriveContent = {
  itemId: validDriveItem.id,
  mimeType: validDriveItem.mimeType,
  encoding: 'utf-8',
  content: '# Launch concepts',
  updatedAt: '2026-04-25T00:03:00.000Z',
} satisfies DriveFileContent;

const validEntriesQuery = {
  scope: 'my-drive',
  parentPath: '/',
  keyword: 'poster',
} satisfies RuntimeEntriesQuery;

const validCreateFolderRequest = {
  name: 'concepts',
  parentPath: '/',
} satisfies RuntimeCreateFolderRequest;

const validUploadFileRequest = {
  name: validDriveItem.name,
  content: 'cG9zdGVyLWJ5dGVz',
  encoding: 'base64',
  parentPath: '/',
  mimeType: validDriveItem.mimeType,
} satisfies RuntimeUploadFileRequest;

const validImportFileRequest = {
  sourcePath: '/tmp/poster.png',
  name: validDriveItem.name,
  parentPath: '/',
  mimeType: validDriveItem.mimeType,
} satisfies RuntimeImportFileRequest;

const validUpdateFileContentRequest = {
  content: validDriveContent.content,
  encoding: 'utf-8',
} satisfies RuntimeUpdateFileContentRequest;

const validRenameRequest = {
  itemId: validDriveItem.id,
  name: 'poster-final.png',
} satisfies RuntimeRenameRequest;

const validMoveRequest = {
  itemIds: [validDriveItem.id],
  targetParentPath: '/archive',
} satisfies RuntimeMoveRequest;

const validDeleteRequest = {
  itemIds: [validDriveItem.id],
} satisfies RuntimeDeleteRequest;

const validRestoreRequest = {
  itemIds: [validDriveItem.id],
} satisfies RuntimeRestoreRequest;

const validFavoriteRequest = {
  itemId: validDriveItem.id,
  isFavorite: true,
} satisfies RuntimeFavoriteRequest;

const validOperationOk = {
  ok: true,
} satisfies MagicStudioOperationOkResult;

const validRootResponse = {
  requestId: 'request-drive-root',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validDriveRoot,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeRootEnvelope;

const validEntryListResponse = {
  requestId: 'request-drive-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validDriveItem],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeEntryList;

const validStatsResponse = {
  requestId: 'request-drive-stats',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validDriveStats,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeStatsEnvelope;

const validContentResponse = {
  requestId: 'request-drive-content',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validDriveContent,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeFileContentEnvelope;

const validDriveItemResponse = {
  requestId: 'request-drive-item',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validDriveItem,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeCreateFolderEnvelope;

const validOperationResponse = {
  requestId: 'request-drive-operation',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validOperationOk,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeMoveEnvelope;

void runtimeRootEnvelopeMatchesServerType;
void runtimeEntriesQueryMatchesServerType;
void runtimeEntryListMatchesServerType;
void runtimeStatsEnvelopeMatchesServerType;
void runtimeFileContentEnvelopeMatchesServerType;
void runtimeUpdateFileContentRequestMatchesServerType;
void serverUpdateFileContentRequestMatchesRuntimeType;
void runtimeUpdateFileContentEnvelopeMatchesServerType;
void runtimeCreateFolderRequestMatchesServerType;
void serverCreateFolderRequestMatchesRuntimeType;
void runtimeCreateFolderEnvelopeMatchesServerType;
void runtimeUploadFileRequestMatchesServerType;
void runtimeUploadFileEnvelopeMatchesServerType;
void runtimeImportFileRequestMatchesServerType;
void runtimeImportFileEnvelopeMatchesServerType;
void runtimeRenameRequestMatchesServerType;
void runtimeRenameEnvelopeMatchesServerType;
void runtimeMoveRequestMatchesServerType;
void runtimeMoveEnvelopeMatchesServerType;
void runtimeDeleteRequestMatchesServerType;
void runtimeDeleteEnvelopeMatchesServerType;
void runtimeRestoreRequestMatchesServerType;
void runtimeRestoreEnvelopeMatchesServerType;
void runtimeEmptyTrashEnvelopeMatchesServerType;
void runtimeFavoriteRequestMatchesServerType;
void runtimeFavoriteEnvelopeMatchesServerType;
void validEntriesQuery;
void validCreateFolderRequest;
void validUploadFileRequest;
void validImportFileRequest;
void validUpdateFileContentRequest;
void validRenameRequest;
void validMoveRequest;
void validDeleteRequest;
void validRestoreRequest;
void validFavoriteRequest;
void validRootResponse;
void validEntryListResponse;
void validStatsResponse;
void validContentResponse;
void validDriveItemResponse;
void validOperationResponse;
