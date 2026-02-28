import { Page, PageRequest, Sort } from '@sdkwork/react-commons';

export const createSpringPage = <T>(
  items: T[],
  pageRequest: PageRequest = { page: 0, size: 20 }
): Page<T> => {
  const page = Math.max(0, pageRequest.page ?? 0);
  const size = Math.max(1, pageRequest.size ?? 20);
  const normalizedSort = pageRequest.sort
    ?.map((item) => item.trim())
    .filter((item): item is string => item.length > 0);
  const hasSort = !!normalizedSort && normalizedSort.length > 0;
  const sortMeta: Sort = {
    sorted: hasSort,
    unsorted: !hasSort,
    empty: !hasSort
  };
  const start = page * size;
  const content = items.slice(start, start + size);
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const numberOfElements = content.length;

  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      offset: start,
      paged: true,
      unpaged: false,
      sort: sortMeta
    },
    last: totalElements === 0 ? true : page >= totalPages - 1,
    totalPages,
    totalElements,
    size,
    number: page,
    first: page === 0,
    numberOfElements,
    empty: numberOfElements === 0,
    sort: sortMeta
  };
};
