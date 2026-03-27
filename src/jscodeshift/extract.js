const fs = require('fs');

module.exports = function transformer(fileInfo, api) {
  const j = api.jscodeshift.withParser(
    fileInfo.path.endsWith('.tsx') ? 'tsx' : 'ts',
  );
  const texts = [];

  // 查找 Text 节点的英文文本
  j(fileInfo.source)
    .find(j.JSXText)
    .forEach((path) => {
      const value = path.node.value.trim().toLowerCase();
      if (value) {
        texts.push(value);
      }
    });

  // 查找 Text 节点条件表达式、逻辑表达式中的英文文本
  j(fileInfo.source)
    .find(j.JSXElement)
    .forEach((path) => {
      path.node.children.forEach((child) => {
        if (child.type === 'JSXExpressionContainer') {
          const expression = child.expression;
          findConditionalExpressions(expression, texts);
        }
      });
    });

  // 查找 title、placeholder、label、text 属性中的静态英文文本，条件表达式、逻辑表达式中的英文文本
  j(fileInfo.source)
    .find(j.JSXOpeningElement)
    .forEach((path) => {
      path.node.attributes.forEach((attr) => {
        if (
          attr.name &&
          (attr.name.name === 'title' ||
            attr.name.name === 'placeholder' ||
            attr.name.name.toLowerCase().endsWith('label') ||
            attr.name.name.toLowerCase().endsWith('text'))
        ) {
          if (attr.value.type === 'StringLiteral') {
            addText(attr.value, texts);
          } else if (attr.value.type === 'JSXExpressionContainer') {
            const expression = attr.value.expression;
            findConditionalExpressions(expression, texts);
          }
        }
      });
    });

  // 将收集的英文文本写入文件
  if (texts.length > 0) {
    const str = texts.join('，，') + '，，';
    fs.appendFileSync('jscodeshift/texts-to-translate.txt', str);
  }

  return fileInfo.source;
};

// 查找条件表达式和逻辑表达式中的英文呢文本
function findConditionalExpressions(expression, texts) {
  if (!expression) {
    return;
  }
  if (expression.type === 'ConditionalExpression') {
    addText(expression.consequent, texts);
    addText(expression.alternate, texts);
  } else if (expression.type === 'LogicalExpression') {
    addText(expression.right, texts);
  }
}

// 添加提取的英文文本
function addText(node, texts) {
  const value = node.value;
  if (node.type !== 'StringLiteral' || !value) {
    return;
  }
  const trimValue = value.trim().toLowerCase();
  if (trimValue) {
    texts.push(trimValue);
  }
}
