import type { Infra } from '../infra/types';

export interface ServicesConfig {
  enabledServices: 'all' | string[];
}

export interface WrappedInfra extends Omit<Infra, 'bus' | 'logger'> {
  bus: Pick<Infra['bus'], 'call' | 'publish'>;
  logger: Omit<Infra['logger'], 'child'>;
}

export interface DefaultMeta {
  operationId: string;
  [key: string]: unknown;
}

export interface ValidationSchema {
  auth?: Record<string, unknown>;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

interface CommandGenericInterface {
  Meta?: unknown;
  Data: unknown;
  Returns: unknown;
}
export type Command<
  CommandGeneric extends Partial<CommandGenericInterface> = CommandGenericInterface,
> = {
  handler: (
    infra: WrappedInfra,
    payload: { meta: CommandGeneric['Meta']; data: CommandGeneric['Data'] },
  ) => Promise<CommandGeneric['Returns']>;
} & ValidationSchema;

interface EventGenericInterface {
  Meta?: unknown;
  Data: unknown;
}
export type EventHandler<
  EventGeneric extends Partial<EventGenericInterface> = EventGenericInterface,
> = (
  infra: WrappedInfra,
  payload: { meta: EventGeneric['Meta']; data: EventGeneric['Data'] },
) => Promise<void>;

export type Service = {
  commands?: any;
  eventHandlers?: any;
};

export type ServiceFunction =
  | Command<{ Meta: DefaultMeta }>['handler']
  | EventHandler<{ Meta: DefaultMeta }>;
export type WrappedServiceFunction<Fn extends ServiceFunction = ServiceFunction> = (
  payload: Parameters<Fn>[1],
) => Promise<[ServiceError, null] | [null, unknown | void]>;

export function wrapServiceFunction<Fn extends ServiceFunction>(
  infra: Infra,
  fn: Fn,
  options: { source: string },
): WrappedServiceFunction<Fn>;

export interface ServiceError {
  message: string;
  expected: boolean;
}

export function processServiceError(error: any, logger: WrappedInfra['logger']): ServiceError;

export function initCommands(
  infra: Infra,
  serviceName: string,
  commands: Record<string, Command>,
): Promise<void>;

export function initEventHandlers(
  infra: Infra,
  serviceName: string,
  eventHandlers: Record<string, EventHandler>,
): void;

export function init(infra: Infra, config: ServicesConfig): Promise<void>;
