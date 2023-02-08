import { Infra } from '../infra/types';

type Payload<Meta, Data> = { meta: Meta; data: Data };

export type Command<Meta = unknown, Data = unknown, Returns = unknown> = (
  infra: Infra,
  payload: Payload<Meta, Data>,
) => Promise<Returns>;
export type EventHandler<Meta = unknown, Data = unknown> = (
  infra: Infra,
  payload: Payload<Meta, Data>,
) => Promise<void>;

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
