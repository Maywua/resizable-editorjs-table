import {
  createTag,
  insertBefore,
  getRelativeCoordsOfTwoElems,
} from "./utils/dom.js";
import throttled from "./utils/throttled.js";
import Toolbox from "./toolbox.js";
const CSS = {
  wrapper: "wu-wrap",
  wrapperReadOnly: "wu-wrap-readonly",
  table: "wu-table",
  row: "wu-row",
  cell: "wu-cell",
};
// 默认单元格宽度
const defaultCellWidth = 100;
const minCellWidhth = 50;
export default class Table {
  constructor(readOnly, api, data, config) {
    this.data = data;
    this.config = config;
    this.api = api;
    this.readOnly = readOnly;

    this.wrapper = null;
    this.table = null;
    this.colWidthArr = [];
    // 鼠标移动数据
    this.hoveredRow = 0;
    this.hoveredCol = 0;
    this.hoveredCell = null;
    // 鼠标拖拽数据
    this.isDragging = false;
    this.draggingRow = 0;
    this.draggingCol = 0;
    this.draggingColArr = null;
    this.startWidth = 0;
    this.mouseStartX = 0;
    // 鼠标焦点数据
    this.focusedCell = {
      row: 0,
      col: 0,
    };

    // 创建最外层容器
    this.createTableWrapper();
    // 创建初始的行列
    this.resize();
    // 将数据填入单元格中
    if (this.data.colWidth.length !== 0) {
      this.colWidthArr = this.data.colWidth;
    }
    this.fill();
    // 绑定事件
    this.bindEvents();

    // 工具栏数据
    this.toolboxRow = 1;
    this.toolboxCol = 1;
    this.columnToolbox = this.createColumnToolbox();
    this.rowToolbox = this.createRowToolbox();
    this.updateToolboxPosition();
  }
  // 静态方法：获取最外层容器
  getWrapper() {
    return this.wrapper;
  }
  // 创建初始的行数列数
  resize() {
    const { rows, cols } = this.computeInitialSize();
    for (let i = 0; i < rows; i++) {
      this.addRow();
    }
    for (let i = 0; i < cols; i++) {
      this.addColumn();
    }
  }
  // 获取初始的行数列数
  computeInitialSize() {
    const content = this.data && this.data.content;
    const isValidArray = Array.isArray(content);
    const isNotEmptyArray = isValidArray ? content.length : false;
    const contentRows = isValidArray ? content.length : undefined;
    const contentCols = isNotEmptyArray ? content[0].length : undefined;
    const parsedRows = Number.parseInt(this.config && this.config.rows);
    const parsedCols = Number.parseInt(this.config && this.config.cols);
    //
    const configRows =
      !isNaN(parsedRows) && parsedRows > 0 ? parsedRows : undefined;
    const configCols =
      !isNaN(parsedCols) && parsedCols > 0 ? parsedCols : undefined;
    const defaultRows = 2;
    const defaultCols = 2;
    const rows = contentRows || configRows || defaultRows;
    const cols = contentCols || configCols || defaultCols;

    return {
      rows: rows,
      cols: cols,
    };
  }
  // 使用数据填充单元格
  fill() {
    const data = this.data;
    if (data && data.content) {
      for (let i = 0; i < data.content.length; i++) {
        for (let j = 0; j < data.content[i].length; j++) {
          this.setCellContent(i + 1, j + 1, data.content[i][j]);
        }
      }
    }
    this.updateColumnWidth();
  }
  // 创建单元格时将数据填入单元格
  fillRow(row, numberOfColumns) {
    for (let i = 1; i <= numberOfColumns; i++) {
      const newCell = this.createCell();
      row.appendChild(newCell);
    }
  }
  // 根据数据更新所有列宽
  updateColumnWidth() {
    const widths = this.colWidthArr;
    const rows = this.table.querySelectorAll(`.${CSS.row}`);
    rows.forEach((row) => {
      const cells = row.querySelectorAll(`.${CSS.cell}`);
      cells.forEach((cell, index) => {
        cell.style.width = widths[index] + "px";
      });
    });
  }
  // 创建表格外层容器
  createTableWrapper() {
    this.wrapper = createTag("div", CSS.wrapper);
    this.table = createTag("div", CSS.table);
    if (this.readOnly) {
      this.wrapper.classList.add(CSS.wrapperReadOnly);
    }
    this.wrapper.appendChild(this.table);
  }
  // 创建单元格
  createCell() {
    return createTag("div", CSS.cell, {
      contentEditable: !this.readOnly,
    });
  }
  // 创建列工具栏
  createColumnToolbox() {
    return new Toolbox({
      wrapper: this.wrapper,
      api: this.api,
      type: "col",
      items: [
        {
          label: "insert left",
          icon: null,
          handleClick: () => {
            this.addColumn(this.toolboxCol, true);
            this.updateColumnWidth();
            this.updateToolboxPosition();
          },
        },
        {
          label: "insert right",
          icon: null,
          handleClick: () => {
            this.addColumn(this.toolboxCol + 1, true);
            this.updateColumnWidth();
            this.updateToolboxPosition();
          },
        },
        {
          label: "delete",
          icon: null,
          handleClick: () => {
            this.deleteColumn(this.toolboxCol);
            this.updateColumnWidth();
          },
        },
      ],
      handleOpen: () => {},
      handleClose: () => {},
    });
  }
  // 创建行工具栏
  createRowToolbox() {
    return new Toolbox({
      wrapper: this.wrapper,
      api: this.api,
      type: "row",
      items: [
        {
          label: "insert above",
          icon: null,
          handleClick: () => {
            this.addRow(this.toolboxRow, true);
            this.updateColumnWidth();
            this.updateToolboxPosition();
          },
        },
        {
          label: "insert down",
          icon: null,
          handleClick: () => {
            this.addRow(this.toolboxRow + 1, true);
            this.updateColumnWidth();
            this.updateToolboxPosition();
          },
        },
        {
          label: "delete",
          icon: null,
          handleClick: () => {
            this.deleteRow(this.toolboxRow);
          },
        },
      ],
      handleOpen: () => {},
      handleClose: () => {},
    });
  }
  // 添加新行
  addRow(index = -1, setFocus = false) {
    let insertedRow;
    let rowElem = createTag("div", CSS.row);
    let numberOfColumns = this.numberOfColumns;
    if (index > 0 && index <= this.numberOfRows) {
      let row = this.getRow(index);
      insertedRow = insertBefore(rowElem, row);
    } else {
      insertedRow = this.table.appendChild(rowElem);
    }
    this.fillRow(insertedRow, numberOfColumns);

    // 设置焦点
    const firstCell = insertedRow.querySelector(`.${CSS.cell}:first-child`);
    if (firstCell && setFocus) {
      this.focusedCell.row = index;
      this.focusedCell.col = 1;
      this.focusCell();
    }
  }
  // 添加新列
  addColumn(columnIndex = -1, setFocus = false) {
    let numberOfColumns = this.numberOfColumns;
    for (let rowIndex = 1; rowIndex <= this.numberOfRows; rowIndex++) {
      let cell;
      const cellElem = this.createCell();
      if (columnIndex > 0 && columnIndex <= numberOfColumns) {
        cell = this.getCell(rowIndex, columnIndex);
        insertBefore(cellElem, cell);
      } else {
        cell = this.getRow(rowIndex).appendChild(cellElem);
      }

      // 设置焦点
      if (rowIndex === 1) {
        const cellCol = columnIndex > 0 ? columnIndex : numberOfColumns + 1;
        const firstCell = this.getCell(rowIndex, cellCol);
        if (firstCell && setFocus) {
          this.focusedCell.row = rowIndex;
          this.focusedCell.col = cellCol;
          this.focusCell();
        }
      }
    }
    // 在列宽数组中加入列
    this.colWidthArr.splice(columnIndex - 1, 0, defaultCellWidth);
  }
  // 删除列
  deleteColumn(index) {
    if (this.numberOfColumns === 1) return;
    // 如果删除的列在最尾，将焦点给前一列
    if (this.focusedCell.col === this.numberOfColumns)
      this.focusedCell.col -= 1;
    // 删除结点
    for (let i = 1; i <= this.numberOfRows; i++) {
      const cell = this.getCell(i, index);
      if (!cell) return;
      cell.remove();
    }
    // 更新列宽数据
    this.colWidthArr.splice(index - 1, 1);
    // 设置焦点
    this.focusCell(this.focusedCell);
    // 更新工具栏
    this.toolboxCol = this.focusedCell.col;
    this.toolboxRow = this.focusedCell.row;
    this.updateToolboxPosition();
  }
  // 删除行
  deleteRow(index) {
    if (this.numberOfRows === 1) return;
    // 如果删除的行在最尾，将焦点给上一行
    if (this.focusedCell.row === this.numberOfRows) this.focusedCell.row -= 1;
    // 删除结点
    this.getRow(index).remove();
    // 设置焦点
    this.focusCell(this.focusedCell);
    // 更新工具栏
    this.toolboxCol = this.focusedCell.col;
    this.toolboxRow = this.focusedCell.row;
    this.updateToolboxPosition();
  }
  // 根据行数获取行
  getRow(row) {
    return this.table.querySelector(`.${CSS.row}:nth-child(${row})`);
  }
  // 根据单元格获取行
  getRowByCell(cell) {
    return cell.parentElement;
  }
  // 获取同一列的所有单元格
  getCellInCol(col) {
    const cells = [];
    const rows = this.table.querySelectorAll(`.${CSS.row}`);
    rows.forEach((row) => {
      const cell = row.querySelector(`.${CSS.cell}:nth-child(${col})`);
      if (cell) cells.push(cell);
    });
    return cells;
  }
  // 根据行列获取单元格
  getCell(row, column) {
    return this.table.querySelectorAll(
      `.${CSS.row}:nth-child(${row}) .${CSS.cell}`
    )[column - 1];
  }
  // 设置单元格的html内容
  setCellContent(row, column, content) {
    const cell = this.getCell(row, column);
    cell.innerHTML = content;
  }
  // 将焦点给予当前的单元格
  focusCell() {
    this.focusedCellElem.focus();
    this.updateToolboxPosition();
  }
  // 获取焦点所在的单元格
  get focusedCellElem() {
    const { row, col } = this.focusedCell;
    return this.getCell(row, col);
  }
  // 获取行数
  get numberOfRows() {
    return this.table.childElementCount;
  }
  // 获取列数
  get numberOfColumns() {
    if (this.numberOfRows) {
      return this.table.querySelectorAll(`.${CSS.row}:first-child .${CSS.cell}`)
        .length;
    }
    return 0;
  }
  // 外部获取数据
  getData() {
    const data = [];
    for (let i = 1; i <= this.numberOfRows; i++) {
      const row = this.table.querySelector(`.${CSS.row}:nth-child(${i})`);
      const cells = Array.from(row.querySelectorAll(`.${CSS.cell}`));
      // 是否在复制时移除空行
      // const isEmptyRow = cells.every((cell) => !cell.textContent.trim());
      // if (isEmptyRow) {
      //   continue;
      // }
      data.push(cells.map((cell) => cell.innerHTML));
    }
    return data;
  }
  // 外部获取列宽
  getColWidth() {
    return this.colWidthArr;
  }
  // 绑定所有事件
  bindEvents() {
    // 鼠标点击事件：判定是否在表格内部
    document.addEventListener("mousedown", (e) =>
      this.handleDocumentMousedown(e)
    );
    // 鼠标移动事件：获取当前鼠标所在的单元格
    this.table.addEventListener(
      "mousemove",
      throttled(150, (e) => this.handleMouseMoveOnTable(e)),
      { passive: true }
    );
    // 焦点事件：获取当前聚焦的单元格索引
    this.table.addEventListener("focusin", (e) => this.handleFocusInTable(e));
    // tab按键事件
    this.table.addEventListener("keydown", (e) => this.handleKeyDown(e));
    // enter按键事件
    this.table.addEventListener("keypress", (e) => this.handleKeyPress(e));
    // 滚动条事件
    this.table.addEventListener("scroll", (e) => this.handleTableScroll(e));
  }
  // mousedown事件
  handleDocumentMousedown = (e) => {
    // 在表格内部按下鼠标并且处于拖拽位置
    if (this.wrapper.contains(e.target)) {
      if (e.target.classList.contains("cell-resizable")) {
        e.preventDefault();
        this.hideToolbox(); // 拖拽时隐藏工具栏
        this.isDragging = true;
        this.table.classList.add("table-resizing"); //为整个表格添加光标样式
        document.addEventListener("mousemove", this.handleDocumentMousemove);
        document.addEventListener("mouseup", this.handleDocumentMouseup);
        this.draggingRow = this.hoveredRow;
        this.draggingCol = this.hoveredCol;
        this.draggingColArr = this.getCellInCol(this.draggingCol);
        this.startWidth = this.colWidthArr[this.draggingCol - 1]; //获取初始宽度
        this.mouseStartX = e.clientX;
      }
    } else {
      this.hideToolbox();
    }
  };
  // mousemove事件
  handleDocumentMousemove = (e) => {
    if (!this.isDragging) return;
    const currentMouseX = e.clientX;
    const deltaX = currentMouseX - this.mouseStartX;
    const newWidth = Math.max(this.startWidth + deltaX, minCellWidhth);
    this.colWidthArr[this.draggingCol - 1] = newWidth;
    this.draggingColArr.forEach((cell) => {
      cell.style.width = newWidth + "px";
    });
  };
  // mouseup事件
  handleDocumentMouseup = (e) => {
    this.showToolbox(); // 拖拽结束时重新显示工具栏
    this.updateToolboxPosition();
    this.isDragging = false;
    this.table.classList.remove("table-resizing");
    document.removeEventListener("mousemove", this.handleDocumentMousemove);
    document.removeEventListener("mouseup", this.handleDocumentMouseup);
  };
  // 鼠标在表格上移动时的事件
  handleMouseMoveOnTable(e) {
    const { row, col, deltaXCell, deltaYCell } = this.getHoveredCell(e);
    if (
      this.hoveredCell !== null &&
      this.hoveredCell.classList.contains("cell-resizable")
    )
      this.hoveredCell.classList.remove("cell-resizable");
    this.hoveredCell = this.getCell(row, col);
    this.hoveredCol = col;
    this.hoveredRow = row;
    // 判断是否可以调整列宽
    if (this.cellIsResizable(this.hoveredCell, deltaXCell)) {
      // 将鼠标改为拖拽光标
      if (!this.hoveredCell.classList.contains("cell-resizable"))
        this.hoveredCell.classList.add("cell-resizable");
    }
  }
  // 获取焦点事件
  handleFocusInTable(e) {
    const cell = e.target;
    const row = this.getRowByCell(cell);
    this.focusedCell = {
      row:
        Array.from(this.table.querySelectorAll(`.${CSS.row}`)).indexOf(row) + 1,
      col: Array.from(row.querySelectorAll(`.${CSS.cell}`)).indexOf(cell) + 1,
    };
    // 更新工具栏
    this.toolboxCol = this.focusedCell.col;
    this.toolboxRow = this.focusedCell.row;
    this.showToolbox();
    this.updateToolboxPosition();
  }
  // keyPress事件
  handleKeyPress(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) return true;
      this.handleEnterPress();
    }
    return e.key !== "Enter";
  }
  // keydown事件
  handleKeyDown(e) {
    switch (e.key) {
      case "Tab": {
        e.stopPropagation();
        break;
      }
      case "ArrowUp": {
        e.stopPropagation();
        this.handleUpArrowPress(e);
        break;
      }
      case "ArrowDown": {
        e.stopPropagation();
        this.handleDownArrowPress(e);
        break;
      }
      case "ArrowLeft": {
        // e.preventDefault();
        e.stopPropagation();
        this.handleLeftArrowPress(e);
        break;
      }
      case "ArrowRight": {
        // e.preventDefault();
        e.stopPropagation();
        this.handleRightArrowPress(e);
        break;
      }
    }
  }
  // 按下回车切换到下一行或再创建一行
  handleEnterPress() {
    if (this.focusedCell.row !== this.numberOfRows) {
      this.focusedCell.row += 1;
      this.focusCell();
    } else {
      // 光标位于最下时创建新的一行
      this.addRow();
      this.focusedCell.row += 1;
      this.focusCell();
      this.updateColumnWidth();
      this.updateToolboxPosition();
    }
  }
  // 上箭头按键事件
  handleUpArrowPress(e) {
    // 焦点移动到上一行
    if (this.focusedCell.row !== 1) {
      this.focusedCell.row -= 1;
      this.focusCell();
      // 将光标设置到单元格末尾
      this.setCaret(
        this.focusedCellElem,
        this.focusedCellElem.innerText.length
      );
      e.preventDefault();
    }
  }
  // 下箭头按键事件
  handleDownArrowPress(e) {
    // 焦点移动到下一行
    if (this.focusedCell.row !== this.numberOfRows) {
      this.focusedCell.row += 1;
      this.focusCell();
      // 将光标设置到单元格末尾
      this.setCaret(
        this.focusedCellElem,
        this.focusedCellElem.innerText.length
      );
      e.preventDefault();
    }
  }
  // 左箭头按键事件
  handleLeftArrowPress(e) {
    // 获取光标在单元格内的位置
    const currentCell = this.focusedCellElem;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(currentCell);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretOffset = preCaretRange.toString().length;

    // 如果光标在单元格开始则焦点移动到上一列
    if (caretOffset === 0 && this.focusedCell.col !== 1) {
      this.focusedCell.col -= 1;
      this.focusCell();
      // 将光标设置到单元格末尾
      this.setCaret(
        this.focusedCellElem,
        this.focusedCellElem.innerText.length
      );
      e.preventDefault();
    }
  }
  // 右箭头按键事件
  handleRightArrowPress(e) {
    // 获取光标在单元格内的位置
    let currentCell = this.focusedCellElem;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(currentCell);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    const caretOffset = preCaretRange.toString().length;
    // 单元格内容的长度
    const cellTextLength = currentCell.innerText.length;

    // 如果光标在单元格末尾则焦点移动到下一列
    if (
      caretOffset === cellTextLength &&
      this.focusedCell.col !== this.numberOfColumns
    ) {
      this.focusedCell.col += 1;
      this.focusCell();
      // 将光标设置到单元格开始
      this.setCaret(this.focusedCellElem, 0);
      e.preventDefault();
    }
  }
  // 滚动条事件
  handleTableScroll() {
    this.updateToolboxPosition();
  }
  // 将鼠标光标设置到单元格的指定位置
  setCaret(el, index = 0) {
    const range = document.createRange();
    const sel = window.getSelection();

    if (el.childNodes.length !== 0) {
      range.setStart(el.childNodes[0], index);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
  // 获取当前鼠标悬停的单元格索引
  getHoveredCell(e) {
    let hoveredRow = this.hoveredRow;
    let hoveredCol = this.hoveredCol;
    // 获取表格和鼠标的客户端坐标
    const { width, height, x, y } = this.table.getBoundingClientRect();
    const { clientX, clientY } = e;
    // 获取鼠标在表格中的位置
    const deltaX = clientX - x;
    const deltaY = clientY - y;
    // 二分查找列数
    if (deltaX >= 0) {
      hoveredCol = this.binSearch(
        this.numberOfColumns,
        (mid) => this.getCell(1, mid),
        ({ fromLeftBorder }) => deltaX < fromLeftBorder,
        ({ fromRightBorder }) => deltaX > width - fromRightBorder
      );
    }
    // 二分查找行数
    if (deltaY >= 0) {
      hoveredRow = this.binSearch(
        this.numberOfRows,
        (mid) => this.getCell(mid, 1),
        ({ fromTopBorder }) => deltaY < fromTopBorder,
        ({ fromBottomBorder }) => deltaY > height - fromBottomBorder
      );
    }
    const row = hoveredRow || this.hoveredRow;
    const col = hoveredCol || this.hoveredCol;
    // 获取鼠标在单元格内的坐标
    const { deltaXCell, deltaYCell } = this.getMousePositionRelateToCell(
      row,
      col,
      deltaX,
      deltaY
    );
    return { row, col, deltaXCell, deltaYCell };
  }
  // 二分查找函数
  binSearch(numberOfCells, getCell, beforeTheLeftBorder, afterTheRightBorder) {
    let leftBorder = 0;
    let rightBorder = numberOfCells + 1;
    let totalIterations = 0;
    let mid;

    while (leftBorder < rightBorder - 1 && totalIterations < 10) {
      mid = Math.ceil((leftBorder + rightBorder) / 2);
      const cell = getCell(mid);
      // 获取单元格相对于表格的坐标
      const relativeCoords = getRelativeCoordsOfTwoElems(this.table, cell);
      // 判断鼠标相对于表格的坐标是在左侧还是右侧
      if (beforeTheLeftBorder(relativeCoords)) {
        rightBorder = mid;
      } else if (afterTheRightBorder(relativeCoords)) {
        leftBorder = mid;
      } else break; // mid=mid时退出

      totalIterations++;
    }

    // 返回找到的索引
    return mid;
  }
  // 获取鼠标相对于单元格的坐标
  getMousePositionRelateToCell(row, col, deltaX, deltaY) {
    const cell = this.getCell(row, col);
    const { fromTopBorder, fromLeftBorder } = getRelativeCoordsOfTwoElems(
      this.table,
      cell
    );
    return {
      deltaXCell: deltaX - fromLeftBorder,
      deltaYCell: deltaY - fromTopBorder,
    };
  }
  // 判断单元格是否达成调整宽度的条件
  cellIsResizable(cell, deltaX) {
    // 判断光标是否在单元格右侧10px的位置
    const cellWidth = cell.clientWidth;
    return cellWidth - deltaX <= 10;
  }
  // 显示所有工具栏
  showToolbox() {
    this.columnToolbox.show();
    this.rowToolbox.show();
  }
  // 隐藏所有工具栏
  hideToolbox() {
    this.columnToolbox.hide();
    this.rowToolbox.hide();
  }
  // 根据所在行列更新工具栏显示的位置
  updateToolboxPosition() {
    const cell = this.getCell(this.toolboxRow, this.toolboxCol);
    const { fromTopBorder, fromLeftBorder } = getRelativeCoordsOfTwoElems(
      this.table,
      cell
    );
    const toolboxLeft = fromLeftBorder + cell.offsetWidth / 2;
    const toolboxTop = fromTopBorder + cell.offsetHeight / 2;
    //
    this.columnToolbox.setLeft(toolboxLeft);
    this.rowToolbox.setTop(toolboxTop);
  }
}
