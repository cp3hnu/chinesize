import fs from "node:fs";
import path from "node:path";
import extractHtml from "./extractHtml.js";
import extractTs from "./extractTs.js";
import { errorLog } from "../utils/log.js";
import { writeTextMapFile, ensureDirectoryForFile } from "../utils/io.js";
import { addIgnoreFromInput, addIgnoreFromFile, shouldIgnore, resetIgnore } from "../utils/ignoreFiles.js";

export function extract(dir, type, output, ignorePattern, ignoreConfigFile) {
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
  const outputFilePath = output || path.join(dir, "chinesize", defaultFileName);
  ensureDirectoryForFile(outputFilePath);

  resetIgnore();
  if (ignorePattern) {
    addIgnoreFromInput(ignorePattern);
  }
  if (ignoreConfigFile) {
    addIgnoreFromFile(ignoreConfigFile);
  }

  const texts = [];
  extractDir(dir, type, outputFilePath, texts);
}

function extractDir(dir, type, outputFilePath, texts) {
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
          extractDir(filePath, type, outputFilePath, texts);
        } else {
          const extname = path.extname(filePath);
          if (extname === ".html" && (type === undefined || type === "html")) {
            extractHtml(filePath, addTextsAndWrite(texts, outputFilePath));
          } else if ((extname === ".js" || extname === ".ts") && (type === undefined || type === "js")) {
            extractTs(filePath, addTextsAndWrite(texts, outputFilePath));
          }
        }
      });
    });
  });
}

function addTextsAndWrite(texts, outputFilePath) {
  return (err, fileTexts) => {
    if (!err && fileTexts && fileTexts.length > 0) {
      texts.push(...fileTexts);
      writeTextMapFile(outputFilePath, texts);
    }
  };
}
