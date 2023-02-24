import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";
import * as Chart from "chart.js";
import * as chartColors from "../constants";

import { IPoolDetailsModel } from "../Backend/Generated";

declare var modelInit: IPoolDetailsModel;

@Component({
    template: require("./PoolNetworkDiffChart.html"),
})
export class PoolNetworkDiffChart extends Vue {
    @Lifecycle
    public created(): void {
    }

    private chart: Chart;

    @Lifecycle
    public mounted(): void {
        const ctx = (document.getElementById("pool-network-diff-graph") as HTMLCanvasElement).getContext("2d");

        const darkMode = document.body.classList.contains("dark-mode");

        // adjust max value
        const yMin = Math.ceil(Math.min.apply(Math, modelInit.statsMonthly.map((x) => Math.floor(x.networkDifficulty))));
        const yMax = Math.floor(Math.max.apply(Math, modelInit.statsMonthly.map((x) => Math.floor(x.networkDifficulty)))) * 1.25;

        // compute unit and divider for network diff
        const diffUnits = ["", "K", "M", "B", "T", "Q"];
        let diffUnit: string;
        let diffDivider: number = 1;
        const maxDiff = Math.floor(Math.max.apply(Math, modelInit.statsMonthly.map((x) => Math.floor(x.networkDifficulty))));

        if (maxDiff > 0) {
            let hashrate = maxDiff;

            let i = 0;

            while (hashrate > 1000 && i < diffUnits.length - 1) {
                hashrate = hashrate / 1000;
                diffDivider *= 1000;
                i++;
            }

            diffUnit = diffUnits[i];
        }

        const maxNetworkHashrate = Math.floor(Math.max.apply(Math, modelInit.statsMonthly.map((x) => Math.floor(x.networkHashrate)))) * 1.25;

        let chartConfig: Chart.ChartConfiguration = {
            type: "line",
            data: {
                labels: modelInit.statsMonthly.map((x) => new Date(<any> x.created).toLocaleDateString()),
                datasets: [{
                    label: this.$i18n.t("common.lblNetworkDifficulty").toString(),
                    fill: "start",
                    yAxisID: "yAxisNetworkDiff",
                    data: modelInit.statsMonthly.map((x) => Math.floor(x.networkDifficulty)),
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                    ],
                    borderColor: [
                        "rgba(255, 99, 132,1)",
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
                        id: "yAxisNetworkDiff",
                        position: "right",
                        gridLines: {
                          color: darkMode ? chartColors.gridLineColorDark : chartColors.gridLineColorLight
                        },
                        ticks: {
                            fontColor: darkMode ? chartColors.tickFontColorDark : chartColors.tickFontColorLight,
                            suggestedMin: 0,
                            suggestedMax: yMax,
                            userCallback: (value: number, index: number, values: number[]) => {
                                return Math.floor(value / diffDivider) + diffUnit;
                            },
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
        };

        if (maxNetworkHashrate > 0) {
            // insert dataset
            chartConfig.data.datasets.unshift({
                label: this.$i18n.t("common.lblNetworkHashrate").toString() + " " + (modelInit.networkHashrateUnit.trim() || "N/A"),
                fill: "start",
                yAxisID: "yAxisNetworkHashrate",
                data: modelInit.statsMonthly.map((x) => x.networkHashrate),
                backgroundColor: [
                    "rgba(99, 132, 255, 0.2)",
                ],
                borderColor: [
                    "rgba(99,132,255,1)",
                ],
                borderWidth: 1,
            });

            // insert axis configuration
            chartConfig.options.scales.yAxes.unshift({
                id: "yAxisNetworkHashrate",
                position: "left",
                gridLines: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                ticks: {
                    fontColor: darkMode ? chartColors.tickFontColorDark : chartColors.tickFontColorLight,
                    suggestedMin: 0,
                    suggestedMax: maxNetworkHashrate,
                } as Chart.LinearScale,
            });
        }

        this.chart = new Chart(ctx, chartConfig);
    }
}
