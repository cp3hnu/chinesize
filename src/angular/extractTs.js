import posthtml from "posthtml";
import fs from "node:fs";
import { errorLog } from "../utils/log.js";

export default function extractTs(filePath, callback) {
  const template = getTemplateString(filePath);
  if (!template) {
    return;
  }
  const texts = [];
  posthtml([extractEnglishText(texts)])
    .process(template)
    .then(() => {
      callback(undefined, texts);
    })
    .catch((error) => {
      console.log(errorLog(`Error: Processing ${filePath} file.`));
      console.log(errorLog(error));
      callback(error, undefined);
    });
}

function getTemplateString(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const templateStartIndex = html.indexOf("template: `");
  if (templateStartIndex !== -1) {
    const templateEndIndex = html.indexOf("`,", templateStartIndex);
    if (templateEndIndex !== -1) {
      return html.substring(templateStartIndex + "template: `".length, templateEndIndex);
    }
  }

  const htmlStartIndex = html.indexOf("= html`");
  if (htmlStartIndex !== -1) {
    const htmlEndIndex = html.indexOf("`;", htmlStartIndex);
    if (htmlEndIndex !== -1) {
      return html.substring(htmlStartIndex + "= html`".length, htmlEndIndex);
    }
  }

  return undefined;
}

function extractEnglishText(texts) {
  return (tree) => {
    tree.match({ tag: /\b(?!style\b)(?!script\b)(?!code\b)(?!pre\b)\w+/ }, (node) => {
      const content = node.content;
      if (Array.isArray(content)) {
        content.forEach((item) => {
          const text = formatText(item);
          if (text) {
            texts.push(text);
          }
        });
      }

      if (node.attrs && node.attrs.title) {
        const text = formatText(node.attrs.title);
        if (text) {
          texts.push(text);
        }
      }

      if (node.attrs && node.attrs.label) {
        const text = formatText(node.attrs.label);
        if (text) {
          texts.push(text);
        }
      }

      return node;
    });
  };
}

function formatText(text) {
  if (typeof text === "string") {
    const trimText = text.trim();
    if (trimText) {
      const isInterpolation = trimText.startsWith("[[") && trimText.endsWith("]]");
      const isInterpolation2 = trimText.startsWith("{{") && trimText.endsWith("}}");
      const isComment = trimText.startsWith("<!--");
      if (!isInterpolation && !isInterpolation2 && !isComment) {
        return trimText;
      }
    }
  }

  return undefined;
}
