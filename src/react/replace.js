import fs from "node:fs";
import path from "node:path";
import { ensureDirectoryForFile, readJsonFile } from "../utils/io.js";
import { errorLog } from "../utils/log.js";
import { getPropertyKeyName, listReactSourceFiles, normalizeText, prepareIgnore, shouldHandleAttr, withParser } from "./core.js";

export function replace(dir, input, _prettierConfig, ignorePattern, ignoreConfigFile) {
  if (!fs.existsSync(dir)) {
    console.log(errorLog(`Error: "${dir}" is not exists`));
    return;
  }

  const dirStat = fs.statSync(dir);
  if (!dirStat.isDirectory()) {
    console.log(errorLog(`Error: "${dir}" is not a directory`));
    return;
  }

  const inputFilePath = input || path.join(dir, "chinesize", "texts-to-translate-react.json");
  ensureDirectoryForFile(inputFilePath);
  if (!fs.existsSync(inputFilePath)) {
    console.log(errorLog(`Error: "${inputFilePath}" is not exists`));
    return;
  }

  let translations = {};
  try {
    translations = readJsonFile(inputFilePath);
  } catch (err) {
    console.log(errorLog(`Error: "${inputFilePath}" is not a valid JSON`));
    console.log(errorLog(err));
    return;
  }

  prepareIgnore(ignorePattern, ignoreConfigFile);
  const files = listReactSourceFiles(dir);
  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf-8");
    const j = withParser(filePath);
    const root = j(source);

    root.find(j.JSXText).replaceWith((nodePath) => {
      const raw = nodePath.node.value;
      const text = normalizeText(raw);
      if (text && translations[text]) {
        return j.jsxText(raw.replace(text, translations[text]));
      }
      return nodePath.node;
    });

    root.find(j.JSXAttribute).forEach((nodePath) => {
      const attr = nodePath.node;
      const attrName = attr?.name?.name;
      if (!shouldHandleAttr(attrName) || !attr.value) {
        return;
      }
      replaceInExpression(attr.value, translations);
    });

    root
      .find(j.Node, (node) => node.type === "ObjectExpression" || node.type === "ArrayExpression")
      .forEach((nodePath) => {
        replaceObjectProperties(nodePath.node, translations);
      });

    const output = root.toSource();
    if (output !== source) {
      fs.writeFileSync(filePath, output);
    }
  });
}

function replaceInExpression(node, translations) {
  if (!node) {
    return;
  }
  if (node.type === "StringLiteral" || node.type === "Literal") {
    const text = normalizeText(node.value);
    if (text && translations[text]) {
      node.value = translations[text];
    }
    return;
  }
  if (node.type === "JSXExpressionContainer") {
    replaceInExpression(node.expression, translations);
    return;
  }
  if (node.type === "ConditionalExpression") {
    replaceInExpression(node.consequent, translations);
    replaceInExpression(node.alternate, translations);
    return;
  }
  if (node.type === "LogicalExpression") {
    replaceInExpression(node.right, translations);
    return;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    const text = normalizeText(node.quasis.map((q) => q.value.cooked || "").join(""));
    if (text && translations[text] && node.quasis[0]) {
      node.quasis[0].value.raw = translations[text];
      node.quasis[0].value.cooked = translations[text];
      node.quasis = [node.quasis[0]];
      node.expressions = [];
    }
  }
}

function replaceObjectProperties(node, translations) {
  if (!node) {
    return;
  }

  if (node.type === "ObjectExpression") {
    node.properties.forEach((property) => {
      if (property.type !== "ObjectProperty" && property.type !== "Property") {
        return;
      }
      const keyName = getPropertyKeyName(property.key);
      if (shouldHandleAttr(keyName)) {
        replaceInExpression(property.value, translations);
      }

      if (property.value && (property.value.type === "ObjectExpression" || property.value.type === "ArrayExpression")) {
        replaceObjectProperties(property.value, translations);
      }
    });
    return;
  }

  if (node.type === "ArrayExpression") {
    node.elements.forEach((element) => {
      if (element && (element.type === "ObjectExpression" || element.type === "ArrayExpression")) {
        replaceObjectProperties(element, translations);
      }
    });
  }
}
