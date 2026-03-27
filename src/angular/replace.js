import fs from "node:fs";
import path from "node:path";
import replaceHtml from "./replaceHtml.js";
import replaceTs from "./replaceTs.js";
import { errorLog } from "../utils/log.js";
import { readJsonFile } from "../utils/io.js";
import { addIgnoreFromInput, addIgnoreFromFile, shouldIgnore, resetIgnore } from "../utils/ignoreFiles.js";

export function replace(dir, type, input, prettierConfig, ignorePattern, ignoreConfigFile) {
  if (!fs.existsSync(dir)) {
    console.log(errorLog(`Error: "${dir}" is not exists`));
    return;
  }

  const dirStat = fs.statSync(dir);
  if (!dirStat.isDirectory()) {
    console.log(errorLog(`Error: "${dir}" is not a directory`));
    return;
  }

  const defaultFileName = type ? `texts-to-translate-${type}.json` : "texts-to-translate.json";
  const inputFilePath = input || path.join(dir, "chinesize", defaultFileName);

  if (prettierConfig && !fs.existsSync(prettierConfig)) {
    console.log(errorLog(`Error: "${prettierConfig}" is not exists`));
    return;
  }

  resetIgnore();
  if (ignorePattern) {
    addIgnoreFromInput(ignorePattern);
  }
  if (ignoreConfigFile) {
    addIgnoreFromFile(ignoreConfigFile);
  }

  if (!fs.existsSync(inputFilePath)) {
    console.log(errorLog(`Error: "${inputFilePath}" is not exists`));
    return;
  }

  const fileStat = fs.statSync(inputFilePath);
  if (!fileStat.isFile()) {
    console.log(errorLog(`Error: "${inputFilePath}" is not a file`));
    return;
  }

  try {
    const translations = readJsonFile(inputFilePath);
    replaceDir(dir, type, translations, prettierConfig);
  } catch (err) {
    console.log(errorLog(`Error: "${inputFilePath}" is not a valid JSON`));
    console.log(errorLog(err));
  }
}

function replaceDir(dir, type, translations, prettierConfig) {
  fs.readdir(dir, (dirErr, files) => {
    if (dirErr) {
      console.log(errorLog(`Error: Unable to scan ${dir} directory.`));
      console.log(errorLog(dirErr));
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) {
          console.log(errorLog(`Error: Unable to retrieve ${filePath} file stats.`));
          console.log(errorLog(err));
          return;
        }
        if (shouldIgnore(filePath)) {
          return;
        }

        if (stat.isDirectory()) {
          replaceDir(filePath, type, translations, prettierConfig);
        } else {
          const extname = path.extname(filePath);
          if (extname === ".html" && (type === undefined || type === "html")) {
            replaceHtml(filePath, translations, prettierConfig);
          } else if ((extname === ".js" || extname === ".ts") && (type === undefined || type === "js")) {
            replaceTs(filePath, translations, prettierConfig);
          }
        }
      });
    });
  });
}
