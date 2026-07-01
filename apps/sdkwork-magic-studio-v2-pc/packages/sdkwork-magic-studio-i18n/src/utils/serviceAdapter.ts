export interface ServiceAdapterController<TAdapter extends object> {
  service: TAdapter;
  setAdapter: (adapter: TAdapter) => void;
  getAdapter: () => TAdapter;
  resetAdapter: () => void;
}

const createServiceProxy = <TAdapter extends object>(
  getAdapter: () => TAdapter
): TAdapter => {
  return new Proxy({} as TAdapter, {
    get(_target: TAdapter, property: string | symbol): unknown {
      const adapter = getAdapter();
      const value = (adapter as Record<string | symbol, unknown>)[property];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(adapter);
      }
      return value;
    }
  });
};

export const createServiceAdapterController = <TAdapter extends object>(
  localAdapter: TAdapter
): ServiceAdapterController<TAdapter> => {
  let currentAdapter = localAdapter;

  return {
    service: createServiceProxy<TAdapter>(() => currentAdapter),
    setAdapter: (adapter: TAdapter): void => {
      currentAdapter = adapter;
    },
    getAdapter: (): TAdapter => currentAdapter,
    resetAdapter: (): void => {
      currentAdapter = localAdapter;
    }
  };
};
