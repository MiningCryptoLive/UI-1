import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";
import * as Chart from "chart.js";
import * as chartColors from "../constants";

import { IPoolDetailsModel } from "../Backend/Generated";

declare var modelInit: IPoolDetailsModel;

@Component({
    template: require("./PoolHashrateChart.html"),
})
export class PoolHashrateChart extends Vue {
    @Lifecycle
    public created(): void {
    }

    private chart: Chart;

    @Lifecycle
    public mounted(): void {
        const ctx = (document.getElementById("pool-hashrate-graph") as HTMLCanvasElement).getContext("2d");

        const darkMode = document.body.classList.contains("dark-mode");

        // adjust max value
        const yMin = Math.ceil(Math.min.apply(Math, modelInit.stats.map((x) => x.poolHashrate)));
        const yMax = Math.floor(Math.max.apply(Math, modelInit.stats.map((x) => x.poolHashrate))) * 1.5;

        this.chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: modelInit.stats.map((x) => new Date(<any> x.created).toLocaleTimeString()),
                datasets: [{
                    label: this.$i18n.t("common.lblPoolHashrate").toString() +  " " + (modelInit.hashrateUnit.trim() || "N/A"),
                    fill: "start",
                    data: modelInit.stats.map((x) => x.poolHashrate),
                    backgroundColor: [
                        "rgba(99, 255, 132, 0.2)",
                    ],
                    borderColor: [
                        "rgba(99,255,132,1)",
                    ],
                    borderWidth: 1,
                }],
            },
            options: {
                legend: {
                  labels: {
                    fontColor: darkMode ? chartColors.legendFontColorDark : chartColors.legendFontColorLight
                  }
                },
                scales: {
                    yAxes: [{
                        gridLines: {
                          color: darkMode ? chartColors.gridLineColorDark : chartColors.gridLineColorLight
                        },
                        ticks: {
                            fontColor: darkMode ? chartColors.tickFontColorDark : chartColors.tickFontColorLight,
                            suggestedMin: 0,
                            suggestedMax: yMax,
                        } as Chart.LinearScale,
                    }],

                    xAxes: [{
                        gridLines: {
                          color: darkMode ? chartColors.gridLineColorDark : chartColors.gridLineColorLight
                        },
                        ticks: {
                            fontColor: darkMode ? chartColors.tickFontColorDark : chartColors.tickFontColorLight,
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                        },
                    }],
                },
            },
        });
    }
}
