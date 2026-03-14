import type {
  PlusApiResultListMapStringObject,
  PlusApiResultMapStringObject,
  PlusApiResultVoid,
} from '@sdkwork/app-sdk';
import { getAppSdkClientWithSession } from '@sdkwork/react-core';
import type { AgentSkill, SkillCategory } from '../constants';
import { SKILL_CATEGORIES } from '../constants';

const SUCCESS_CODE = '2000';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 60;
const CATEGORY_CACHE_TTL_MS = 60_000;

type ApiResult<T = unknown> = {
  code?: string;
  msg?: string;
  data?: T;
};

export type SkillMarketTab =
  | 'featured'
  | 'trending'
  | 'opensource'
  | 'new'
  | 'premium'
  | 'free';

export interface SkillCategoryOption extends SkillCategory {
  backendId?: number;
  code?: string;
}

export interface SkillListQuery {
  tab?: SkillMarketTab;
  category?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface SkillListResult {
  items: AgentSkill[];
  total: number;
}

export interface SkillsService {
  listCategories: () => Promise<SkillCategoryOption[]>;
  listSkills: (query?: SkillListQuery) => Promise<SkillListResult>;
  listMySkills: () => Promise<AgentSkill[]>;
  getSkill: (skillId: string | number) => Promise<AgentSkill | null>;
  enableSkill: (skillId: string | number) => Promise<void>;
  disableSkill: (skillId: string | number) => Promise<void>;
}

let cachedCategories: SkillCategoryOption[] | null = null;
let categoryCacheExpiresAt = 0;

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return false;
  }
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y';
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
}

function unwrapData<T>(result: ApiResult<T>, fallbackMessage: string): T {
  const code = normalizeText(result?.code);
  if (code && code !== SUCCESS_CODE) {
    throw new Error(normalizeText(result?.msg) || fallbackMessage);
  }
  return result?.data as T;
}

function extractRecords(data: unknown): Record<string, unknown>[] {
  const direct = asRecordArray(data);
  if (direct.length > 0) {
    return direct;
  }
  const record = asRecord(data);
  const collectionKeys = ['content', 'records', 'items', 'list', 'rows', 'data'];
  for (const key of collectionKeys) {
    const value = asRecordArray(record[key]);
    if (value.length > 0) {
      return value;
    }
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const record = asRecord(data);
  const candidates = [record.totalElements, record.total, record.count];
  for (const candidate of candidates) {
    const parsed = normalizeOptionalNumber(candidate);
    if (parsed !== null) {
      return parsed;
    }
  }
  return fallback;
}

function pickText(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeText(record[key]);
    if (value) {
      return value;
    }
  }
  return '';
}

function pickNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = normalizeOptionalNumber(record[key]);
    if (value !== null) {
      return value;
    }
  }
  return fallback;
}

function resolveCategoryIdByText(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'all';
  }
  if (SKILL_CATEGORIES.some((category) => category.id === normalized)) {
    return normalized;
  }

  const categoryHints: Array<{ id: string; keywords: string[] }> = [
    { id: 'video', keywords: ['video', 'short'] },
    { id: 'image', keywords: ['image', 'photo', 'picture', 'art'] },
    { id: 'music', keywords: ['music', 'song'] },
    { id: 'audio', keywords: ['audio', 'voice', 'speech'] },
    { id: 'character', keywords: ['character', 'avatar'] },
    { id: 'productivity', keywords: ['document', 'productivity', 'office', 'text'] },
    { id: 'development', keywords: ['dev', 'code', 'plugin', 'sdk'] },
    { id: 'automation', keywords: ['auto', 'workflow'] },
    { id: 'analytics', keywords: ['analytic', 'analysis', 'report'] },
    { id: '3d', keywords: ['3d', 'model'] },
    { id: 'chatbot', keywords: ['chatbot', 'assistant', 'chat'] },
    { id: 'mindmap', keywords: ['mindmap', 'mind'] },
    { id: 'collage', keywords: ['collage'] },
  ];

  for (const hint of categoryHints) {
    if (hint.keywords.some((keyword) => normalized.includes(keyword))) {
      return hint.id;
    }
  }

  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/g, '')
    .replace(/-+$/g, '');
  return slug || 'all';
}

