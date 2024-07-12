import Menu from "./menu";
import { createTag } from "./utils/dom";
const CSS = {
  wrapper: "wu-toolbox-wrapper",
  toolbox: "wu-toolbox",
  icon: "wu-toolbox-icon",
};
const iconSize = 15;
const svg = `<svg t="1720427849060" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4279" width="${iconSize}" height="${iconSize}"><path d="M133.310936 296.552327l757.206115 0c19.781623 0 35.950949-16.169326 35.950949-35.950949 0-19.781623-15.997312-35.950949-35.950949-35.950949L133.310936 224.650428c-19.781623 0-35.950949 16.169326-35.950949 35.950949C97.359987 280.383 113.529313 296.552327 133.310936 296.552327z" fill="#515151" p-id="4280"></path><path d="M890.51705 476.135058 133.310936 476.135058c-19.781623 0-35.950949 16.169326-35.950949 35.950949 0 19.781623 16.169326 35.950949 35.950949 35.950949l757.206115 0c19.781623 0 35.950949-16.169326 35.950949-35.950949C926.467999 492.304384 910.298673 476.135058 890.51705 476.135058z" fill="#515151" p-id="4281"></path><path d="M890.51705 727.447673 133.310936 727.447673c-19.781623 0-35.950949 15.997312-35.950949 35.950949s16.169326 35.950949 35.950949 35.950949l757.206115 0c19.781623 0 35.950949-15.997312 35.950949-35.950949S910.298673 727.447673 890.51705 727.447673z" fill="#515151" p-id="4282"></path></svg>`;
export default class Toolbox {
  constructor({ wrapper, api, type, items, handleOpen, handleClose }) {
    //
    // wrapper：表格的外层容器
    // api：editorjs提供的api
    // type：toolbox的类名，col或row两种
    // items：toolbox展开菜单的选项
    // handleOpen：toolbox菜单打开时的回调函数
    // handleClose：toolbox菜单关闭时的回调函数
    //
    this.wrapper = null;
    this.toolbox = null;
    this.wrapper = createTag("div", [CSS.wrapper, `${type}-toolbox`]);
    this.toolbox = createTag("button", CSS.toolbox);
    this.toolbox.innerHTML = svg;
    this.wrapper.appendChild(this.toolbox);
    wrapper.appendChild(this.wrapper);
    //
    this.menu = new Menu({
      wrapper: this.wrapper,
      items: items,
    });
    //
    this.visible = false;
    //
    this.toolbox.addEventListener("click", (e) => this.handleToolboxClick(e));
  }
  // 工具栏图标被点击
  handleToolboxClick = (e) => {
    if (!this.menu.getVisible()) this.menu.show();
    else this.menu.hide();
    document.addEventListener("mousedown", this.handleToolboxToggle);
  };
  // 收起工具栏菜单
  handleToolboxToggle = (e) => {
    // 如果点击位置非工具栏内部
    if (!this.wrapper.contains(e.target)) {
      this.menu.hide();
      document.removeEventListener("mousedown", this.handleToolboxToggle);
    }
  };
  setTop(top) {
    this.wrapper.style.top = top + "px";
  }
  setLeft(left) {
    this.wrapper.style.left = left + "px";
  }
  hide() {
    this.visible = false;
    this.updateVisible();
  }
  show() {
    this.visible = true;
    this.updateVisible();
  }
  updateVisible() {
    this.visible
      ? (this.wrapper.style.display = "block")
      : (this.wrapper.style.display = "none");
  }
}
