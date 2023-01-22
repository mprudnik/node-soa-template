import { InfraConfig } from '../infra/types';
import { ServerConfig } from '../server/types';

export interface Config {
  infra: InfraConfig;
  server: ServerConfig;
}