function buildFallbackCategories(): SkillCategoryOption[] {
  return SKILL_CATEGORIES.map((category) => ({ ...category }));
}

function mapCategoryRecord(
  record: Record<string, unknown>,
  index: number,
): SkillCategoryOption {
  const backendId = normalizeOptionalNumber(record.id);
  const code = pickText(record, ['code', 'categoryCode']);
  const name = pickText(record, ['name', 'categoryName']);
  const localId = resolveCategoryIdByText(code || name || `category-${index + 1}`);
  const base = SKILL_CATEGORIES.find((category) => category.id === localId);

  return {
    id: localId,
    label: name || base?.label || `Category ${index + 1}`,
    icon: base?.icon || SKILL_CATEGORIES[0].icon,
    description: base?.description || name || 'Skill category',
    backendId: backendId ?? undefined,
    code: code || undefined,
  };
}

function mergeCategoryOptions(
  remoteCategories: SkillCategoryOption[],
  fallbackCategories: SkillCategoryOption[],
): SkillCategoryOption[] {
  const fallbackAll = fallbackCategories.find((category) => category.id === 'all');
  const merged: SkillCategoryOption[] = [
    fallbackAll || {
      id: 'all',
      label: 'All Categories',
      icon: SKILL_CATEGORIES[0].icon,
      description: 'All skills',
    },
  ];
  const seen = new Set<string>(['all']);

  const append = (category: SkillCategoryOption): void => {
    if (!category.id || seen.has(category.id)) {
      return;
    }
    merged.push(category);
    seen.add(category.id);
  };

  remoteCategories.forEach(append);
  fallbackCategories.forEach(append);
  return merged;
}

async function listCategoryOptions(forceRefresh = false): Promise<SkillCategoryOption[]> {
  if (!forceRefresh && cachedCategories && Date.now() < categoryCacheExpiresAt) {
    return cachedCategories;
  }

  const fallbackCategories = buildFallbackCategories();

  try {
    const client = getAppSdkClientWithSession();
    const response = await client.skill.listCategories();
    const data = unwrapData<unknown>(
      response as PlusApiResultListMapStringObject,
      'Failed to load skill categories',
    );
    const records = extractRecords(data);
    const remoteCategories = records.map((record, index) => mapCategoryRecord(record, index));
    const merged = mergeCategoryOptions(remoteCategories, fallbackCategories);
    cachedCategories = merged;
    categoryCacheExpiresAt = Date.now() + CATEGORY_CACHE_TTL_MS;
    return merged;
  } catch (error) {
    console.warn('[skillsService] listCategories failed, fallback to defaults:', error);
    cachedCategories = fallbackCategories;
    categoryCacheExpiresAt = Date.now() + CATEGORY_CACHE_TTL_MS;
    return fallbackCategories;
  }
}

function resolveCategoryForSkill(
  record: Record<string, unknown>,
  categories: SkillCategoryOption[],
): SkillCategoryOption {
  const categoryId = pickNumber(record, ['categoryId'], NaN);
  if (Number.isFinite(categoryId)) {
    const byBackendId = categories.find((category) => category.backendId === categoryId);
    if (byBackendId) {
      return byBackendId;
    }
  }

  const texts = [
    pickText(record, ['categoryCode']),
    pickText(record, ['categoryName']),
    pickText(record, ['category']),
  ].filter((entry) => entry.length > 0);

  for (const text of texts) {
    const localId = resolveCategoryIdByText(text);
    const matched = categories.find((category) => category.id === localId);
    if (matched) {
      return matched;
    }
  }

  return categories.find((category) => category.id === 'all') || buildFallbackCategories()[0];
}

