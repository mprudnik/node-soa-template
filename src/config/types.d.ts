import { InfraOptions as InfraConfig } from '../infra/types';
import { ServicesConfig } from '../services/types';
import { ServerConfig } from '../server/types';

export interface Config {
  infra: InfraConfig;
  services: ServicesConfig;
  server: ServerConfig;
}
