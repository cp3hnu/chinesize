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

      // Label property
      if (node.attrs && node.attrs.label) {
        if (typeof node.attrs.label === 'string') {
          const text = node.attrs.label.trim();
          if (text && translations[text]) {
            node.attrs.label = translations[text];
          }
        }
      }

      return node;
    });
  };
}

/**
 * Extracts template string from a given file path.
 * There are two cases: `template` and `html`.
 *
 * @param {string} filePath - the path to the file containing the template string
 * @return {object} an object containing the begin text, end text, and template string
 */
function getTemplateString(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const templateStartIndex = html.indexOf('template: `');
  if (templateStartIndex !== -1) {
    const templateEndIndex = html.indexOf('`,', templateStartIndex);
    if (templateEndIndex !== -1) {
      const template = html.substring(templateStartIndex + "template: `".length, templateEndIndex);
      const beginText = html.substring(0, templateStartIndex + "template: `".length);
      const endText = html.substring(templateEndIndex);
      return {
        beginText,
        endText,
        template
      };
    }
  } 

  const htmlStartIndex = html.indexOf('= html`');
  if (htmlStartIndex !== -1) {
    const htmlEndIndex = html.indexOf('`;', htmlStartIndex);
    if (htmlEndIndex !== -1) {
      const template = html.substring(htmlStartIndex + "= html`".length, htmlEndIndex);
      const beginText = html.substring(0, htmlStartIndex + "= html`".length);
      const endText = html.substring(htmlEndIndex);
      return {
        beginText,
        endText,
        template
      };
    }
  }
  
  return {
    beginText: '',
    endText: '',
    template: ''
  };
}

/**
 * Replaces English text in an HTML file with translations.
 *
 * @param {string} filePath - The path to the HTML file to process.
 * @param {object} translations - An object containing English text as keys and their translations as values.
 * @param {string | undefined} prettierConfig The path of config file for prettier
 */
export default function replaceTs(filePath, translations, prettierConfig) {
  const { beginText, endText, template } = getTemplateString(filePath);
  if (!template) {
    return
  }
  posthtml([replaceEnglishText(translations)])
  .process(template, {
    recognizeNoValueAttribute: true
  })
  .then(async (result) => {
    const outputHtml = render(result.tree, {
      singleTags: ['br', 'hr', 'img', 'meta', 'link', 'input'],
      closingSingleTag: 'slash',
      closeEmptyTags: true
    });
    
    let resText = beginText + outputHtml + endText;
    if (prettierConfig) {
      const options = await prettier.resolveConfig(filePath, {
        config: prettierConfig
      });
      if (options) {
        resText = await prettier.format(resText,  {
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