function normalizeCompatibility(runtime: string): string[] {
  if (!runtime) {
    return ['web'];
  }
  const parsed = runtime
    .split(/[,\s/|]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  return parsed.length > 0 ? parsed : ['web'];
}

function normalizePermissions(configSchema: unknown): string[] {
  const schema = asRecord(configSchema);
  return Object.keys(schema).slice(0, 6);
}

function mapSkillRecordToAgentSkill(
  record: Record<string, unknown>,
  categories: SkillCategoryOption[],
): AgentSkill {
  const nestedSkill = asRecord(record.skill);
  const source = Object.keys(nestedSkill).length > 0 ? nestedSkill : record;
  const category = resolveCategoryForSkill(source, categories);
  const rating = pickNumber(source, ['ratingAvg', 'rating'], 0);
  const installCount = pickNumber(source, ['installCount', 'downloads', 'users'], 0);
  const version = pickText(source, ['version']) || '1.0.0';
  const runtime = pickText(source, ['runtime']);
  const sourceType = pickText(source, ['sourceType']).toUpperCase();
  const isBuiltin = normalizeBoolean(source.builtin);
  const isVerifiedSource = sourceType === 'OFFICIAL' || sourceType === 'OPEN_SOURCE' || sourceType === 'COMMUNITY';
  const price = pickNumber(source, ['price'], 0);
  const capabilities = normalizeStringArray(source.capabilities);
  const tags = normalizeStringArray(source.tags);
  const idText = pickText(source, ['skillId', 'id', 'skillKey']);
  const stableId = idText || `skill-${Math.max(1, installCount)}`;
  const name = pickText(source, ['name']) || `Skill ${stableId}`;
  const summary = pickText(source, ['summary']);
  const description = pickText(source, ['description']) || summary || name;
  const provider = pickText(source, ['provider', 'packageName', 'sourceType']) || 'SDKWork';
  const updatedAt = pickText(source, ['updatedAt', 'latestPublishedAt', 'createdAt']) || new Date().toISOString();

  return {
    id: stableId,
    name,
    description,
    icon: category.icon,
    category: category.id,
    author: {
      name: provider,
      verified: isBuiltin || isVerifiedSource,
    },
    rating,
    users: installCount,
    downloads: installCount,
    tags,
    featured: normalizeBoolean(source.featured),
    premium: price > 0,
    capabilities: capabilities.length > 0 ? capabilities : tags,
    compatibility: normalizeCompatibility(runtime),
    updatedAt,
    version,
    size: pickText(source, ['size']),
    permissions: normalizePermissions(source.configSchema),
  };
}

function dedupeSkills(skills: AgentSkill[]): AgentSkill[] {
  const seen = new Set<string>();
  const deduped: AgentSkill[] = [];
  for (const skill of skills) {
    if (!skill.id || seen.has(skill.id)) {
      continue;
    }
    seen.add(skill.id);
    deduped.push(skill);
  }
  return deduped;
}

function applyTabFilter(skills: AgentSkill[], tab?: SkillMarketTab): AgentSkill[] {
  const items = [...skills];
  if (tab === 'featured') {
    return items.filter((skill) => skill.featured);
  }
  if (tab === 'premium') {
    return items.filter((skill) => skill.premium);
  }
  if (tab === 'free') {
    return items.filter((skill) => !skill.premium);
  }
  if (tab === 'opensource') {
    return items.filter((skill) => !skill.premium && skill.author.verified);
  }
  if (tab === 'trending') {
    return items.sort((left, right) => right.users - left.users);
  }
  if (tab === 'new') {
    return items.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }
  return items;
}

function resolveSortBy(tab?: SkillMarketTab): string {
  if (tab === 'trending') {
    return 'popular';
  }
  if (tab === 'featured') {
    return 'recommended';
  }
  return 'newest';
}

function resolveBackendCategoryId(
  category: string | undefined,
  categories: SkillCategoryOption[],
): number | undefined {
  const normalizedCategory = normalizeText(category);
  if (!normalizedCategory || normalizedCategory === 'all') {
    return undefined;
  }
  const byLocalId = categories.find((entry) => entry.id === normalizedCategory);
  if (byLocalId?.backendId !== undefined) {
    return byLocalId.backendId;
  }
  const numeric = normalizeOptionalNumber(normalizedCategory);
  return numeric ?? undefined;
}

function buildListQuery(
  query: SkillListQuery,
  categories: SkillCategoryOption[],
): Record<string, string | number> {
  const page = Math.max(DEFAULT_PAGE, Math.trunc(query.page || DEFAULT_PAGE));
  const size = Math.max(1, Math.min(200, Math.trunc(query.size || DEFAULT_PAGE_SIZE)));
  const payload: Record<string, string | number> = {
    page,
    size,
    pageNum: page,
    pageSize: size,
    sortBy: resolveSortBy(query.tab),
  };

  const keyword = normalizeText(query.keyword);
  if (keyword) {
    payload.keyword = keyword;
  }

  const backendCategoryId = resolveBackendCategoryId(query.category, categories);
  if (backendCategoryId !== undefined) {
    payload.categoryId = backendCategoryId;
  }

  return payload;
}

async function fetchSkillList(query: SkillListQuery = {}): Promise<SkillListResult> {
  const categories = await listCategoryOptions();
  const client = getAppSdkClientWithSession();
  const response = await client.skill.list(buildListQuery(query, categories));
  const data = unwrapData<unknown>(
    response as PlusApiResultListMapStringObject,
    'Failed to load skills',
  );
  const records = extractRecords(data);
  const mapped = dedupeSkills(records.map((record) => mapSkillRecordToAgentSkill(record, categories)));
  const filtered = applyTabFilter(mapped, query.tab);
  return {
    items: filtered,
    total: extractTotal(data, filtered.length),
  };
}

async function fetchSkillDetail(skillId: string | number): Promise<AgentSkill | null> {
  const categories = await listCategoryOptions();
  const client = getAppSdkClientWithSession();
  const response = await client.skill.get(skillId);
  const data = unwrapData<unknown>(
    response as PlusApiResultMapStringObject,
    'Failed to load skill detail',
  );
  const record = asRecord(data);
  if (Object.keys(record).length === 0) {
    return null;
  }
  return mapSkillRecordToAgentSkill(record, categories);
}

async function fetchMine(): Promise<AgentSkill[]> {
  const categories = await listCategoryOptions();
  const client = getAppSdkClientWithSession();
  const response = await client.skill.listMine();
  const data = unwrapData<unknown>(
    response as PlusApiResultListMapStringObject,
    'Failed to load installed skills',
  );
  const records = extractRecords(data);
  return dedupeSkills(records.map((record) => mapSkillRecordToAgentSkill(record, categories)));
}

async function enableSkill(skillId: string | number): Promise<void> {
  const client = getAppSdkClientWithSession();
  const response = await client.skill.enable(skillId);
  unwrapData<unknown>(
    response as PlusApiResultMapStringObject,
    'Failed to enable skill',
  );
}

async function disableSkill(skillId: string | number): Promise<void> {
  const client = getAppSdkClientWithSession();
  const response = await client.skill.disable(skillId);
  unwrapData<unknown>(
    response as PlusApiResultVoid,
    'Failed to disable skill',
  );
}

export const skillsService: SkillsService = {
  listCategories: async () => listCategoryOptions(),
  listSkills: async (query: SkillListQuery = {}) => fetchSkillList(query),
  listMySkills: async () => fetchMine(),
  getSkill: async (skillId: string | number) => fetchSkillDetail(skillId),
  enableSkill: async (skillId: string | number) => enableSkill(skillId),
  disableSkill: async (skillId: string | number) => disableSkill(skillId),
};
