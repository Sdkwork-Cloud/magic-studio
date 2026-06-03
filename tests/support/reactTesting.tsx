import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach } from 'vitest';

type TextMatch = string | RegExp;

interface WaitForOptions {
  interval?: number;
  timeout?: number;
}

export interface RenderResult {
  baseElement: HTMLElement;
  container: HTMLElement;
  getByTestId: (testId: string) => HTMLElement;
  queryByTestId: (testId: string) => HTMLElement | null;
  rerender: (ui: React.ReactElement) => void;
  unmount: () => void;
}

interface MountedView {
  container: HTMLElement;
  root: Root;
}

const mountedViews = new Set<MountedView>();

const ensureReactActEnvironment = () => {
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = true;
};

const normalizeText = (value: string | null | undefined): string =>
  String(value ?? '').replace(/\s+/g, ' ').trim();

const matchesText = (value: string | null | undefined, matcher: TextMatch): boolean => {
  const normalized = normalizeText(value);
  return typeof matcher === 'string' ? normalized === matcher : matcher.test(normalized);
};

const queryAllElements = (container: ParentNode): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('*'));

const queryByTestId = (testId: string, container: ParentNode = document.body): HTMLElement | null =>
  queryAllElements(container).find((element) => element.dataset.testid === testId) ?? null;

const getByTestId = (testId: string, container: ParentNode = document.body): HTMLElement => {
  const element = queryByTestId(testId, container);
  if (!element) {
    throw new Error(`Unable to find an element by data-testid="${testId}".`);
  }
  return element;
};

const queryAllByText = (
  matcher: TextMatch,
  container: ParentNode = document.body
): HTMLElement[] =>
  queryAllElements(container).filter((element) => {
    if (!matchesText(element.textContent, matcher)) {
      return false;
    }

    return !Array.from(element.children).some((child) =>
      matchesText(child.textContent, matcher)
    );
  });

const getAllByText = (
  matcher: TextMatch,
  container: ParentNode = document.body
): HTMLElement[] => {
  const elements = queryAllByText(matcher, container);
  if (elements.length === 0) {
    throw new Error(`Unable to find elements with text: ${String(matcher)}.`);
  }
  return elements;
};

const queryAllByPlaceholderText = (
  matcher: TextMatch,
  container: ParentNode = document.body
): HTMLElement[] =>
  queryAllElements(container).filter((element) =>
    matchesText(element.getAttribute('placeholder'), matcher)
  );

const getByPlaceholderText = (
  matcher: TextMatch,
  container: ParentNode = document.body
): HTMLElement => {
  const element = queryAllByPlaceholderText(matcher, container)[0];
  if (!element) {
    throw new Error(`Unable to find an element with placeholder: ${String(matcher)}.`);
  }
  return element;
};

export const act = React.act;

export const waitFor = <T,>(
  callback: () => T | Promise<T>,
  options?: WaitForOptions
): Promise<T> => {
  const timeout = options?.timeout ?? 1000;
  const interval = options?.interval ?? 20;
  const deadline = Date.now() + timeout;

  const poll = async (): Promise<T> => {
    await React.act(async () => {
      await Promise.resolve();
    });

    try {
      return await callback();
    } catch (error) {
      if (Date.now() >= deadline) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      return poll();
    }
  };

  return poll();
};

export const cleanup = () => {
  ensureReactActEnvironment();

  for (const view of Array.from(mountedViews)) {
    React.act(() => {
      view.root.unmount();
    });
    view.container.remove();
    mountedViews.delete(view);
  }
};

export const render = (ui: React.ReactElement): RenderResult => {
  ensureReactActEnvironment();

  const container = document.createElement('div');
  document.body.appendChild(container);

  const mountedView: MountedView = {
    container,
    root: createRoot(container),
  };
  mountedViews.add(mountedView);

  React.act(() => {
    mountedView.root.render(ui);
  });

  return {
    baseElement: document.body,
    container,
    getByTestId: (testId) => getByTestId(testId, container),
    queryByTestId: (testId) => queryByTestId(testId, container),
    rerender: (nextUi) => {
      ensureReactActEnvironment();
      React.act(() => {
        mountedView.root.render(nextUi);
      });
    },
    unmount: () => {
      if (!mountedViews.has(mountedView)) {
        return;
      }

      React.act(() => {
        mountedView.root.unmount();
      });
      container.remove();
      mountedViews.delete(mountedView);
    },
  };
};

export const screen = {
  findByPlaceholderText: async (matcher: TextMatch, options?: WaitForOptions) =>
    waitFor(() => getByPlaceholderText(matcher), options),
  getAllByText,
  getByPlaceholderText,
  getByTestId,
  queryByTestId,
};

afterEach(() => {
  cleanup();
});
