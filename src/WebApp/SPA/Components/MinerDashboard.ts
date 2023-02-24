import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";
import { Moment, utc } from "moment";
import {
    IMinerStats,
    IWorkerPerformanceStats,
    IPayment,
    IHashrateNotification,
    IPaymentNotification,
    IMinerSettings,
    IUpdateMinerSettingsRequest,
    MinerSettings, SampleRange
} from "../Backend/Generated";
import { poolService } from "../Services/PoolService";
import { IMinerDetailsModel } from "../Backend/Generated";
import { MinerPaymentList } from "./MinerPaymentList";
import { MinerEarningsList } from "./MinerEarningsList";
import { MinerBalanceList } from "./MinerBalanceList";
import * as Chart from "chart.js";
import { sprintf } from "../Utils/sprintf";
import * as chartColors from "../constants";

declare var modelInit: IMinerDetailsModel;

@Component({
    template: require("./MinerDashboard.html"),
    components: {
        "miner-payment-list": MinerPaymentList,
        "miner-earnings-list": MinerEarningsList,
        "miner-balance-list": MinerBalanceList,
    },
})
export class MinerDashboard extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
        this.poolId = modelInit.poolId;
        this.poolLink = modelInit.poolLink;
        this.poolCurrency = modelInit.poolCurrency;
        this.poolMinimumPayment = modelInit.poolMinimumPayment;
        this.miner = modelInit.miner;
        this.hashrateUnits = modelInit.hashrateUnits;
        this.minerSettings = modelInit.minerSettings || <IMinerSettings> {};

        this.update();

        this.$watch("workerFilter", (n: string, o: string) => {
            this.update();
        });

        this.$watch("perfMode", (n: number, o: number) => {
            this.update();
        });
    }

    public poolId: string = "";
    public poolLink: string = "";
    public poolCurrency: string = "";
    public poolMinimumPayment: number;
    public miner: string = "";
    public minerSettings: IMinerSettings = null;
    public hashrateUnits: string[] = [];
    public payments: IPayment[] = [];
    public minerStats: IMinerStats = null;
    public workers = {} as { [worker: string]: IWorkerPerformanceStats };
    public hasWorkers = false;
    public workerNames: string[] = null;
    public workerNamesFiltered: string[] = null;
    public workerFilter: string = null;
    public workerResultStatus: string = null;
    public totalHashrate: number = 0;
    public lastUpdate: Moment = null;
    public perfMode: string = modelInit.perfMode || "day";

    public settingsIpAddress: string = null;
    public settingsPaymentLimit: string = null;
    public settingsValid = false;
    private settingsDialog: JQuery;

    private collator = new Intl.Collator(undefined, {numeric: true, sensitivity: "base"});
    private ctx: CanvasRenderingContext2D;
    private chart: Chart;

    @Lifecycle
    public mounted(): void {
        this.ctx = (document.getElementById("miner-hashrate-graph") as HTMLCanvasElement).getContext("2d");

        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 10000);

        poolService.notifications.on("onMinerHashrateUpdated", this.onMinerHashrateUpdated);
        poolService.notifications.on("onPayment", this.onPayment);

        // Miner settings
        this.settingsDialog = $('#miner-settings');
        this.settingsDialog.on('show.bs.modal', this.validateSettings);
        this.settingsDialog.on('shown.bs.modal', ()=> this.settingsDialog.find(".ipAddress").first().trigger('focus'));
    }

    public get poolIcon(): string {
        return `/img/coins/${this.poolCurrency.toLowerCase()}.png`;
    }

    private static parsePerfMode(value: string): SampleRange {
        switch(value.toLowerCase()) {
            case "hour":
                return 3;
            case "day":
                return 1;
            case "month":
                return 2;

            default:
                throw new Error(`Unsupported perfMode ${value}`);
        }
    }

    private async update(): Promise<boolean> {
        try {
            this.lastUpdate = utc();

            const response = await poolService.getMinerStats(modelInit.poolId, this.miner, MinerDashboard.parsePerfMode(this.perfMode));

            if (response.success) {
                this.minerStats = response.result;

                // accumulate hashrates
                if (this.minerStats.performance != null) {
                    this.workers = this.minerStats.performance.workers;
                    this.workerNames = Object.keys(this.workers);
                    this.hasWorkers = this.workerNames.filter(x => x != null && x !== "").length > 0;
                    this.totalHashrate = this.workerNames.map(x => this.workers[x].hashrate).reduce((a, b) => a + b);

                    this.updateWorkerList();
                }

                if(this.minerStats.performanceSamples == null) {
                  this.minerStats.performanceSamples = [];
                }

                this.updateChart();

                return true;
            }
        } catch (error) {
            // TODO toast?
        }

        return false;
    }

    private updateWorkerList() {
        if (!!this.workerFilter) {
            const filterLower = this.workerFilter.trim().toLowerCase();
            this.workerNamesFiltered = this.workerNames.filter(x => x.toLowerCase().indexOf(filterLower) !== -1);
        } else {
            this.workerNamesFiltered = this.workerNames;
        }

        this.workerNamesFiltered.sort(this.collator.compare);

        // update status
        const formatString = this.$i18n.t("myStats.formatFilterStatus").toString();
        this.workerResultStatus = sprintf(formatString, this.workerNamesFiltered.length, this.workerNames.length);
    }

    public formatHashrate(hashrate: number): string {
        let i = 0;

        while (hashrate > 1024 && i < this.hashrateUnits.length - 1) {
            hashrate = hashrate / 1024;
            i++;
        }

        return `${hashrate.toFixed(1)} ${this.hashrateUnits[i].trim()}`;
    }

    public updateChart(): void {
        // compute combined hashrate
        const hashrateCombined = this.minerStats.performanceSamples.map((x) =>
            Object.keys(x.workers).reduce((curr, key) => curr + x.workers[key].hashrate, 0));

        const darkMode = document.body.classList.contains("dark-mode");

        const maxHashrate = Math.max.apply(Math, hashrateCombined);
        const hashrateUnits = modelInit.hashrateUnits;
        let hashrateUnit: string;

        // figure out unit
        if (maxHashrate > 0) {
            let hashrate = maxHashrate;
            let i = 0;

            while (hashrate > 1024 && i < hashrateUnits.length - 1) {
                hashrate = hashrate / 1024;
                i++;
            }

            hashrateUnit = hashrateUnits[i];
            const multiplier = hashrate / maxHashrate;

            // scale
            for (i = 0; i < hashrateCombined.length; i++) {
                hashrateCombined[i] *= multiplier;
            }
        } else {
            hashrateUnit = hashrateUnits[0];
        }

        // adjust max value
        const yMin = Math.ceil(Math.min.apply(Math, hashrateCombined));
        const yMax = Math.floor(Math.max.apply(Math, hashrateCombined)) * 1.5;

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, {
            type: "line",
            data: {
                labels: this.perfMode === "hour" ?
                    this.minerStats.performanceSamples.map((x) => x.created.local().format("LT")) :
                    this.minerStats.performanceSamples.map((x) => x.created.local().format("LT")),
                datasets: [{
                    label: "Hashrate in " + (hashrateUnit.trim() || "N/A") + (this.perfMode === "day" ? " (Last 24h)" : " (Last hour )"),
                    fill: "start",
                    data: hashrateCombined,
                    backgroundColor: [
                        "rgba(99, 132, 255, 0.2)",
                    ],
                    borderColor: [
                        "rgba(99,132,255,1)",
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

    public async onMinerHashrateUpdated(msg: IHashrateNotification) {
        if(!msg.worker) {
            await this.update();
        }
    }

    public async onPayment(msg: IPaymentNotification) {
        await this.update();
    }


    //////////////////////
    // Miner-Settings

    private async onChangeMinimumPayout(e: any) {
      this.settingsIpAddress = "";
      this.settingsPaymentLimit = this.minerSettings?.paymentThreshold?.toFixed(4) || this.poolMinimumPayment.toFixed(4);

      this.settingsDialog.modal('show');
    }

    private validateSettings() {
      const limitValid = !Object.is(NaN, parseFloat(this.settingsPaymentLimit));

      const ipValid =
        (/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/.test(this.settingsIpAddress) ||
        /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/.test(this.settingsIpAddress));

      this.settingsValid = limitValid && ipValid;
    }

    public async onSaveSettings() {
      this.settingsDialog.modal('hide');
      this.validateSettings();

      if(this.settingsValid) {
        const amount = parseFloat(this.settingsPaymentLimit);

        if(amount != this.minerSettings.paymentThreshold) {
          const request: IUpdateMinerSettingsRequest = {
            ipAddress: this.settingsIpAddress,
            settings: <MinerSettings> {
              paymentThreshold: amount
            }
          };

          const response = await poolService.updateMinerSettings(this.poolId, this.miner, request);

          if(response.success) {
            this.minerSettings.paymentThreshold = amount;

            toastr.success(this.$i18n.t("myStats.lblPaymentThresholdChanged").toString(), null, { timeOut: 5000, progressBar: true });
          } else {
            toastr.error(response.responseMessageId, null, { timeOut: 5000, progressBar: true });
          }
        }
      }
    }
}
