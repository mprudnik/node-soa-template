import type { Infra } from '../infra/types';

export interface ValidationSchema {
  auth?: Record<string, unknown>;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

interface CommandGenericInterface {
  Meta: unknown;
  Data: unknown;
  Returns: unknown;
}
export type Command<
  CommandGeneric extends Partial<CommandGenericInterface> = CommandGenericInterface,
> = {
  handler: (
    infra: Infra,
    payload: { meta: CommandGeneric['Meta']; data: CommandGeneric['Data'] },
  ) => Promise<CommandGeneric['Returns']>;
} & ValidationSchema;

interface EventGenericInterface {
  Meta: unknown;
  Data: unknown;
}
export type EventHandler<
  EventGeneric extends Partial<EventGenericInterface> = EventGenericInterface,
> = (
  infra: Infra,
  payload: { meta: EventGeneric['Meta']; data: EventGeneric['Data'] },
) => Promise<void>;

export type Service = {
  commands?: any;
  eventHandlers?: any;
};

export function initCommands(
  infra: Infra,
  serviceName: string,
  commands: Record<string, Command>,
): Promise<void>;

export function initEventHandlers(
  infra: Infra,
  eventHandlers: Record<string, EventHandler>,
): void;

export function init(infra: Infra): Promise<void>;
