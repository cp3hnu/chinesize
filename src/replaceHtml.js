import posthtml from 'posthtml';
import fs from 'fs';
import {render} from 'posthtml-render';
import * as prettier from "prettier";
import { errorLog } from "./utils.js";

/**
 * Replaces English text in a given tree with translations.
 *
 * @param {object} translations - An object containing translations for English text.
 * @return {function} A function that takes a tree and replaces English text with translations.
 */
function replaceEnglishText(translations) {
  return (tree) => {
    tree.match({ tag: /\b(?!style\b)(?!script\b)(?!code\b)(?!pre\b)\w+\b/ }, (node) => {
      const content = node.content;
      // Texts
      if (Array.isArray(content)) {
        node.content = content.map((item) => {
          if (typeof item === 'string') {
            const text = item.trim();
            if (text && translations[text]) {
              return translations[text];
            }
          }
          return item;
        })
      }
      // Title property
      if (node.attrs && node.attrs.title) {
        if (typeof node.attrs.title === 'string') {
          const text = node.attrs.title.trim();
          if (text && translations[text]) {
            node.attrs.title = translations[text];
          }
        }
        
      }
      return node;
    });
  };
}

/**
 * Replaces English text in an HTML file with translations.
 *
 * @param {string} filePath - The path to the HTML file to process.
 * @param {object} translations - An object containing English text as keys and their translations as values.
 * @param {string | undefined} prettierConfig The path of config file for prettier
 */
export default function repalceHtml(filePath, translations, prettierConfig) {
  const html = fs.readFileSync(filePath, 'utf-8');
  posthtml([replaceEnglishText(translations)])
  .process(html, {
    recognizeNoValueAttribute: true
  })
  .then(async (result) => {
    const outputHtml = render(result.tree, {
      singleTags: ['br', 'hr', 'img', 'meta', 'link', 'input'],
      closingSingleTag: 'slash',
      closeEmptyTags: true
    });

    let resText = outputHtml;
    if (prettierConfig) {
      const options = await prettier.resolveConfig(filePath, {
        config: prettierConfig
      });
      if (options) {
        resText = await prettier.format(resText, {
          filepath: filePath,
          ...options
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