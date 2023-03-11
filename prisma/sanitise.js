import path from 'node:path';
import fs from 'node:fs/promises';

const sanitizeEntity = (schema) => {
  if (!schema) return schema;
  for (const property of Object.keys(schema.properties)) {
    const propertyKeys = Object.keys(schema.properties[property]);
    const type = schema.properties[property]?.type;
    if (type === 'object') sanitizeEntity(schema.properties[property]);

    if (Array.isArray(type)) schema.properties[property].type = type[0];
    if (propertyKeys.includes('$ref')) delete schema.properties[property];
    if (propertyKeys.includes('anyOf')) delete schema.properties[property];
    if (type === 'array' && !schema.properties[property]?.items?.type) {
      delete schema.properties[property];
    }
  }
  return schema;
};

const sanitizeSchema = (raw) => {
  const entities = {};
  for (const [entity, schema] of Object.entries(raw)) {
    const name = entity[0].toLowerCase() + entity.slice(1);
    entities[name] = sanitizeEntity(schema);
  }
  return entities;
};

const pathToJsonSchema = path.join(process.cwd(), 'prisma', 'json-schema.json');
const pathToJsSchema = path.join(process.cwd(), 'prisma', 'json-schema.js');

const src = await fs.readFile(pathToJsonSchema, 'utf-8');
const { definitions } = JSON.parse(src);

const entities = sanitizeSchema(definitions);

const fileStart = '/* eslint-disable */\nexport default /** @type {const} */ (';
const fileEnd = ')';
await fs.writeFile(pathToJsSchema, fileStart + JSON.stringify(entities) + fileEnd);
await fs.rm(pathToJsonSchema);
