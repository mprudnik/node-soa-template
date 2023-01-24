export type SchemaItem = { required?: string[], properties: Record<string, unknown> };
type SortAndPagination = {
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
};
type DBSortAndPagination = {
  skip: number;
  take: number;
  orderBy: object;
};

export function paginate(item: SchemaItem): any;
export function toObject(item: SchemaItem & { nullable?: boolean }): any;
export function toArray(item: SchemaItem): any;
export function selectProperties(entity: SchemaItem, properties: string[]): any;
export function dropProperties(entity: SchemaItem, properties: string[]): any;
export const paginationProperties: { page: any, limit: any };
export const sortProperties: { sortBy: any, sortOrder: any };
