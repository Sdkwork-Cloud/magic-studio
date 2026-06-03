import {
    createRuntimeMagicStudioServerClient,
    isMagicStudioServerRuntimeSupported,
    readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
    isMagicStudioServerClientError,
    isMagicStudioServerResourceNotFoundError,
    type MagicStudioPresentationCreateRequest,
    type MagicStudioPresentationsListQuery,
    type MagicStudioPresentationSlideCreateRequest,
    type MagicStudioPresentationSlideUpdateRequest,
    type MagicStudioPresentationUpdateRequest,
    type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import { Result, type ServiceResult } from '@sdkwork/magic-studio-types/service';

import type {
    Presentation,
    PresentationSettings,
    Slide,
    SlideElement,
    SlideLayout,
    SlideTheme,
} from '../entities';
import {
    createPresentationDraft,
    normalizePresentation,
    normalizePresentationSlide,
} from './presentationIdentity';

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_PRESENTATION_TITLE = 'Untitled Presentation';
const PRESENTATION_NOT_FOUND_CODES = ['APP_PRESENTATION_NOT_FOUND'] as const;
const SUPPORTED_THEMES = new Set<SlideTheme>([
    'modern',
    'classic',
    'dark',
    'vibrant',
    'minimal',
    'corporate',
]);
const SUPPORTED_LAYOUTS = new Set<SlideLayout>([
    'title',
    'bullet-points',
    'image-left',
    'image-right',
    'two-column',
    'blank',
    'title-content',
    'comparison',
]);
const SUPPORTED_ASPECT_RATIOS = new Set<NonNullable<PresentationSettings['aspectRatio']>>([
    '16:9',
    '4:3',
    '1:1',
]);

type PresentationServerClient = Pick<
    MagicStudioServerClient,
    | 'listPresentations'
    | 'createPresentation'
    | 'readPresentation'
    | 'updatePresentation'
    | 'deletePresentation'
    | 'createPresentationSlide'
    | 'updatePresentationSlide'
>;

export interface ChatPPTServiceOptions {
    serverClient?: PresentationServerClient;
}

function readText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown): string | undefined {
    const text = readText(value);
    return text || undefined;
}

function readPositiveInteger(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.trunc(value);
    }
    return fallback;
}

function normalizePageRequest(
    pageRequest?: PageRequest,
): Required<Pick<PageRequest, 'page' | 'size'>> {
    return {
        page: Math.max(0, pageRequest?.page ?? 0),
        size: Math.max(1, pageRequest?.size ?? DEFAULT_PAGE_SIZE),
    };
}

function toPage<T>(
    items: T[],
    meta: {
        page?: number;
        pageSize?: number;
        total?: number;
    },
    pageRequest?: PageRequest,
): Page<T> {
    const fallback = normalizePageRequest(pageRequest);
    const pageSize = readPositiveInteger(meta.pageSize, fallback.size);
    const page = Math.max(0, readPositiveInteger(meta.page, fallback.page + 1) - 1);
    const totalElements = readPositiveInteger(meta.total, items.length);
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / pageSize);

    return {
        content: items,
        pageable: {
            pageNumber: page,
            pageSize,
            offset: page * pageSize,
            paged: true,
            unpaged: false,
            sort: { sorted: true, unsorted: false, empty: false },
        },
        last: totalPages === 0 ? true : page >= totalPages - 1,
        totalPages,
        totalElements,
        size: pageSize,
        number: page,
        sort: { sorted: true, unsorted: false, empty: false },
        first: page === 0,
        numberOfElements: items.length,
        empty: items.length === 0,
    };
}

function toErrorMessage(error: unknown, fallback: string): string {
    if (isMagicStudioServerClientError(error)) {
        return error.message || error.detail || fallback;
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
        return error;
    }
    return fallback;
}

function isNotFoundError(error: unknown): boolean {
    return isMagicStudioServerResourceNotFoundError(error, PRESENTATION_NOT_FOUND_CODES);
}

function normalizeTheme(value: unknown, fallback: SlideTheme = 'modern'): SlideTheme {
    const theme = readText(value) as SlideTheme;
    return SUPPORTED_THEMES.has(theme) ? theme : fallback;
}

function normalizeLayout(value: unknown, fallback: SlideLayout = 'bullet-points'): SlideLayout {
    const layout = readText(value) as SlideLayout;
    return SUPPORTED_LAYOUTS.has(layout) ? layout : fallback;
}

function normalizeAspectRatio(value: unknown): PresentationSettings['aspectRatio'] {
    const aspectRatio = readText(value) as NonNullable<PresentationSettings['aspectRatio']>;
    return SUPPORTED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : undefined;
}

function normalizeElements(value: SlideElement[] | undefined): Slide['elements'] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.map((element) => ({
        ...element,
        id: readOptionalText(element.id) ?? null,
        uuid: readText(element.uuid),
        type: element.type,
        content: element.content,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        style: element.style,
    }));
}

