import fs from "node:fs";
import path from "node:path";
import jscodeshift from "jscodeshift";
import { addIgnoreFromFile, addIgnoreFromInput, resetIgnore, shouldIgnore } from "../utils/ignoreFiles.js";

const TARGET_ATTRS = new Set(["title", "placeholder", "label", "text", "alt", "aria-label"]);
const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

export function prepareIgnore(ignorePattern, ignoreConfigFile) {
  resetIgnore();
  if (ignorePattern) {
    addIgnoreFromInput(ignorePattern);
  }
  if (ignoreConfigFile) {
    addIgnoreFromFile(ignoreConfigFile);
  }
}

export function listReactSourceFiles(dir) {
  const files = [];
  visit(dir, files);
  return files;
}

function visit(dir, files) {
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return;
  }

  names.forEach((name) => {
    const filePath = path.join(dir, name);
    if (shouldIgnore(filePath)) {
      return;
    }

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      // File may disappear during traversal, or be inaccessible. Skip safely.
      return;
    }

    if (stat.isDirectory()) {
      visit(filePath, files);
      return;
    }
    if (CODE_EXTENSIONS.has(path.extname(filePath))) {
      files.push(filePath);
    }
  });
}

export function withParser(filePath) {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    return jscodeshift.withParser("tsx");
  }
  if (filePath.endsWith(".ts")) {
    return jscodeshift.withParser("ts");
  }
  return jscodeshift.withParser("babel");
}

export function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  const text = value.trim();
  if (!text) {
    return "";
  }
  if ((text.startsWith("{{") && text.endsWith("}}")) || (text.startsWith("{") && text.endsWith("}"))) {
    return "";
  }
  return text;
}

export function shouldHandleAttr(attrName) {
  if (!attrName) {
    return false;
  }
  const name = String(attrName).toLowerCase();
  return TARGET_ATTRS.has(name) || name.endsWith("label") || name.endsWith("text");
}

export function getPropertyKeyName(key) {
  if (!key) {
    return "";
  }
  if (key.type === "Identifier") {
    return key.name || "";
  }
  if (key.type === "StringLiteral" || key.type === "Literal") {
    return String(key.value || "");
  }
  return "";
}
