import { maplibreLayer } from "./lib/maplibre-layer.js";

export default class PluginGLLayer extends HTMLElement {
  //#region VGA host APIs
  sharedStates;
  updateSharedStatesDelegate;
  removeMapLayerDelegate;
  notifyLoadingDelegate;
  addMapLayerDelegate;
  leaflet;

  obtainHeaderCallback = () => `GL Layer - ${this.displayName}`;

  hostFirstLoadedCallback() {
    const loadingEndDelegate = this.notifyLoadingDelegate?.();
    this.#initializeMapLayer();
    loadingEndDelegate?.();
  }
  //#endregion

  //#region plugin properties
  style;
  eventLayerId;
  //#endregion

  #layerInstance;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.renderUI();
  }

  renderUI() {
    if (!this.shadowRoot) return;
    this.shadowRoot.adoptedStyleSheets = [this.#styleSheet];
    this.shadowRoot.innerHTML = `This plugin is a map layer plugin and not designed to be use with its own UI, thus the content here is just a placeholder. If later a user control of this plugin is needed, the content can be customized here.`;
  }

  #initializeMapLayer() {
    this.#layerInstance && this.removeMapLayerDelegate?.(this.#layerInstance);
    this.#layerInstance = maplibreLayer({
      style: this.style,
      interactive: true,
    });
    this.#layerInstance.on("add", () => {
      this.#layerInstance
        .getMaplibreMap()
        .on("click", this.eventLayerId ?? "", (e) => {
          this.updateSharedStatesDelegate?.({
            ...this.sharedStates,
            // compatible with gwf-default.metadata plugin and use it to show the metadata
            "gwf-default.metadata": e.features?.[0].properties,
          });
        });
    });
    this.#layerInstance &&
      this.addMapLayerDelegate?.(
        this.#layerInstance,
        this.displayName,
        this.type,
        this.active
      );
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
