type ModelLike = {
  id: string;
};

type ModelProviderLike = {
  models: ModelLike[];
};

type SelectionIdLike = {
  id: string;
};

type SelectionValueLike = {
  value: string;
};

export function resolvePreferredModelId(
  providers: ModelProviderLike[],
  requestedId: string,
): string {
  const firstModelId = providers[0]?.models[0]?.id ?? '';
  if (!firstModelId) {
    return '';
  }

  const hasRequestedModel = providers.some((provider) =>
    provider.models.some((model) => model.id === requestedId),
  );

  return hasRequestedModel ? requestedId : firstModelId;
}

export function resolvePreferredSelectionId<T extends SelectionIdLike>(
  options: T[],
  requestedId: string,
  fallbackId = '',
): string {
  if (options.length === 0) {
    return fallbackId;
  }

  return options.some((item) => item.id === requestedId)
    ? requestedId
    : (options[0]?.id ?? fallbackId);
}

export function resolvePreferredSelectionValue<T extends SelectionValueLike>(
  options: T[],
  requestedValue: string,
  fallbackValue: string,
): string {
  if (options.length === 0) {
    return fallbackValue;
  }

  return options.some((item) => item.value === requestedValue)
    ? requestedValue
    : (options[0]?.value ?? fallbackValue);
}
