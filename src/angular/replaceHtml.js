import posthtml from "posthtml";
import fs from "node:fs";
import { render } from "posthtml-render";
import * as prettier from "prettier";
import { errorLog } from "../utils/log.js";

export default function replaceHtml(filePath, translations, prettierConfig) {
  const html = fs.readFileSync(filePath, "utf-8");
  posthtml([replaceEnglishText(translations)])
    .process(html, {
      recognizeNoValueAttribute: true,
    })
    .then(async (result) => {
      const outputHtml = render(result.tree, {
        singleTags: ["br", "hr", "img", "meta", "link", "input"],
        closingSingleTag: "slash",
        closeEmptyTags: true,
      });

      let resText = outputHtml;
      if (prettierConfig) {
        const options = await prettier.resolveConfig(filePath, {
          config: prettierConfig,
        });
        if (options) {
          resText = await prettier.format(resText, {
            filepath: filePath,
            ...options,
          });
        }
      }
      fs.writeFileSync(filePath, resText);
    })
    .catch((error) => {
      console.log(errorLog(`Error: Processing ${filePath} file.`));
      console.log(errorLog(error));
    });
}

function replaceEnglishText(translations) {
  return (tree) => {
    tree.match({ tag: /\b(?!style\b)(?!script\b)(?!code\b)(?!pre\b)\w+\b/ }, (node) => {
      const content = node.content;
      if (Array.isArray(content)) {
        node.content = content.map((item) => {
          if (typeof item === "string") {
            const text = item.trim();
            if (text && translations[text]) {
              return translations[text];
            }
          }
          return item;
        });
      }

      if (node.attrs && node.attrs.title && typeof node.attrs.title === "string") {
        const text = node.attrs.title.trim();
        if (text && translations[text]) {
          node.attrs.title = translations[text];
        }
      }
      return node;
    });
  };
}
