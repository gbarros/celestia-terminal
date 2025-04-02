import { Command } from 'commander';
import { CeleniumAPI } from '../api/celenium';
import { TerminalUI } from '../ui';
import { WatchOptions } from '../types/index';

export const watchCommand = new Command('watch')
  .description('Watch real-time blob activity')
  .option('-n, --network <network>', 'Network to monitor (mainnet, mocha, arabica)', 'mainnet')
  .option('-f, --filter <namespace>', 'Filter displayed blobs by namespace (client-side filtering)') 
  .option('-i, --interval <ms>', 'Update interval in milliseconds', '7000')
  .action(async (options: WatchOptions) => {
    const api = new CeleniumAPI(options.network);
    const ui = new TerminalUI();

    let stats = {
      totalBlocks: 0,
      totalBlobs: 0,
      activeRollups: 0,
      averageBlobsPerBlock: 0
    };

    // Track last processed block to avoid duplicates
    let lastProcessedHeight = 0;

    // Initialize rollups
    try {
      const rollups = await api.getRollups();
      stats.activeRollups = rollups.length;
      ui.updateRollups(rollups);
    } catch (error: any) {
      ui.logError('Failed to fetch rollups list', error);
    }

    // Poll for new blocks
    const pollBlocks = async () => {
      try {
        const blocks = await api.getLatestBlocks(5);
        const newBlocks = blocks.filter(block => block.height > lastProcessedHeight);
        
        // Clear blob list before adding new blobs
        ui.clearBlobList();
        
        // Process blocks in reverse order to maintain chronological display
        for (const block of newBlocks.reverse()) {
          try {
            // Fetch block stats
            const blockStats = await api.getBlockStats(block.height);
            block.stats = blockStats;
            
            // Update stats
            stats.totalBlocks++;
            stats.totalBlobs += blockStats.blobs_count;
            
            // Update UI
            ui.updateBlock(block);

            // Fetch and display blobs for this block
            if (blockStats.blobs_count > 0) {
              const blobs = await api.getBlockBlobs(block.height);
              // Filter blobs if namespace filter is provided
              const filter = options.filter;
              const filteredBlobs = filter && filter.length > 0
                ? blobs.filter(blob => 
                    blob.namespace?.namespace_id?.toLowerCase().includes(filter.toLowerCase())
                  )
                : blobs;
              
              // Only display filtered blobs, but keep stats accurate with all blobs
              filteredBlobs.forEach(blob => {
                ui.updateBlob(blob);
              });
            }
            
            // Update last processed height
            lastProcessedHeight = block.height;
          } catch (error) {
            ui.logError(`Failed to process block ${block.height}`, error);
          }
        }
        
        // Update rollups and overall stats
        const rollups = await api.getRollups();
        ui.updateRollups(rollups);
        ui.updateStats({
          totalBlocks: stats.totalBlocks,
          totalBlobs: stats.totalBlobs,
          activeRollups: rollups.length,
          averageBlobsPerBlock: stats.totalBlobs / stats.totalBlocks
        });
        
        ui.render();
      } catch (error) {
        ui.logError('Failed to fetch blocks', error);
      }
    };

    // Start polling
    const interval = setInterval(pollBlocks, Number(options.interval));

    // Handle process termination
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
  }); 