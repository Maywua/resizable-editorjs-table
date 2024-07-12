基于[Editor.js](https://editorjs.io)及其拓展[Editorjs/table](https://github.com/editor-js/table)搭建的表格组件。
在表格的基础上新增功能：
1、拖动单元格调整列宽，复制粘贴时保留列宽
2、上下左右方向键按键操作
3、自己制作的工具栏菜单，将鼠标悬浮触发事件改为焦点事件

！[text](/example.png)

## 使用方式
```javascript
import {Table} from "plugin.js"
const editor = EditorJS({
  tools: {
    table: {
      class: Table,
      config: {
        rows: 3,
        cols: 3,
      },
    },
  },
});
```

## 配置参数

| Field              | Type     | Description   |
| ------------------ | -------- | ------------- |
| `rows`             | `number` | 默认创建的行数 |
| `cols`             | `number` | 默认创建的列数 |

### 个人使用，仍需测试，有空改进