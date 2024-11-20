#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const FilePathHeader = require('../lib/index');

program
  .version('1.0.0')
  .description('Add file paths as comments to source files')
  .argument('[directory]', 'Target directory (defaults to current directory)', '.')
  .option('-i, --ignore <patterns...>', 'Files to ignore')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (directory, options) => {
    try {
      const targetDir = path.resolve(process.cwd(), directory);

      let config = {};
      if (options.config) {
        config = require(path.resolve(process.cwd(), options.config));
      }

      const filePathHeader = new FilePathHeader({
        ignoreFiles: options.ignore || config.ignoreFiles || [],
        customComments: config.customComments || {}
      });

      await filePathHeader.addFilePathComments(targetDir);
      console.log('Successfully processed all files!');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);