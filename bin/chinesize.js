#!/usr/bin/env node

import { Command, Option } from 'commander';
import { extract  } from '../src/extract.js';
import { replace } from '../src/replace.js';
const program = new Command();

program
  .name('chinesize')
  .description('CLI to convert English Angular project to Chinese')
  .version('0.0.1');

program
  .command('extract')
  .description('Extract English texts of Angular project')
  .usage('<dir> [options]')
  .argument('<dir>', 'directory of Angular project')
  .addOption(
    new Option('-t, --type <type>', 'file type')
      .choices(['html', 'ts'])
      .makeOptionMandatory(true)
  )
  .option('-o, --output <filePath>', 'path of file for writing the extracted English text')
  .action((dir, options) => {
    extract(dir, options.type, options.output);
  });

program
  .command('replace')
  .description('Replace English texts of Angular project to Chinese')
  .usage('<dir> [options]')
  .argument('<dir>', 'directory of Angular project')
  .addOption(
    new Option('-t, --type <type>', 'file type')
      .choices(['html', 'ts'])
      .makeOptionMandatory(true)
  )
  .option('-i, --input <filePath>', 'path of file for reading the Chinese text')
  .option('-p, --prettier-config <configFilePath>', 'path of config file for prettier')
  .action((dir, options) => {
    replace(dir, options.type, options.input, options.prettierConfig);
  });

program.parse();