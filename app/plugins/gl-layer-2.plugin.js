import { maplibreLayer } from "./maplibre-layer.helper.js";

let timestamp = 0;

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
  style = {
    version: 8,
    sources: {
      overlay: {
        type: "vector",
        tiles: ["./tilesets/gloric_ca_vector/{z}/{x}/{y}.pbf"],
        errorTileURL: "data:application/x-protobuf;base64,",
        minzoom: 1,
        maxzoom: 6,
      },
    },
    layers: [
      {
        id: "overlay",
        source: "overlay",
        "source-layer": "gloric",
        type: "line",
        paint: {
          "line-color": [
            "case",
            ["==", ["at", ["get", "Temp_av"], 1], null],
            "hsl(0, 100%, 30%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 33.9],
            "hsl(0, 100%, 100%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 38.6],
            "hsl(0, 100%, 95%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 41.6],
            "hsl(0, 100%, 90%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 44.1],
            "hsl(0, 100%, 85%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 45.7],
            "hsl(0, 100%, 80%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 47.0],
            "hsl(0, 100%, 75%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 48.8],
            "hsl(0, 100%, 70%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 50.4],
            "hsl(0, 100%, 65%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 52.0],
            "hsl(0, 100%, 60%)",
            ["<=", ["at", ["get", "Temp_av"], 1], 56.8],
            "hsl(0, 100%, 55%)",
            "hsl(0, 100%, 50%)",
          ],
          "line-opacity": 0.75,
          "line-width": [
            "case",
            ["==", ["get", "Log_spow"], null],
            2,
            ["<=", ["get", "Log_spow"], 2],
            2,
            ["<=", ["get", "Log_spow"], 3],
            3,
            ["<=", ["get", "Log_spow"], 4],
            4,
            ["<=", ["get", "Log_spow"], 5],
            5,
            6,
          ],
        },
      },
    ],
  };
  eventLayerId = "overlay";
  metadataStateKey = "metadata";
  ignoredMetadataPrefix = "mockTimeSeries";
  timestampCount = 10;
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
    this.shadowRoot.innerHTML = /* html */ `
      <input type="range" value="0" min="0" max="${this.timestampCount - 1}"/>
    `;
    this.shadowRoot
      .querySelector("input")
      .addEventListener("change", ({ currentTarget }) => {
        const newStyle = JSON.parse(JSON.stringify(this.style));
        timestamp = currentTarget.value;
        newStyle.layers[0].paint = {
          "line-color": [
            "case",
            ["==", ["get", "mockTimeSeries" + timestamp], null],
            "hsl(0, 100%, 30%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.1],
            "hsl(0, 100%, 100%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.2],
            "hsl(0, 100%, 95%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.3],
            "hsl(0, 100%, 90%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.4],
            "hsl(0, 100%, 85%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.5],
            "hsl(0, 100%, 80%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.6],
            "hsl(0, 100%, 75%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.7],
            "hsl(0, 100%, 70%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.8],
            "hsl(0, 100%, 65%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 0.9],
            "hsl(0, 100%, 60%)",
            ["<=", ["get", "mockTimeSeries" + timestamp], 1],
            "hsl(0, 100%, 55%)",
            "hsl(0, 100%, 50%)",
          ],
          "line-opacity": 0.75,
          "line-width": [
            "case",
            ["==", ["get", "Log_spow"], null],
            2,
            ["<=", ["get", "Log_spow"], 2],
            2,
            ["<=", ["get", "Log_spow"], 3],
            3,
            ["<=", ["get", "Log_spow"], 4],
            4,
            ["<=", ["get", "Log_spow"], 5],
            5,
            6,
          ],
        };
        this.#layerInstance.getMaplibreMap().setStyle(newStyle);
      });
  }

  #initializeMapLayer() {
    this.#layerInstance && this.removeMapLayerDelegate?.(this.#layerInstance);
    // TODO this currently only work for resolve relative path for
    for (const key in this.style?.sources ?? {}) {
      const tiles = this.style.sources[key].tiles;
      if (!tiles) {
        continue;
      }
      this.style.sources[key].tiles = this.style.sources[key].tiles.map(
        (tile) => tile?.replace(/^.\//, this.configBaseUrl ?? "./")
      );
    }
    this.#layerInstance = maplibreLayer({
      style: this.style,
      interactive: true,
    });
    this.#layerInstance.on("add", () => {
      this.#layerInstance
        .getMaplibreMap()
        .on("tiledataloading", (e) => {
          debugger;
          e;
        })
        .on("click", this.eventLayerId ?? "", (e) => {
          this.updateSharedStatesDelegate?.({
            ...this.sharedStates,
            [this.metadataStateKey]: e.features?.[0].properties,
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