function normalizeSlides(value: Presentation['slides'] | undefined): Presentation['slides'] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.map((slide) =>
        normalizePresentationSlide({
            ...slide,
            id: readOptionalText(slide.id) ?? null,
            uuid: readText(slide.uuid),
            title: readText(slide.title) || 'Untitled Slide',
            notes: readOptionalText(slide.notes),
            layout: normalizeLayout(slide.layout),
            elements: (normalizeElements(slide.elements) || []).map((element) => ({
                ...element,
                id: element.id ?? null,
                uuid: element.uuid,
            })),
            backgroundColor: readOptionalText(slide.backgroundColor),
            backgroundImage: readOptionalText(slide.backgroundImage),
            transition: readOptionalText(slide.transition),
        }),
    );
}

function toListQuery(pageRequest?: PageRequest): MagicStudioPresentationsListQuery {
    const normalized = normalizePageRequest(pageRequest);
    return {
        keyword: readOptionalText(pageRequest?.keyword),
        page: normalized.page + 1,
        pageSize: normalized.size,
    };
}

function toCreateRequest(title: string): MagicStudioPresentationCreateRequest {
    return {
        title: readText(title) || FALLBACK_PRESENTATION_TITLE,
    };
}

function toUpdateRequest(entity: Partial<Presentation>): MagicStudioPresentationUpdateRequest | null {
    const payload: MagicStudioPresentationUpdateRequest = {};

    if (entity.title !== undefined) {
        payload.title = readText(entity.title) || FALLBACK_PRESENTATION_TITLE;
    }

    if (entity.theme !== undefined) {
        payload.theme = normalizeTheme(entity.theme);
    }

    if (entity.settings !== undefined) {
        payload.settings = {
            aspectRatio: normalizeAspectRatio(entity.settings?.aspectRatio),
            defaultFont: readOptionalText(entity.settings?.defaultFont),
            primaryColor: readOptionalText(entity.settings?.primaryColor),
            secondaryColor: readOptionalText(entity.settings?.secondaryColor),
        };
    }

    if (entity.slides !== undefined) {
        payload.slides = normalizeSlides(entity.slides);
    }

    return Object.keys(payload).length > 0 ? payload : null;
}

function toSlideCreateRequest(layout?: SlideLayout): MagicStudioPresentationSlideCreateRequest {
    return {
        layout: normalizeLayout(layout),
    };
}

function toSlideUpdateRequest(updates: Partial<Slide>): MagicStudioPresentationSlideUpdateRequest | null {
    const payload: MagicStudioPresentationSlideUpdateRequest = {};

    if (updates.title !== undefined) {
        payload.title = readText(updates.title) || 'Untitled Slide';
    }
    if (updates.notes !== undefined) {
        payload.notes = updates.notes;
    }
    if (updates.elements !== undefined) {
        payload.elements = normalizeElements(updates.elements);
    }
    if (updates.layout !== undefined) {
        payload.layout = normalizeLayout(updates.layout);
    }
    if (updates.backgroundColor !== undefined) {
        payload.backgroundColor = updates.backgroundColor;
    }
    if (updates.backgroundImage !== undefined) {
        payload.backgroundImage = updates.backgroundImage;
    }
    if (updates.transition !== undefined) {
        payload.transition = updates.transition;
    }

    return Object.keys(payload).length > 0 ? payload : null;
}

function normalizePresentationRecord(presentation: Presentation): Presentation {
    return normalizePresentation({
        ...presentation,
        id: readOptionalText(presentation.id) ?? null,
        uuid: readText(presentation.uuid),
        title: readText(presentation.title) || FALLBACK_PRESENTATION_TITLE,
        theme: normalizeTheme(presentation.theme),
        settings: presentation.settings
            ? {
                aspectRatio: normalizeAspectRatio(presentation.settings.aspectRatio),
                defaultFont: readOptionalText(presentation.settings.defaultFont),
                primaryColor: readOptionalText(presentation.settings.primaryColor),
                secondaryColor: readOptionalText(presentation.settings.secondaryColor),
            }
            : undefined,
        slides: normalizeSlides(presentation.slides) || [],
    });
}

function resolvePresentationKey(entity: Partial<Presentation>): string | null {
    const id = readOptionalText(entity.id);
    if (id) {
        return id;
    }

    const uuid = readOptionalText(entity.uuid);
    return uuid || null;
}

export class ChatPPTService {
    private readonly serverClient?: PresentationServerClient;
    private cachedServerClient?: PresentationServerClient;

    constructor(options: ChatPPTServiceOptions = {}) {
        this.serverClient = options.serverClient;
    }

