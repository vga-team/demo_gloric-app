import "https://esm.run/leaflet.vectorgrid";
import * as d3 from "https://esm.run/d3";

export default class PluginVectorGridLayer extends HTMLElement {
  //#region VGA host APIs
  sharedStates;
  updateSharedStatesDelegate;
  removeMapLayerDelegate;
  notifyLoadingDelegate;
  addMapLayerDelegate;
  leaflet;
  configBaseUrl;

  obtainHeaderCallback = () => `GL Layer - ${this.displayName}`;

  hostFirstLoadedCallback() {
    const loadingEndDelegate = this.notifyLoadingDelegate?.();
    this.#initializeMapLayer();
    loadingEndDelegate?.();
  }
  //#endregion

  //#region plugin properties
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

    // TODO dirty fix
    // this.leaflet && (this.leaflet.DomEvent.fakeStop = () => true);

    const scaleFillColor = this.fillColor
      ? d3
          .scaleThreshold(this.fillColor.colors ?? [])
          .domain(this.fillColor.thresholds)
      : () => null;
    const scaleStrokeColor = this.strokeColor
      ? d3
          .scaleThreshold(this.strokeColor.colors ?? [])
          .domain(this.strokeColor.thresholds)
      : () => null;
    const scaleStrokeWeight = this.strokeWeight
      ? d3
          .scaleThreshold(this.strokeWeight?.weights ?? [])
          .domain(this.strokeWeight.thresholds)
      : () => 1;

    this.#layerInstance = L.vectorGrid.protobuf(
      this.urlTemplate?.replace(/^.\//, this.configBaseUrl ?? "./") ?? "",
      {
        rendererFactory: L.canvas.tile,
        interactive: true,
        maxNativeZoom: this.maxNativeZoom,
        maxZoom: this.maxZoom,
        vectorTileLayerStyles: {
          [this.vectorLayerName]: (metadata) => {
            return {
              weight: scaleStrokeWeight(
                metadata[this.strokeWeight?.variable ?? ""]
              ),
              color: scaleStrokeColor(
                metadata[this.strokeColor?.variable ?? ""]
              ),
              fillColor: scaleFillColor(
                metadata[this.fillColor?.variable ?? ""]
              ),
              fill: true,
              capacity: 0.75,
            };
          },
        },
      }
    );

    this.#layerInstance?.on("click", ({ layer: { properties } }) =>
      this.updateSharedStatesDelegate?.({
        ...this.sharedStates,
        metadata: properties,
      })
    );

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
