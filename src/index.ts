#!/usr/bin/env node
import { Command } from 'commander';
import { watchCommand } from './commands/watch';

const program = new Command();

program
  .name('blobr')
  .description('A terminal-based rollup activity monitor for Celestia')
  .version('1.0.0');

program.addCommand(watchCommand);

// Execute the program and handle any errors
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parseAsync(process.argv).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}