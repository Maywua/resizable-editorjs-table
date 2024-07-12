import { createTag } from "./utils/dom.js";
import Table from "./table.js";
import "./styles/table.scss";
import "./styles/toolbox.scss";
import "./styles/menu.scss";
export default class Plugin {
  static get toolbox() {
    return {
      title: "Table",
      icon: '<svg t="1720776122177" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4312" width="30" height="30"><path d="M959.825022 384.002258V191.939717C959.825022 121.2479 902.517291 63.940169 831.825474 63.940169H191.939717C121.2479 63.940169 63.940169 121.2479 63.940169 191.939717v639.885757C63.940169 902.517291 121.2479 959.825022 191.939717 959.825022h639.885757c70.691817 0 127.999548-57.307731 127.999548-127.999548V384.002258zM146.66502 146.66502a63.737872 63.737872 0 0 1 45.336109-18.784682h639.997742A63.961844 63.961844 0 0 1 895.884854 192.001129V320.062089H127.880338V192.001129A63.737872 63.737872 0 0 1 146.66502 146.66502z m269.1267 461.308451v-223.971213h192.181751v223.971213h-192.181751z m192.181751 63.940169v223.971214h-192.181751v-223.971214h192.181751z m-256.12192-63.940169H127.880338v-223.971213h223.971213v223.971213z m-205.186531 269.235073a63.466939 63.466939 0 0 1-18.784682-45.209673V671.91364h223.971213v223.971214H192.001129a63.625887 63.625887 0 0 1-45.336109-18.67631z m749.219834-45.209673A63.763159 63.763159 0 0 1 831.998871 895.884854H671.91364v-223.971214h223.971214v160.085231z m0-224.0254h-223.971214v-223.971213h223.971214v223.971213z" fill="#2c2c2c" p-id="4313"></path></svg>',
    };
  }
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.data = {
      withHeadings: this.getConfig("withHeadings", false, data),
      content: data && data.content ? data.content : [],
      colWidth: data && data.colWidth ? data.colWidth : [],
    };
    this.table = null;
  }
  render() {
    // 实例化Table
    this.table = new Table(this.readOnly, this.api, this.data, this.config);
    // 创建外层容器
    this.container = createTag("div", this.api.styles.block);
    this.container.appendChild(this.table.getWrapper());
    return this.container;
  }
  save() {
    const tableContent = this.table.getData();
    const tableColWidth = this.table.getColWidth();
    const result = {
      withHeadings: this.data.withHeadings,
      content: tableContent,
      colWidth: tableColWidth,
    };
    return result;
  }
  static get isReadOnlySupported() {
    return true;
  }
  static get enableLineBreaks() {
    return true;
  }
  getConfig(configName, defaultValue = undefined, savedData = undefined) {
    const data = this.data || savedData;
    if (data) return data[configName] ? data[configName] : defaultValue;
    return this.config && this.config[configName]
      ? this.config[configName]
      : defaultValue;
  }
  onPaste(event) {
    const table = event.detail.data;

    const firstRowHeading = table.querySelector(
      ":scope > thead, tr:first-of-type th"
    );
    const rows = Array.from(table.querySelectorAll("tr"));

    const content = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      return cells.map((cell) => cell.innerHTML);
    });

    this.data = {
      withHeadings: firstRowHeading !== null,
      content,
      colWidth: [],
    };

    if (this.table.wrapper) {
      this.table.wrapper.replaceWith(this.render());
    }
  }
}
