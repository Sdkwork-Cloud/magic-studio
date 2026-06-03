export interface DesktopShellDragRegionProps {
  'data-tauri-drag-region'?: true;
}

export const getDesktopShellDragRegionProps = (
  enabled = true,
): DesktopShellDragRegionProps => (enabled ? { 'data-tauri-drag-region': true } : {});
