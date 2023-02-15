import type { Logger } from '../logger/types';
import type { Redis } from '../redis/types';

export interface DefaultMeta {
  operationId: string;
  [key: string]: unknown;
}
export type Payload<Meta = object, Data = unknown> = { meta: Meta; data: Data };
export type EventHandler = (event: Payload<DefaultMeta>) => Promise<void>;
export type CallHandler = (
  payload: Payload<DefaultMeta>,
) => Promise<CallResult>;
export type ServiceError = { message: string; expected: boolean };
export type CallResult = [ServiceError | null, any];
export type CallData = { serverId: string; callId: string; payload: string };
export type CallResponse = { callId: string; result: CallResult };

export interface Command {
  call(
    command: { service: string; method: string },
    payload: Payload,
  ): Promise<CallResult>;
  registerService(name: string, service: Record<string, CallHandler>): void;
}

export interface PubSub {
  publish(eventName: string, payload: Payload): Promise<boolean>;
  subscribe(eventName: string, handler: EventHandler): boolean;
  unsubscribe(eventName: string, handler: EventHandler): boolean;
}

export interface Bus extends Command, PubSub {
  listen(): Promise<void>;
  teardown(): Promise<void>;
}

export interface LocalBusOptions {
  type: 'local';
}

export interface DistributedBusOptions {
  type: 'distributed';
  serverId: string;
}

export type BusOptions = LocalBusOptions | DistributedBusOptions;

export type Init<Options = BusOptions> = (
  deps: { redis: Redis; logger: Logger },
  options: Options,
) => Bus;
export type InitLocal = Init<LocalBusOptions>;
export type InitDistributed = Init<DistributedBusOptions>;

export type Teardown = (deps: { bus: Bus; logger: Logger }) => Promise<void>;
