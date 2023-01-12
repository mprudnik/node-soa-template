type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type HttpDataSource = 'query' | 'body';
type ValidationSchema = { required?: string[]; properties: object; }
type HttpSchema = { source?: HttpDataSource, input?: ValidationSchema, output?: ValidationSchema };

export type HttpRoute = {
  method: HttpMethod;
  url: string;
  auth?: object;
  schema: HttpSchema;
  command: string;
}

export type HttpRouter = Record<string, HttpRoute[]>;
