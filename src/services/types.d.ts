import {
  Infra,
  Payload,
  DefaultMeta,
  ServiceError,
  CommandResult,
} from '../infra/types';

export interface WrappedInfra extends Omit<Infra, 'bus'> {
  bus: Pick<Infra['bus'], 'command' | 'publish'>;
}

export type Command<Meta = unknown, Data = unknown, Returns = unknown> = (
  infra: WrappedInfra,
  payload: Payload<Meta, Data>,
) => Promise<Returns>;
export type EventHandler<Meta = unknown, Data = unknown> = (
  infra: WrappedInfra,
  payload: Payload<Meta, Data>,
) => Promise<void>

export type Service = {
  commands?: any;
  eventHandlers?: any;
};

export function init(infra: Infra): Promise<void>;

export function initCommands(
  infra: Infra,
  serviceName: string,
  commands: Record<string, Command>,
): void;

export function initEventHandlers(
  infra: Infra,
  eventHandlers: Record<string, EventHandler>,
): void;

export function processServiceError(
  error: any,
  logger: Infra['logger'], 
  options: { operationId: string, logPrefix: string },
): ServiceError;

export interface WrapOptions {
  logPrefix: string;
}

export function wrapCommand(
  infra: Infra,
  command: Command,
  options: WrapOptions,
): (payload: Payload<DefaultMeta>) => Promise<CommandResult>;

export function wrapInfra(infra: Infra, operationId: string): WrappedInfra;
