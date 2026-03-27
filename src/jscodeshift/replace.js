const fs = require('fs');
const translations = JSON.parse(
  fs.readFileSync('jscodeshift/translated-texts.json', 'utf8'),
);

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift.withParser(
    fileInfo.path.endsWith('.tsx') ? 'tsx' : 'ts',
  );

  const root = j(fileInfo.source);
  // 替换 Text 节点的静态英文文本
  root.find(j.JSXText).replaceWith((path) => {
    const value = path.node.value.trim().toLowerCase();
    if (value && translations[value]) {
      return j.jsxText(translations[value]);
    }
    return path.node;
  });

  // 替换 Text 节点的条件表达式、逻辑表达式中的英文文本
  root.find(j.JSXElement).forEach((path) => {
    const jsxElement = path.node;
    jsxElement.children.forEach((child) => {
      if (child.type === 'JSXExpressionContainer') {
        const expression = child.expression;
        replaceConditionalExpressions(expression, translations);
      }
    });
    return path.node;
  });

  // 替换 title、placeholder、label、text 属性中的静态英文文本，条件表达式、逻辑表达式中的英文文本
  root.find(j.JSXOpeningElement).replaceWith((path) => {
    path.node.attributes.forEach((attr) => {
      if (
        attr.name &&
        (attr.name.name === 'title' ||
          attr.name.name === 'placeholder' ||
          attr.name.name.toLowerCase().endsWith('label') ||
          attr.name.name.toLowerCase().endsWith('text'))
      ) {
        if (attr.value.type === 'StringLiteral') {
          replaceValue(attr.value, translations);
        } else if (attr.value.type === 'JSXExpressionContainer') {
          const expression = attr.value.expression;
          replaceConditionalExpressions(expression, translations);
        }
      }
    });
    return path.node;
  });

  return root.toSource();
};

// 替换条件表达式和逻辑表达式中的英文文本
function replaceConditionalExpressions(expression, translations) {
  if (!expression) {
    return;
  }
  if (expression.type === 'ConditionalExpression') {
    replaceValue(expression.consequent, translations);
    replaceValue(expression.alternate, translations);
  } else if (expression.type === 'LogicalExpression') {
    replaceValue(expression.right, translations);
  }
}

// 替换节点英文文本
function replaceValue(node, translations) {
  if (node.type !== 'StringLiteral') {
    return;
  }

  const value = node.value.trim().toLowerCase();
  if (value && translations[value]) {
    node.value = translations[value];
    // node.value = j.stringLiteral(translations[value]);
  }
}
