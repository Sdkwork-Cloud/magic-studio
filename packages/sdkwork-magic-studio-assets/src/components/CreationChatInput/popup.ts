export interface PopupOptions {
  appendTo?: () => HTMLElement;
  content: HTMLElement;
  getReferenceClientRect?: (() => DOMRect | ClientRect | null) | null;
  showOnCreate?: boolean;
}

export interface PopupInstance {
  destroy: () => void;
  hide: () => void;
  setProps: (nextOptions: Partial<PopupOptions>) => void;
}

const createNoopInstance = (): PopupInstance => ({
  destroy: () => {},
  hide: () => {},
  setProps: () => {},
});

const positionPopup = (
  container: HTMLDivElement,
  getReferenceClientRect?: (() => DOMRect | ClientRect | null) | null,
) => {
  const rect = getReferenceClientRect?.();
  if (!rect) {
    return;
  }

  container.style.left = `${Math.max(8, rect.left)}px`;
  container.style.top = `${Math.max(8, rect.bottom + 8)}px`;
};

const attachContent = (container: HTMLDivElement, content: HTMLElement) => {
  if (content.parentElement !== container) {
    container.replaceChildren(content);
  }
};

const detachContent = (container: HTMLDivElement, content: HTMLElement) => {
  if (content.parentElement === container) {
    container.removeChild(content);
  }
};

const createPopupContainer = () => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.zIndex = '9999';
  container.style.pointerEvents = 'auto';
  return container;
};

export default function createPopup(
  _target: string | Element,
  options: PopupOptions,
): [PopupInstance] {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return [createNoopInstance()];
  }

  const container = createPopupContainer();
  const parent = options.appendTo?.() ?? document.body;
  parent.appendChild(container);

  let currentOptions: PopupOptions = { ...options };
  attachContent(container, currentOptions.content);
  positionPopup(container, currentOptions.getReferenceClientRect);

  if (currentOptions.showOnCreate === false) {
    container.style.display = 'none';
  }

  const syncPosition = () => {
    attachContent(container, currentOptions.content);
    positionPopup(container, currentOptions.getReferenceClientRect);
  };

  const handleViewportChange = () => {
    if (container.style.display !== 'none') {
      syncPosition();
    }
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, true);

  const instance: PopupInstance = {
    destroy: () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      detachContent(container, currentOptions.content);
      container.remove();
    },
    hide: () => {
      container.style.display = 'none';
    },
    setProps: (nextOptions) => {
      currentOptions = { ...currentOptions, ...nextOptions };
      container.style.display = 'block';
      syncPosition();
    },
  };

  return [instance];
}
