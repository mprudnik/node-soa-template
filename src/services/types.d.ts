import { Infra } from '../infra/types';

export interface DefaultMeta {
  operationId: string;
  [key: string]: unknown;
}

type Payload<Meta = DefaultMeta, Data = unknown> = { meta: Meta, data: Data };

export type Command<Meta = DefaultMeta, Data = unknown, Returns = unknown> = (
  infra: Infra,
  payload: Payload<Meta, Data>,
) => Promise<Returns>;
export type EventHandler<Meta = unknown, Data = unknown> = (
  infra: Infra,
  payload: Payload<Meta, Data>,
) => Promise<void>

export type Service = {
  commands?: any;
  eventHandlers?: any;
};

export function initCommands(
  infra: Infra,
  serviceName: string,
  commands: Record<string, Command>,
): void;

export function initEventHandlers(
  infra: Infra,
  eventHandlers: Record<string, EventHandler>,
): void;

interface ServiceError {
  expected: boolean;
  message: string;
}

export function processServiceError(
  error: any,
  logger: Infra['logger'], 
  options: { operationId: string, logPrefix: string },
): ServiceError;

export type WrappedResult = [ServiceError | null, any];

export interface WrapOptions {
  logPrefix: string;
}

export function wrapCommand(
  infra: Infra,
  command: Command,
  options: WrapOptions,
): (payload: Payload) => Promise<WrappedResult>;

export function init(infra: Infra): Promise<void>;

