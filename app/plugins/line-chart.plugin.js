import Chart from "https://esm.run/chart.js/auto";
import zoomPlugin from "https://esm.run/chartjs-plugin-zoom";

const DEFAULT_COLORS = [
  "#8CC63E",
  "#2989E3",
  "#724498",
  "#F02C89",
  "#FB943B",
  "#F4CD26",
];

const FALLBACK_VALUE = Number.NaN;

const VERTICLE_LINE_CHART_PLUGIN = {
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      let x = chart.tooltip._active[0].element.x;
      let yAxis = chart.scales.y;
      let ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "hsl(0, 100%, 50%)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

export default class PluginLineChart extends HTMLElement {
  //#region private
  #metadata;
  #chart;

  get #canvasElement() {
    return this.shadowRoot?.querySelector("#main-container > canvas");
  }
  //#endregion

  //#region VGA host APIs
  set sharedStates(value) {
    this.#metadata = value?.metadata;
    this.#drawChart();
  }

  obtainHeaderCallback = () => this.header ?? `Line Chart`;

  hostFirstLoadedCallback() {}
  //#endregion

  //#region plugin properties
  header;
  dataKey;
  count = 0;
  //#endregion

  connectedCallback() {
    if (this.checkIfPluginIsInTheLargePresenterDelegate?.()) {
      this.style.height = "100%";
    } else {
      this.style.height = "300px";
    }
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [this.#styleSheet];
    this.renderUI();
    Chart.register(zoomPlugin);
  }

  renderUI() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = /* html */ ` <div id="main-container"><canvas></canvas></div>`;
  }

  #drawChart() {
    if (!this.#canvasElement) {
      return;
    }
    let timeSeriesData = this.dataKey
      ? new Array(this.count)
          .fill()
          .map((_, i) => this.#metadata?.[this.dataKey + i.toString()])
      : [];
    if (typeof timeSeriesData === "string") {
      timeSeriesData = JSON.parse(timeSeriesData);
    }
    const data = {
      labels: timeSeriesData.map((_, i) => i),
      datasets: [
        {
          label: this.dataKey,
          data: timeSeriesData,
          backgroundColor: DEFAULT_COLORS?.[0] || "hsl(0, 0%, 0%)",
          borderColor: DEFAULT_COLORS?.[0] || "hsl(0, 0%, 0%)",
          tension: 0.3,
        },
      ],
    };
    const config = {
      type: "line",
      data,
      options: {
        pointRadius: 0,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: "ctrl",
              },
              pinch: {
                enabled: true,
              },
              mode: "xy",
              overScaleMode: "xy",
            },
            pan: {
              enabled: true,
              mode: "xy",
              overScaleMode: "xy",
            },
          },
        },
      },
      plugins: [VERTICLE_LINE_CHART_PLUGIN],
    };
    if (this.#chart) {
      this.#chart.data = data;
      this.#chart.resetZoom();
      this.#chart.update();
    } else if (data.datasets?.[0]?.data?.length > 0) {
      this.#chart = new Chart(this.#canvasElement, config);
    }
  }

  get #styleSheet() {
    const css = /* css */ `
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }

    #main-container {
      position: relative;
      height: 100%;
      width: 100%;
    }
    `;
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(css);
    return styleSheet;
  }
}
