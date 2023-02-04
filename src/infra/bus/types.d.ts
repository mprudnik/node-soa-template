export interface DefaultMeta {
  operationId: string;
  [key: string]: unknown;
}
export type Payload<Meta = object, Data = unknown> = { meta: Meta, data: Data };
export type EventHandler = (event: Payload<DefaultMeta>) => Promise<void>;
export type CommandHandler = (payload: Payload<DefaultMeta>) => Promise<CommandResult>;
export type ServiceError = { message: string; expected: boolean };
export type CommandResult = [ServiceError | null, any];
export type CommandResponse = { callId: string; result: CommandResult };

export interface Command {
  call(command: { service: string; method: string; }, payload: Payload): Promise<CommandResult>;
  registerService(name: string, service: Record<string, CommandHandler>): void;
}

export interface PubSub {
  subscribe(eventName: string, handler: EventHandler): boolean;
  publish(eventName: string, payload: Payload): boolean;
}

export interface Bus extends Command, PubSub {
  listen(): Promise<void>;
  teardown(): Promise<void>;
}
