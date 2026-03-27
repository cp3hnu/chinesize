#!/usr/bin/env node

import { Command, Option } from 'commander';
import { extractAngular, extractReact, replaceAngular, replaceReact } from "../src/index.js";
const program = new Command();

program
  .name('chinesize')
  .description('CLI to convert English React/Angular project to Chinese')
  .version('1.0.0');

program
  .command('extract')
  .description('Extract English texts of React/Angular project')
  .usage('<dir> [options]')
  .argument('<dir>', 'directory of React/Angular project')
  .addOption(
    new Option("-f, --framework <framework>", "framework type")
      .choices(["angular", "react"])
      .makeOptionMandatory(true)
  )
  .addOption(
    new Option('-t, --type <type>', 'file type')
      .choices(['html', 'js'])
      .makeOptionMandatory(false)
  )
  .option('-o, --output <filePath>', 'path of file for writing the extracted English text')
  .option('--ignore-pattern <glob...>', 'ignore files that match a provided glob expression')
  .option('--ignore-config <filePath...>', 'ignore files if they match patterns sourced from a configuration file (e.g. a .gitignore)')
  .action((dir, options) => {
    if (options.framework === "react") {
      extractReact(dir, options.output, options.ignorePattern, options.ignoreConfig);
      return;
    }
    extractAngular(dir, options.type, options.output, options.ignorePattern, options.ignoreConfig);
  });

program
  .command('replace')
  .description('Replace English texts of React/Angular project to Chinese')
  .usage('<dir> [options]')
  .argument('<dir>', 'directory of React/Angular project')
  .addOption(
    new Option("-f, --framework <framework>", "framework type")
      .choices(["angular", "react"])
      .makeOptionMandatory(true)
  )
  .addOption(
    new Option('-t, --type <type>', 'file type')
      .choices(['html', 'js'])
      .makeOptionMandatory(false)
  )
  .option('-i, --input <filePath>', 'path of file for reading the Chinese text')
  .option('-p, --prettier-config <filePath>', 'path of config file for prettier')
  .option('--ignore-pattern <glob...>', 'ignore files that match a provided glob expression')
  .option('--ignore-config <filePath...>', 'ignore files if they match patterns sourced from a configuration file (e.g. a .gitignore)')
  .action((dir, options) => {
    if (options.framework === "react") {
      replaceReact(dir, options.input, options.prettierConfig, options.ignorePattern, options.ignoreConfig);
      return;
    }
    replaceAngular(dir, options.type, options.input, options.prettierConfig, options.ignorePattern, options.ignoreConfig);
  });

program.parse();