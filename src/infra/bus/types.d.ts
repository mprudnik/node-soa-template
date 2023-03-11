import type { Logger } from '../logger/types';
import type { Redis } from '../redis/types';
import type {
  ValidationSchema,
  DefaultMeta,
  Command as RawCall,
  EventHandler as RawEventHandler,
  WrappedServiceFunction as ServiceFunction,
} from '../../services/types';

export type EventHandler = ServiceFunction<RawEventHandler<{ Meta: Partial<DefaultMeta> }>>;
export type CallHandler = ServiceFunction<RawCall<{ Meta: Partial<DefaultMeta> }>['handler']>;
export type Payload = {
  meta?: Parameters<CallHandler>[0]['meta'];
  data: Parameters<CallHandler>[0]['data'];
};
export type CallResult = Awaited<ReturnType<CallHandler>>;

export type CallData = { serverId: string; callId: string; payload: string };

export interface Command {
  call(command: { service: string; method: string }, payload: Payload): Promise<CallResult>;
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
  getSchema(service: string, method: string): ValidationSchema | undefined;
  setSchema(service: string, method: string, schema: ValidationSchema): Promise<void>;
  prefetchSchemas(): Promise<void>;
  withMeta(meta: object): Bus;
}

export interface LocalBusOptions {
  type: 'local';
}

export interface DistributedBusOptions {
  type: 'distributed';
  serverId: string;
  readInterval: number;
  callTimeout: number;
  maxEventStreamSize: number;
  maxCallStreamSize: number;
}

export type BusOptions = LocalBusOptions | DistributedBusOptions;

export type Init<Options = BusOptions> = (
  deps: { redis: Redis; logger: Logger },
  options: Options,
) => Bus;
export type InitLocal = Init<LocalBusOptions>;
export type InitDistributed = Init<DistributedBusOptions>;

export type Teardown = (deps: { bus: Bus; logger: Logger }) => Promise<void>;
