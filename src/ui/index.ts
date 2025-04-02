import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Block, Blob, Rollup } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class TerminalUI {
  private screen: blessed.Widgets.Screen;
  private grid: any;
  private blockList: any;
  private blobList: any;
  private statsBox: any;
  private rollupList: any;
  private errorLog: any;
  private errorLogFile: string;
  private rollups: Rollup[];
  private totalBlocks: number;
  private totalBlobs: number;

  private bytesToKB(bytes: number): string {
    return (bytes / 1024).toFixed(2);
  }

  constructor() {
    // Initialize properties
    this.rollups = [];
    this.totalBlocks = 0;
    this.totalBlobs = 0;

    // Create log file in project directory
    this.errorLogFile = path.join(process.cwd(), `blobr-errors-${Date.now()}.log`);
    console.log(`Error log file: ${this.errorLogFile}`);

    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Blobr - Celestia Rollup Activity Monitor'
    });

    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen
    });

    // Block list (top)
    this.blockList = this.grid.set(0, 0, 4, 12, contrib.log, {
      label: 'Recent Blocks',
      fg: 'green',
      selectedFg: 'white',
      selectedBg: 'blue',
      border: { type: 'line', fg: 'cyan' },
      tags: true
    });

    // Blob list (middle)
    this.blobList = this.grid.set(4, 0, 4, 12, contrib.log, {
      label: 'Recent Blobs',
      fg: 'yellow',
      selectedFg: 'white',
      selectedBg: 'blue',
      border: { type: 'line', fg: 'cyan' },
      tags: true
    });

    // Stats box (bottom left)
    this.statsBox = this.grid.set(8, 0, 2, 6, blessed.box, {
      label: 'Statistics',
      content: 'Loading...',
      tags: true,
      border: { type: 'line', fg: 'cyan' }
    });

    // Rollups box (bottom right)
    this.rollupList = this.grid.set(8, 6, 2, 6, contrib.log, {
      label: 'Active Rollups',
      fg: 'magenta',
      selectedFg: 'white',
      selectedBg: 'blue',
      border: { type: 'line', fg: 'cyan' },
      tags: true
    });

    // Error log (bottom)
    this.errorLog = this.grid.set(10, 0, 2, 12, contrib.log, {
      label: 'Errors',
      fg: 'red',
      selectedFg: 'white',
      selectedBg: 'red',
      border: { type: 'line', fg: 'red' },
      tags: true
    });

    // Handle exit
    this.screen.key(['escape', 'q', 'C-c'], () => {
      process.exit(0);
    });
  }

  updateBlock(block: Block): void {
    const time = new Date(block.time).toLocaleTimeString();
    const fillRate = block.stats?.fill_rate ? parseFloat(block.stats.fill_rate) * 100 : 0;
    const gasUtilization = block.stats?.gas_limit ? 
      ((block.stats.gas_used / block.stats.gas_limit) * 100).toFixed(1) : '0';
    
    // Format numbers with commas for better readability
    const blobsCount = block.stats?.blobs_count?.toLocaleString() || '0';
    const blobsSize = block.stats?.blobs_size ? this.bytesToKB(block.stats.blobs_size) + ' KB' : '0 KB';
    const blockSize = block.stats?.bytes_in_block ? this.bytesToKB(block.stats.bytes_in_block) + ' KB' : '0 KB';
    const eventsCount = block.stats?.events_count?.toLocaleString() || '0';
    const txCount = block.stats?.tx_count?.toLocaleString() || '0';

    // Log each line separately to ensure proper display
    this.blockList.log(`{bold}Block #${block.height}{/} - {green-fg}${time}{/}`);
    this.blockList.log(`  {cyan-fg}Blobs: ${blobsCount}{/} | {yellow-fg}Size: ${blobsSize}{/} | {magenta-fg}Fill: ${fillRate.toFixed(1)}%{/}`);
    this.blockList.log(`  {blue-fg}Block Size: ${blockSize}{/} | {red-fg}Gas: ${gasUtilization}%{/} | {white-fg}Events: ${eventsCount}{/} | {green-fg}TXs: ${txCount}{/}`);
  }

  updateBlob(blob: Blob): void {
    const namespaceName = blob.namespace.name || 'Unknown Namespace';
    const rollupName = blob.rollup?.name || 'Unknown Rollup';
    const signer = blob.signer?.hash ? blob.signer.hash.slice(0, 16) + '...' : 'Unknown';
    const blobSize = this.bytesToKB(blob.size) + ' KB';
    
    // Log each line separately to ensure proper display
    this.blobList.log(`{bold}Blob{/} - {yellow-fg}NS: ${namespaceName}{/}`);
    this.blobList.log(`  {cyan-fg}Rollup: ${rollupName}{/} | {green-fg}Size: ${blobSize}{/} | {magenta-fg}Type: ${blob.content_type || 'unknown'}{/}`);
    this.blobList.log(`  {gray-fg}From: ${signer}{/}`);
  }

  updateStats(stats: {
    totalBlocks: number;
    totalBlobs: number;
    activeRollups: number;
    averageBlobsPerBlock: number;
  }): void {
    this.statsBox.setContent(
      `{bold}Total Blocks:{/} {green-fg}${stats.totalBlocks}{/}\n` +
      `{bold}Total Blobs:{/} {yellow-fg}${stats.totalBlobs}{/}\n` +
      `{bold}Active Rollups:{/} {magenta-fg}${stats.activeRollups}{/}\n` +
      `{bold}Average Blobs/Block:{/} {cyan-fg}${stats.averageBlobsPerBlock.toFixed(2)}{/}`
    );
  }

  updateRollups(rollups: Rollup[]): void {
    this.rollups = rollups;
    // Clear previous content
    this.rollupList.setContent('');
    // Add each rollup
    rollups.forEach(rollup => {
      this.rollupList.log(`{bold}${rollup.name}{/} - {cyan-fg}${rollup.stack}{/}`);
    });
    // Update stats to refresh the display
    this.updateStats({
      totalBlocks: this.totalBlocks,
      totalBlobs: this.totalBlobs,
      activeRollups: rollups.length,
      averageBlobsPerBlock: this.totalBlobs / this.totalBlocks
    });
  }

  clearBlobList(): void {
    this.blobList.setContent('');
  }

  logError(context: string, error: any): void {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      context,
      message: error.message || error.toString(),
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    };

    // Write to file
    fs.appendFileSync(
      this.errorLogFile,
      JSON.stringify(errorDetails, null, 2) + '\n'
    );

    // Update UI with simplified error
    this.errorLog.log(
      `{red-fg}${context}{/}\n` +
      `{yellow-fg}Error: ${error.message || error.toString()}{/}\n` +
      `{dim}Full error log: ${this.errorLogFile}{/}`
    );
    
    this.render();
  }

  render(): void {
    this.screen.render();
  }
} 