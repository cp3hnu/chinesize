import fs from "node:fs";
import path from "node:path";
import { ensureDirectoryForFile, writeTextMapFile } from "../utils/io.js";
import { errorLog } from "../utils/log.js";
import { getPropertyKeyName, listReactSourceFiles, normalizeText, prepareIgnore, shouldHandleAttr, withParser } from "./core.js";

export function extract(dir, output, ignorePattern, ignoreConfigFile) {
  if (!fs.existsSync(dir)) {
    console.log(errorLog(`Error: "${dir}" is not exists`));
    return;
  }

  const dirStat = fs.statSync(dir);
  if (!dirStat.isDirectory()) {
    console.log(errorLog(`Error: "${dir}" is not a directory`));
    return;
  }

  const outputFilePath = output || path.join(dir, "chinesize", "texts-to-translate-react.json");
  ensureDirectoryForFile(outputFilePath);
  prepareIgnore(ignorePattern, ignoreConfigFile);
  const texts = [];
  const files = listReactSourceFiles(dir);
  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf-8");
    const j = withParser(filePath);
    const root = j(source);

    root.find(j.JSXText).forEach((nodePath) => {
      const text = normalizeText(nodePath.node.value);
      if (text) {
        texts.push(text);
      }
    });

    root.find(j.JSXAttribute).forEach((nodePath) => {
      const attr = nodePath.node;
      const attrName = attr?.name?.name;
      if (!shouldHandleAttr(attrName) || !attr.value) {
        return;
      }
      collectFromExpression(attr.value, texts);
    });

    root
      .find(j.Node, (node) => node.type === "ObjectExpression" || node.type === "ArrayExpression")
      .forEach((nodePath) => {
        collectObjectProperties(nodePath.node, texts);
      });
  });
  writeTextMapFile(outputFilePath, texts);
}

function collectFromExpression(node, texts) {
  if (!node) {
    return;
  }
  if (node.type === "StringLiteral" || node.type === "Literal") {
    const text = normalizeText(node.value);
    if (text) {
      texts.push(text);
    }
    return;
  }
  if (node.type === "JSXExpressionContainer") {
    collectFromExpression(node.expression, texts);
    return;
  }
  if (node.type === "ConditionalExpression") {
    collectFromExpression(node.consequent, texts);
    collectFromExpression(node.alternate, texts);
    return;
  }
  if (node.type === "LogicalExpression") {
    collectFromExpression(node.right, texts);
    return;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    const text = normalizeText(node.quasis.map((q) => q.value.cooked || "").join(""));
    if (text) {
      texts.push(text);
    }
  }
}

function collectObjectProperties(node, texts) {
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
        collectFromExpression(property.value, texts);
      }

      if (property.value && (property.value.type === "ObjectExpression" || property.value.type === "ArrayExpression")) {
        collectObjectProperties(property.value, texts);
      }
    });
    return;
  }

  if (node.type === "ArrayExpression") {
    node.elements.forEach((element) => {
      if (element && (element.type === "ObjectExpression" || element.type === "ArrayExpression")) {
        collectObjectProperties(element, texts);
      }
    });
  }
}
