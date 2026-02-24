
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface UseSearchFilterOptions<T> {
    data: T[];
    searchKeys: (keyof T)[];
    filterFn?: (item: T, query: string) => boolean;
    debounceMs?: number;
}

interface UseSearchFilterResult<T> {
    filteredData: T[];
    query: string;
    setQuery: (q: string) => void;
    isSearching: boolean;
}

export function useSearchFilter<T>({
    data,
    searchKeys,
    filterFn,
    debounceMs = 150
}: UseSearchFilterOptions<T>): UseSearchFilterResult<T> {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        setIsSearching(true);
        timeoutRef.current = setTimeout(() => {
            setDebouncedQuery(query);
            setIsSearching(false);
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query, debounceMs]);

    const filteredData = React.useMemo(() => {
        if (!debouncedQuery.trim()) return data;

        const lowerQuery = debouncedQuery.toLowerCase();
        
        return data.filter(item => {
            if (filterFn) {
                return filterFn(item, debouncedQuery);
            }
            
            return searchKeys.some(key => {
                const value = item[key];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(lowerQuery);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(lowerQuery);
                }
                return false;
            });
        });
    }, [data, debouncedQuery, searchKeys, filterFn]);

    return { filteredData, query, setQuery, isSearching };
}

interface UsePaginationOptions {
    pageSize?: number;
    initialPage?: number;
}

interface UsePaginationResult {
    page: number;
    pageSize: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: () => void;
    prevPage: () => void;
    setPage: (p: number) => void;
    reset: () => void;
}

export function usePagination({
    pageSize = 20,
    initialPage = 0
}: UsePaginationOptions = {}): UsePaginationResult {
    const [page, setPage] = useState(initialPage);

    const nextPage = useCallback(() => {
        setPage(p => p + 1);
    }, []);

    const prevPage = useCallback(() => {
        setPage(p => Math.max(0, p - 1));
    }, []);

    const reset = useCallback(() => {
        setPage(initialPage);
    }, [initialPage]);

    return {
        page,
        pageSize,
        offset: page * pageSize,
        hasNext: true,
        hasPrev: page > 0,
        nextPage,
        prevPage,
        setPage,
        reset
    };
}

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    threshold?: number;
}

export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    threshold = 200
}: UseInfiniteScrollOptions) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            
            if (scrollHeight - scrollTop - clientHeight < threshold && hasMore) {
                onLoadMore();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [onLoadMore, hasMore, threshold]);

    return containerRef;
}

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T {
    const lastCallRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const throttledFn = useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallRef.current;

        if (timeSinceLastCall >= delay) {
            lastCallRef.current = now;
            return fn(...args);
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                lastCallRef.current = Date.now();
                fn(...args);
            }, delay - timeSinceLastCall);
        }
    }, [fn, delay]) as T;

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return throttledFn;
}

