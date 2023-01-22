/** @typedef {import('./schema')} Schema */
/** @typedef {import('./schema').SchemaItem} SchemaItem */

/** @type Schema['paginate'] */
export const paginate = (item) => ({
  required: ['count', 'items'],
  properties: {
    count: { type: 'integer' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: item.required ?? [],
        properties: item.properties,
      },
    },
  },
});

/** @type Schema['toObject'] */
export const toObject = (item) => ({
  type: 'object',
  additionalProperties: false,
  required: item.required,
  properties: item.properties,
  nullable: Boolean(item.nullable),
});

/** @type Schema['toArray'] */
export const toArray = (item) => ({
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: item.required,
    properties: item.properties,
  },
});

/** @type Schema['selectProperties'] */
export const selectProperties = (entity, properties) => {
  /** @type {Required<SchemaItem>} */
  const result = { required: [], properties: {} };
  for (const property of properties) {
    if (entity.required?.includes(property)) result.required.push(property);
    if (property in entity.properties)
      result.properties[property] = entity.properties[property];
  }
  return result;
};

/** @type Schema['dropProperties'] */
export const dropProperties = (entity, properties) => {
  const result = JSON.parse(JSON.stringify(entity)); // update to structuredClone on node18
  for (const property of properties) {
    const idx = result.required.indexOf(property);
    if (idx >= 0) result.required.splice(idx, 1);
    if (property in result.properties) delete result.properties[property];
  }
  return result;
};

export const paginationProperties = {
  page: { type: 'integer', minimum: 1, default: 1 },
  limit: { type: 'integer', minimum: 1, default: 10 },
};

export const sortProperties = {
  sortBy: { type: 'string', default: 'createdAt' },
  sortOrder: {
    type: 'string',
    enum: ['asc', 'desc'],
    default: 'asc',
  },
};
