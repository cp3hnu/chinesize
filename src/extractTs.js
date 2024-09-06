import posthtml from 'posthtml';
import fs from 'node:fs';
import { errorLog } from "./utils.js";

/**
 * Add text to the array
 * @param {string} text The extracted text
 * @returns {string | undefined} The formatted text
 */
function formatText(text) {
  if (typeof text === 'string') {
    const trimText = text.trim();
    if (trimText) {
      // Remove comments and interpolated text
      const isInterpolation = trimText.startsWith('[[') && trimText.endsWith(']]');
      const isInterpolation2 = trimText.startsWith('{{') && trimText.endsWith('}}');
      const isComment = trimText.startsWith("<!--")
      if (!isInterpolation && !isInterpolation2 && !isComment) {
        return trimText
      }
    }
  }

  return undefined;
}

/**
 * Extract the English text from the ts template
 * @param {string[]} texts The list of English text
 * @return {function} A function that takes a tree and extracts English text.
 */
function extractEnglishText(texts) {
  return (tree) => {
    tree.match({ tag: /\b(?!style\b)(?!script\b)(?!code\b)(?!pre\b)\w+/ }, (node) => {
      // Texts
      const content = node.content;
      if (Array.isArray(content)) {
        content.forEach((item) => {
          const text = formatText(item);
          text && texts.push(text);
        })
      }
      
      // Title property
      if (node.attrs && node.attrs.title) {
        const text = formatText(node.attrs.title);
        text && texts.push(text);
      }

      // Label property
      if (node.attrs && node.attrs.label) {
        const text = formatText(node.attrs.label);
        text && texts.push(text);
      }

      return node;
    });
  };
}


/**
 * Get the template string from the ts file. 
 * There are two cases: `template` and `html`.
 * @param {string} filePath The path of the ts file
 * @returns {string | undefined} The template text
 */
function getTemplateString(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const templateStartIndex = html.indexOf('template: `');
  if (templateStartIndex !== -1) {
    const templateEndIndex = html.indexOf('`,', templateStartIndex);
    if (templateEndIndex !== -1) {
      return html.substring(templateStartIndex + "template: `".length, templateEndIndex);
    }
  } 

  const htmlStartIndex = html.indexOf('= html`');
  if (htmlStartIndex !== -1) {
    const htmlEndIndex = html.indexOf('`;', htmlStartIndex);
    if (htmlEndIndex !== -1) {
      return html.substring(htmlStartIndex + "= html`".length, htmlEndIndex);
    }
  }
  
  return undefined;
}

/**
 * Processing the ts file
 * @param {string} filePath The path of the ts file
 * @param {(error: any | undefined, texts: string[] | undefined) => void} callback The callback function that returns the extracted English text
 */
export default function extractTs(filePath, callback) {
  const template = getTemplateString(filePath);
  if (!template) {
    return
  }
  const texts = [];
  posthtml([extractEnglishText(texts)])
  .process(template)
  .then((result) => {
    //console.log('Extracted file: ', filePath);
    callback(undefined, texts);
  })
  .catch((error) => {
    console.log(errorLog(`Error: Processing ${filePath} file.`));
    console.log(errorLog(error));
    callback(error, undefined);
  });
}


