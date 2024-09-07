import fs from "node:fs";
import path from "node:path";
import replaceHtml from "./replaceHtml.js";
import replaceTs from "./replaceTs.js";
import { errorLog } from "./utils.js";

/**
 * Recursively replaces English texts in a directory with translations.
 *
 * @param {string} dir - The directory to scan for files.
 * @param {"html" | "js"} type - The type of files to replace translations in.
 * @param {object} translations - An object containing translations.
 * @param {string | undefined} prettierConfig The path of config file for prettier
 */
function replaceDir(dir, type, translations, prettierConfig) {
  fs.readdir(dir, (dirErr, files) => {
    if (dirErr) {
      console.log(errorLog(`Error: Unable to scan ${dir} directory.`));
      console.log(errorLog(dirErr));
      return;
    }
    files.forEach(file => {
      const filePath = path.join(dir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) {
          console.log(
            errorLog(`Error: Unable to retrieve ${filePath} file stats.`)
          );
          console.log(errorLog(err));
          return;
        }
        if (stat.isDirectory()) {
          // Read subdirectories recursively
          replaceDir(filePath, type, translations, prettierConfig);
        } else {
          const extname = path.extname(filePath);
          if (extname === ".html" && (type === undefined || type === "html")) {
            replaceHtml(filePath, translations, prettierConfig);
          } else if (
            (extname === ".js" || extname === ".ts") &&
            (type === undefined || type === "js")
          ) {
            replaceTs(filePath, translations, prettierConfig);
          }
        }
      });
    });
  });
}

/**
 * Replace English texts of Angular project to Chinese
 * @param {string} dir The directory of Angular project
 * @param {"html" | "js" | undefined} type the file type
 * @param {string} input The path of file for reading the Chinese text
 * @param {string | undefined} prettierConfig The path of config file for prettier
 */
export function replace(dir, type, input, prettierConfig) {
  if (!fs.existsSync(dir)) {
    console.log(errorLog(`Error: "${dir}" is not exists`));
    return;
  }

  const dirStat = fs.statSync(dir);
  if (!dirStat.isDirectory()) {
    console.log(errorLog(`Error: "${dir}" is not a directory`));
    return;
  }

  const defaultFileName = type
    ? "texts-to-translate-" + type + ".json"
    : "texts-to-translate.json";
  const inputFilePath = input || path.join(dir, "chinesize", defaultFileName);

  if (!fs.existsSync(inputFilePath)) {
    console.log(errorLog(`Error: "${inputFilePath}" is not exists`));
    return;
  }

  const fileStat = fs.statSync(inputFilePath);
  if (!fileStat.isFile()) {
    console.log(errorLog(`Error: "${inputFilePath}" is not a file`));
    return;
  }

  const data = fs.readFileSync(inputFilePath, "utf-8");
  try {
    const translations = JSON.parse(data);
    if (prettierConfig && !fs.existsSync(prettierConfig)) {
      console.log(errorLog(`Error: "${prettierConfig}" is not exists`));
      return;
    }
    
    replaceDir(dir, type, translations, prettierConfig);
  } catch (err) {
    console.log(errorLog(`Error: "${inputFilePath}" is not a valid JSON`));
    console.log(errorLog(err));
  }
}
