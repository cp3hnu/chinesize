import fs from "node:fs";
import path from "node:path";

export function ensureDirectoryForFile(filePath) {
  const outputDir = path.dirname(filePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

export function toTextMap(texts) {
  return texts.reduce((obj, text) => {
    obj[text] = text;
    return obj;
  }, {});
}

export function writeTextMapFile(filePath, texts) {
  const jsonObj = toTextMap(texts);
  fs.writeFileSync(filePath, JSON.stringify(jsonObj, null, 2));
}

export function readJsonFile(filePath) {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

export function readIgnorePatterns(ignoreConfigFile) {
  let files = [];
  if (ignoreConfigFile) {
    files = files.concat(ignoreConfigFile);
  }

  const patterns = [];
  files.forEach((configFilePath) => {
    const stats = fs.statSync(configFilePath);
    if (!stats.isFile()) {
      return;
    }
    const content = fs.readFileSync(configFilePath, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line) => {
      const trimLine = line.trim();
      if (trimLine && trimLine[0] !== "#") {
        patterns.push(trimLine);
      }
    });
  });

  return patterns;
}
