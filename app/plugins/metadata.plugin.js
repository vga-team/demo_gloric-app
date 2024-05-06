export default class PluginMetadata extends HTMLElement {
  //#region VGA host APIs
  set sharedStates(value) {
    this.metadata = value?.metadata;
    this.renderUI();
  }

  obtainHeaderCallback = () => `Metadata`;

  hostFirstLoadedCallback() {}
  //#endregion

  //#region plugin properties
  metadata;
  //#endregion

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [this.#styleSheet];
    this.renderUI();
  }

  renderUI() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = this.metadata
      ? /* html */ `<table>
        ${Object.entries(this.metadata)
          .map(
            ([key, value]) =>
              /* html */ `<tr><td>${key}</td><td>${value}</td><tr>`
          )
          .join("")}
      </table>`
      : "No metadata";
  }

  get #styleSheet() {
    const css = /* css */ `
      :host {
        display: block;
      }
    `;
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    return styleSheet;
  }
}