    private getServerClient(): PresentationServerClient {
        if (this.serverClient) {
            return this.serverClient;
        }

        if (!this.cachedServerClient) {
            const runtime = readDefaultPlatformRuntime('ChatPPTService');
            if (!isMagicStudioServerRuntimeSupported(runtime)) {
                throw new Error(
                    '[ChatPPTService] Presentations require the canonical Magic Studio server runtime',
                );
            }
            this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
        }

        return this.cachedServerClient;
    }

    async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<Presentation>>> {
        try {
            const response = await this.getServerClient().listPresentations(
                toListQuery(pageRequest),
            );
            return Result.success(
                toPage(
                    response.items.map(normalizePresentationRecord),
                    response.meta,
                    pageRequest,
                ),
            );
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to load presentations'));
        }
    }

    async findById(id: string): Promise<ServiceResult<Presentation | null>> {
        const presentationId = readText(id);
        if (!presentationId) {
            return Result.error('Presentation id is required');
        }

        try {
            const response = await this.getServerClient().readPresentation(presentationId);
            return Result.success(normalizePresentationRecord(response.data));
        } catch (error: unknown) {
            if (isNotFoundError(error)) {
                return Result.success(null);
            }
            return Result.error(toErrorMessage(error, 'Failed to load presentation'));
        }
    }

    async save(entity: Partial<Presentation>): Promise<ServiceResult<Presentation>> {
        const presentationKey = resolvePresentationKey(entity);
        if (!presentationKey) {
            const title = readText(entity.title) || FALLBACK_PRESENTATION_TITLE;
            const created = await this.createPresentation(title);
            if (!created.success || !created.data) {
                return created;
            }

            const updatePayload = toUpdateRequest({
                ...entity,
                title: undefined,
            });
            if (!updatePayload) {
                return created;
            }

            try {
                const response = await this.getServerClient().updatePresentation(
                    resolveEntityKey(created.data),
                    updatePayload,
                );
                return Result.success(normalizePresentationRecord(response.data));
            } catch (error: unknown) {
                return Result.error(toErrorMessage(error, 'Failed to update presentation'));
            }
        }

        const payload = toUpdateRequest(entity);
        if (!payload) {
            const existing = await this.findById(presentationKey);
            if (existing.success && existing.data) {
                return Result.success(existing.data);
            }
            return Result.error('No presentation changes were provided');
        }

        try {
            const response = await this.getServerClient().updatePresentation(
                presentationKey,
                payload,
            );
            return Result.success(normalizePresentationRecord(response.data));
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to save presentation'));
        }
    }

    async deleteById(id: string): Promise<ServiceResult<void>> {
        const presentationId = readText(id);
        if (!presentationId) {
            return Result.error('Presentation id is required');
        }

        try {
            await this.getServerClient().deletePresentation(presentationId);
            return Result.success(undefined);
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to delete presentation'));
        }
    }

    async createPresentation(title: string): Promise<ServiceResult<Presentation>> {
        try {
            const response = await this.getServerClient().createPresentation(
                toCreateRequest(title),
            );
            return Result.success(normalizePresentationRecord(response.data));
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to create presentation'));
        }
    }

    async addSlide(
        presentationId: string,
        layout: Slide['layout'] = 'bullet-points',
    ): Promise<ServiceResult<Presentation>> {
        const key = readText(presentationId);
        if (!key) {
            return Result.error('Presentation id is required');
        }

        try {
            const response = await this.getServerClient().createPresentationSlide(
                key,
                toSlideCreateRequest(layout),
            );
            return Result.success(normalizePresentationRecord(response.data));
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to add slide'));
        }
    }

    async updateSlide(
        presentationId: string,
        slideId: string,
        updates: Partial<Slide>,
    ): Promise<ServiceResult<Presentation>> {
        const presentationKey = readText(presentationId);
        const normalizedSlideId = readText(slideId);
        if (!presentationKey) {
            return Result.error('Presentation id is required');
        }
        if (!normalizedSlideId) {
            return Result.error('Slide id is required');
        }

        const payload = toSlideUpdateRequest(updates);
        if (!payload) {
            const existing = await this.findById(presentationKey);
            if (existing.success && existing.data) {
                return Result.success(existing.data);
            }
            return Result.error('No slide changes were provided');
        }

        try {
            const response = await this.getServerClient().updatePresentationSlide(
                presentationKey,
                normalizedSlideId,
                payload,
            );
            return Result.success(normalizePresentationRecord(response.data));
        } catch (error: unknown) {
            return Result.error(toErrorMessage(error, 'Failed to update slide'));
        }
    }

    async generateSlidesFromPrompt(_presentationId: string, _prompt: string): Promise<ServiceResult<Presentation>> {
        return Result.error(
            'Canonical presentation prompt generation is not implemented in the Rust host yet.',
        );
    }
}

export const chatPPTService = new ChatPPTService();
