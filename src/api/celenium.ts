import axios, { AxiosInstance } from 'axios';
import { Block, Blob, Namespace, NetworkConfig, Rollup, BlockStats } from '../types';

const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Mainnet',
    baseUrl: 'https://api.celenium.io/v1',
  },
  mocha: {
    name: 'Mocha',
    baseUrl: 'https://api-mocha.celenium.io/v1',
  },
  arabica: {
    name: 'Arabica',
    baseUrl: 'https://api-arabica.celenium.io/v1',
  }
};

export interface Validator {
  id: number;
  cons_address: string;
  moniker: string;
  website: string;
  identity: string;
  contacts: string;
  details: string;
  rate: string;
  max_rate: string;
  max_change_rate: string;
  min_self_delegation: string;
  stake: string;
  rewards: string;
  commissions: string;
  voting_power: string;
  jailed: boolean;
  address: {
    hash: string;
  };
  delegator: {
    hash: string;
  };
}

export type ValidatorListResponse = Validator[];

export class CeleniumAPI {
  private network: NetworkConfig;
  private client: AxiosInstance;

  constructor(network: string = 'mainnet') {
    this.network = NETWORKS[network] || NETWORKS.mainnet;
    this.client = axios.create({
      baseURL: this.network.baseUrl,
      timeout: 10000,
    });
  }

  async getLatestBlocks(limit: number = 5): Promise<Block[]> {
    const response = await this.client.get('/block', {
      params: {
        limit,
        sort: 'desc',
        sort_by: 'height'
      }
    });
    return response.data;
  }

  async getBlockBlobs(height: number): Promise<Blob[]> {
    const response = await this.client.get(`/block/${height}/blobs`, {
      params: {
        limit: 100,
        sort: 'desc',
        sort_by: 'time'
      }
    });
    return response.data;
  }

  async getRollups(): Promise<Rollup[]> {
    const response = await this.client.get('/rollup', {
      params: {
        limit: 100,
        sort: 'desc',
        sort_by: 'blobs_count'
      }
    });
    return response.data;
  }

  async getBlockStats(height: number): Promise<BlockStats> {
    const response = await this.client.get(`/block/${height}/stats`);
    return response.data;
  }
}

export const api = new CeleniumAPI();
