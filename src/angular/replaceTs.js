import posthtml from "posthtml";
import fs from "node:fs";
import { render } from "posthtml-render";
import * as prettier from "prettier";
import { errorLog } from "../utils/log.js";

export default function replaceTs(filePath, translations, prettierConfig) {
  const { beginText, endText, template } = getTemplateString(filePath);
  if (!template) {
    return;
  }
  posthtml([replaceEnglishText(translations)])
    .process(template, {
      recognizeNoValueAttribute: true,
    })
    .then(async (result) => {
      const outputHtml = render(result.tree, {
        singleTags: ["br", "hr", "img", "meta", "link", "input"],
        closingSingleTag: "slash",
        closeEmptyTags: true,
      });

      let resText = beginText + outputHtml + endText;
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

function getTemplateString(filePath) {
  const html = fs.readFileSync(filePath, "utf-8");
  const templateStartIndex = html.indexOf("template: `");
  if (templateStartIndex !== -1) {
    const templateEndIndex = html.indexOf("`,", templateStartIndex);
    if (templateEndIndex !== -1) {
      const template = html.substring(templateStartIndex + "template: `".length, templateEndIndex);
      const beginText = html.substring(0, templateStartIndex + "template: `".length);
      const endText = html.substring(templateEndIndex);
      return { beginText, endText, template };
    }
  }

  const htmlStartIndex = html.indexOf("= html`");
  if (htmlStartIndex !== -1) {
    const htmlEndIndex = html.indexOf("`;", htmlStartIndex);
    if (htmlEndIndex !== -1) {
      const template = html.substring(htmlStartIndex + "= html`".length, htmlEndIndex);
      const beginText = html.substring(0, htmlStartIndex + "= html`".length);
      const endText = html.substring(htmlEndIndex);
      return { beginText, endText, template };
    }
  }

  return { beginText: "", endText: "", template: "" };
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
      if (node.attrs && node.attrs.label && typeof node.attrs.label === "string") {
        const text = node.attrs.label.trim();
        if (text && translations[text]) {
          node.attrs.label = translations[text];
        }
      }

      return node;
    });
  };
}
