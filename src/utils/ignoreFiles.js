import fs from "node:fs";
import mm from "micromatch";

const matchers = [];

function addIgnorePattern(val) {
  if (val && typeof val === "string" && val[0] !== "#") {
    let pattern = val;
    if (pattern.indexOf("/") === -1) {
      matchers.push("**/" + pattern);
    } else if (pattern[pattern.length - 1] === "/") {
      matchers.push("**/" + pattern + "**");
      matchers.push(pattern + "**");
    }
    matchers.push(pattern);
  }
}

export function addIgnoreFromInput(input) {
  let patterns = [];
  if (input) {
    patterns = patterns.concat(input);
  }
  patterns.forEach(addIgnorePattern);
}

export function addIgnoreFromFile(input) {
  let lines = [];
  let files = [];
  if (input) {
    files = files.concat(input);
  }
  files.forEach((config) => {
    const stats = fs.statSync(config);
    if (stats.isFile()) {
      const content = fs.readFileSync(config, "utf8");
      lines = lines.concat(content.split(/\r?\n/));
    }
  });

  lines.forEach(addIgnorePattern);
}

export function shouldIgnore(filePath) {
  return matchers.length ? mm.isMatch(filePath, matchers, { dot: true }) : false;
}

export function resetIgnore() {
  matchers.length = 0;
}
