export {
  clipboardService,
  setClipboardServiceAdapter,
  getClipboardServiceAdapter,
  resetClipboardServiceAdapter,
  type ClipboardServiceAdapter
} from './clipboardService.ts';
export {
  uploadRuntimeService,
  setUploadRuntimeServiceAdapter,
  getUploadRuntimeServiceAdapter,
  resetUploadRuntimeServiceAdapter,
  type UploadRuntimeServiceAdapter,
  type UploadRuntimeSelection,
} from './uploadRuntimeService.ts';
export {
  readWindowPlatformRuntime,
  readWindowPlatformRuntimeKind,
  isBrowserHostedWindowPlatformRuntime,
  isBrowserHostedWindowPlatformRuntimeKind,
  isDesktopWindowPlatformRuntime,
  isDesktopWindowPlatformRuntimeKind,
  type WindowPlatformRuntimeKind,
} from './runtimeGlobal.ts';
export {
  windowControlService,
  setWindowControlServiceAdapter,
  getWindowControlServiceAdapter,
  resetWindowControlServiceAdapter,
  type WindowControlServiceAdapter
} from './windowControlService.ts';
