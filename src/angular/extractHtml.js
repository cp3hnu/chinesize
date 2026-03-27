import posthtml from "posthtml";
import fs from "node:fs";
import { errorLog } from "../utils/log.js";

export default function extractHtml(filePath, callback) {
  const html = fs.readFileSync(filePath, "utf-8");
  const texts = [];
  posthtml([extractEnglishText(texts)])
    .process(html)
    .then(() => {
      callback(undefined, texts);
    })
    .catch((error) => {
      console.log(errorLog(`Error: Processing ${filePath} file.`));
      console.log(errorLog(error));
      callback(error, undefined);
    });
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

      return node;
    });
  };
}

function formatText(text) {
  if (typeof text === "string") {
    const trimText = text.trim();
    if (trimText) {
      const isInterpolation = trimText.startsWith("{{") && trimText.endsWith("}}");
      const isComment = trimText.startsWith("<!--");
      if (!isInterpolation && !isComment) {
        return trimText;
      }
    }
  }

  return undefined;
}
