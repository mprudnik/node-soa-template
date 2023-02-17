export const strictObjectProperties = /** @type {const} */ ({
  type: 'object',
  additionalProperties: false,
});

export const paginationProperties = /** @type {const} */ ({
  page: { type: 'integer', minimum: 1, default: 1 },
  limit: { type: 'integer', minimum: 1, default: 10 },
});

export const sortProperties = /** @type {const} */ ({
  sortBy: { type: 'string', default: 'createdAt' },
  sortOrder: {
    type: 'string',
    enum: ['asc', 'desc'],
    default: 'asc',
  },
});
