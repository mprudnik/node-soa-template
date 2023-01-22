import { Infra } from '../infra/types';

type Payload<M, D> = { meta?: M, data: D };

export type Command<M = unknown, D = unknown, R = unknown> = (
  infra: Infra,
  payload: Payload<M, D>,
) => Promise<R>;
export type EventHandler<M = unknown, D = unknown> = (
  infra: Infra,
  payload: Payload<M, D>,
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

export function init(infra: Infra): Promise<void>;

