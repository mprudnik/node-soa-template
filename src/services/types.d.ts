import { Infra } from '../infra/types';

type Payload<Meta = unknown, Data = unknown> = { meta: Meta, data: Data };

export type Command<Meta = unknown, Data = unknown, Returns = unknown> = (
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

export type WrappedCommandResult = [ServiceError | null, any];
export function wrapCommand(
  infra: Infra,
  command: Command,
): (payload: Payload) => Promise<WrappedCommandResult>;
type AsyncFunc = (...args: any[]) => Promise<any>;
export function handleServiceError(func: AsyncFunc): (...args: any[]) => Promise<WrappedCommandResult>;

export function init(infra: Infra): Promise<void>;

