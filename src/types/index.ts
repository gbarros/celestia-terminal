export interface BlockStats {
  blobs_count: number;
  blobs_size: number;
  block_time: number;
  bytes_in_block: number;
  commissions: string;
  events_count: number;
  fee: string;
  fill_rate: string;
  gas_limit: number;
  gas_used: number;
  inflation_rate: string;
  rewards: string;
  square_size: number;
  supply_change: string;
  tx_count: number;
}

export interface Block {
  height: number;
  time: string;
  blobs: Blob[];
  stats?: BlockStats;
}

export interface Blob {
  namespace: {
    namespace_id: string;
    name?: string;
  };
  size: number;
  commitment: string;
  height: number;
  time: string;
  content_type?: string;
  rollup?: {
    id: number;
    name: string;
    slug: string;
  };
  signer?: {
    hash: string;
    celestials?: {
      name: string;
      image_url?: string;
    };
  };
}

export interface Rollup {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  stack?: string;
}

export interface Namespace {
  id: number;
  namespace_id: string;
  name?: string;
  version: number;
  rollup?: Rollup;
}

export interface NetworkConfig {
  name: string;
  baseUrl: string;
}

export interface WatchOptions {
  network: string;
  filter?: string;
  limit?: number;
  compact?: boolean;
  interval?: number;
} 