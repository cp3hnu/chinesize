import posthtml from 'posthtml';
import fs from 'node:fs';
import { errorLog } from "./utils.js";

/**
 * Format the text
 * @param {string} text The extracted text
 * @returns {string} The formatted text
 */
function formatText(text) {
  if (typeof text === 'string') {
    const trimText = text.trim();
    if (trimText) {
      // Remove comments and interpolated text
      const isInterpolation = trimText.startsWith('{{') && trimText.endsWith('}}');
      const isComment = trimText.startsWith("<!--")
      if (!isInterpolation && !isComment) {
        return trimText
      }
    }
  }

  return undefined;
}

/**
 * Extract the English text from the html
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

      return node;
    });
  };
}

/**
 * Processing the html file
 * @param {string} filePath The path of the html file
 * @param {(error: any | undefined, texts: string[] | undefined) => void} callback The callback function that returns the extracted English text
 */
export default function extractHtml(filePath, callback) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const texts = [];
  posthtml([extractEnglishText(texts)])
  .process(html)
  .then((result) => {
    // console.log('Extracted file: ', filePath);
    callback(undefined, texts);
  })
  .catch((error) => {
    console.log(errorLog(`Error: Processing ${filePath} file.`));
    console.log(errorLog(error));
    callback(error, undefined);
  });
}

