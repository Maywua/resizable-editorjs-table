import { createTag } from "./utils/dom";
const CSS = {
  wrapper: "wu-toolbox-menu-wrapper",
  menuList: "wu-toolbox-menu-list",
  menuItem: "wu-toolbox-menu-item",
};
export default class Menu {
  constructor({ wrapper, items }) {
    this.wrapper = null;
    this.menuList = null;
    this.createToolboxMenu(wrapper, items);
    //
    this.visible = false;
  }
  createToolboxMenu(wrapper, items) {
    this.wrapper = createTag("div", CSS.wrapper);
    this.menuList = createTag("ul", CSS.menuList);
    items.forEach((item) => {
      const menuItem = createTag("li", CSS.menuItem);
      menuItem.innerText = item.label ? item.label : "";
      // 绑定点击事件
      if (item.handleClick && typeof item.handleClick === "function")
        menuItem.addEventListener("click", (e) => {
          item.handleClick();
          this.hide();
        });
      //
      this.menuList.appendChild(menuItem);
    });
    this.wrapper.appendChild(this.menuList);
    wrapper.appendChild(this.wrapper);
  }
  getVisible() {
    return this.visible;
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
