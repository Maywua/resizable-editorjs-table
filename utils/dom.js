// 创建标签
export function createTag(tagName, classNames, attributes = {}) {
  const element = document.createElement(tagName);
  // 添加类名
  if (Array.isArray(classNames)) {
    element.classList.add(...classNames);
  } else if (classNames) {
    element.classList.add(classNames);
  }
  // 添加属性
  for (const attrName in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, attrName)) {
      continue;
    }
    element[attrName] = attributes[attrName];
  }
  return element;
}
// 在某个结点前插入
export function insertBefore(newNode, referenceNode) {
  return referenceNode.parentNode.insertBefore(newNode, referenceNode);
}
// 获取坐标
export function getCoords(elem) {
  if (elem === undefined || null) return null;
  const rect = elem.getBoundingClientRect();

  return {
    y1: Math.floor(rect.top + window.scrollY),
    x1: Math.floor(rect.left + window.scrollX),
    x2: Math.floor(rect.right + window.scrollX),
    y2: Math.floor(rect.bottom + window.scrollY),
  };
}
// 获取两个元素的相对坐标
export function getRelativeCoordsOfTwoElems(firstElem, secondElem) {
  const firstCoords = getCoords(firstElem);
  const secondCoords = getCoords(secondElem);

  if (firstCoords === null || secondCoords === null)
    return {
      fromTopBorder: 0,
      fromLeftBorder: 0,
      fromRightBorder: 0,
      fromBottomBorder: 0,
    };

  return {
    fromTopBorder: secondCoords.y1 - firstCoords.y1,
    fromLeftBorder: secondCoords.x1 - firstCoords.x1,
    fromRightBorder: firstCoords.x2 - secondCoords.x2,
    fromBottomBorder: firstCoords.y2 - secondCoords.y2,
  };
}
