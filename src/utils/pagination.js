export const parsePagination = (query = {}, options = {}) => {
  const defaultPage = options.defaultPage || 1;
  const defaultLimit = options.defaultLimit || 20;
  const maxLimit = options.maxLimit || 100;

  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = defaultPage;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const parseSort = (sortParam, allowedFields = [], defaultSort = { createdAt: -1 }) => {
  if (!sortParam || typeof sortParam !== 'string') {
    return defaultSort;
  }

  const trimmed = sortParam.trim();
  const isDescending = trimmed.startsWith('-');
  const fieldName = isDescending ? trimmed.substring(1) : trimmed;

  if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
    return defaultSort;
  }

  return {
    [fieldName]: isDescending ? -1 : 1
  };
};

export const formatPaginationMeta = (page, limit, totalRecords) => {
  const total = Math.max(0, parseInt(totalRecords, 10) || 0);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    totalRecords: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

export default {
  parsePagination,
  parseSort,
  formatPaginationMeta
};
