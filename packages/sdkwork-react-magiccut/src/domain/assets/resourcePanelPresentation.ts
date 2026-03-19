export type ResourcePanelViewMode = 'grid' | 'list';

export function getResourcePanelLayoutClass(viewMode: ResourcePanelViewMode): string {
  return [
    'grid',
    viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-4',
    'gap-2',
    'content-start',
    'pb-10',
    'px-2',
  ].join(' ');
}

export function getResourceCardFrameClass(
  viewMode: ResourcePanelViewMode,
  variant: 'visual' | 'tile' = 'visual'
): string {
  if (viewMode === 'list') {
    return variant === 'visual' ? 'h-24' : 'h-20';
  }

  return variant === 'visual' ? 'aspect-[16/9]' : 'aspect-square';
}
