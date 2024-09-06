import fs from "node:fs";
import path from "node:path";
import extractHtml from "./extractHtml.js";
import extractTs from "./extractTs.js";
import { errorLog } from "./utils.js";

/**
 * Appends the given file texts to the provided texts array and writes the combined texts to a file.
 *
 * @param {array} texts - The array of texts to be written to the file.
 * @param {string} outputFilePath - The path of the file where the extracted English texts will be written.
 * @return {(error: any | undefined, fileTexts: string[] | undefined) => void} A callback function that takes error and file texts as parameters.
 */
function addTextsAndWrite(texts, outputFilePath) {
  return (err, fileTexts) => {
    if (!err && fileTexts && fileTexts.length > 0) {
      texts.push(...fileTexts);
      // FIXME: write texts to file only once
      const jsonObj = texts.reduce((obj, text) => {
        obj[text] = text;
        return obj;
      }, {});
      const str = JSON.stringify(jsonObj, null, 2);
      fs.writeFileSync(outputFilePath, str);
    }
  };
}

/**
 * Scan directory recursively then extract English texts from html and ts files
 * @param {string} dir The directory of Angular project
 * @param {"html" | "js" | undefined} type The file type
 * @param {string} outputFilePath The path of the file where the extracted English texts will be written.
 * @param {string[]} texts The extracted English texts
 */
function extractDir(dir, type, outputFilePath, texts) {
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
          extractDir(filePath, type, outputFilePath, texts);
        } else {
          const extname = path.extname(filePath);
          if (extname === ".html" && (type === undefined || type === "html")) {
            extractHtml(filePath, addTextsAndWrite(texts, outputFilePath));
          } else if (
            (extname === ".js" || extname === ".ts") &&
            (type === undefined || type === "js")
          ) {
            extractTs(filePath, addTextsAndWrite(texts, outputFilePath));
          }
        }
      });
    });
  });
}

/**
 * Extract English texts of Angular project
 * @param {string} dir The directory of Angular project
 * @param {"html" | "js" | undefined} type the file type
 * @param {string} output The path of the file where the extracted English texts will be written
 */
export function extract(dir, type, output) {
  fs.stat(dir, (err, stat) => {
    if (err) {
      console.log(errorLog(`Error: "${dir}" is not exists`));
      return;
    }
    if (!stat.isDirectory()) {
      console.log(errorLog(`Error: "${dir}" is not a directory`));
      return;
    }

    const defaultFileName = type
      ? "texts-to-translate-" + type + ".json"
      : "texts-to-translate.json";
    const outputFilePath =
      output || path.join(dir, "chinesize", defaultFileName);
    const outputDir = path.dirname(outputFilePath);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const texts = [];
    extractDir(dir, type, outputFilePath, texts);
  });
}
