import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";
import * as jscookie from "js-cookie";
import { Moment, utc } from "moment";
import {SpinnerComponent} from "./Spinner";
import {
    IMinerSettings,
    IMinerStats,
    IUpdateMinerSettingsRequest,
    IWorkerPerformanceStats, MinerSettings,
    SampleRange
} from "../Backend/Generated";
import {poolService} from "../Services/PoolService";
import { IPoolDetailsModel } from "../Backend/Generated";

declare var modelInit: IPoolDetailsModel;

@Component({
    template: require("./MinerStats.html"),
    components: {
        "spinner": SpinnerComponent,
    },
})
export class MinerStats extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
        this.cookieName = "minerid_" + modelInit.poolId;

        this.minerAddress = jscookie.get(this.cookieName);

        if (this.minerAddress) {
            this.minerAddress = this.minerAddress.trim();
        }

        this.hasMiner = !!this.minerAddress && this.minerAddress !== "undefined";

        if (this.hasMiner) {
            this.updateStats();
        }
    }

    private cookieName = null as string;

    public isBusy = false;
    public hasMiner = false;
    public hasWorkers = false;
    public workerNames: string[] = null;
    public minerAddress = null as string;
    public stats: IMinerStats = modelInit.minerStats || <IMinerStats> {};
    public settings: IMinerSettings = modelInit.minerSettings || <IMinerSettings> {};
    public totalHashrate: number = 0;
    public poolCurrency: string = modelInit.poolCurrency;
    public poolMinimumPayment = modelInit.poolMinimumPayment;
    public dashboardUrl: string = "";
    public lastUpdate: Moment = null;

    public settingsIpAddress: string = null;
    public settingsPaymentLimit: string = null;
    public settingsValid = false;
    private settingsDialog: JQuery;

    @Lifecycle
    public mounted(): void {
        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 10000);

        setInterval(async () => {
          if(this.hasMiner) {
            await this.updateStats();
          }
        }, 5 * 60000);

        // Miner settings
        this.settingsDialog = $('#miner-settings');
        this.settingsDialog.on('show.bs.modal', this.validateSettings);
        this.settingsDialog.on('shown.bs.modal', ()=> this.settingsDialog.find(".ipAddress").first().trigger('focus'));
    }

    public async onStartTracking(e: Event) {
        if (!!this.minerAddress && this.minerAddress !== "undefined") {
            this.minerAddress = this.minerAddress.trim();

            // strip workername if present
            if(this.minerAddress.indexOf(".") !== -1) {
                this.minerAddress = this.minerAddress.substr(0, this.minerAddress.indexOf(".")).trim();
            }
        }

        if (!!this.minerAddress && this.minerAddress !== "undefined") {
            this.isBusy = true;

            try {
                if (await this.updateStats()) {
                    jscookie.set(this.cookieName, this.minerAddress, { expires: 365 });
                    this.hasMiner = true;
                }
            } finally {
                this.isBusy = false;
            }
        } else {
            this.hasMiner = false;
            jscookie.remove(this.cookieName);
        }
    }

    public formatHashrate(hashrate: number): string {
        let i = 0;

        while (hashrate > 1024 && i < modelInit.hashrateUnits.length - 1) {
            hashrate = hashrate / 1024;
            i++;
        }

        return `${hashrate.toFixed(1)} ${modelInit.hashrateUnits[i].trim()}`;
    }

    private async updateStats(): Promise<boolean> {
        try {
            this.lastUpdate = utc();
            this.hasWorkers = false;
            this.workerNames = [];
            this.totalHashrate = 0;
            this.dashboardUrl = "";

            this.stats = (await poolService.getMinerStats(modelInit.poolId, this.minerAddress, SampleRange.Day))?.result;
            this.settings = (await poolService.getMinerSettings(modelInit.poolId, this.minerAddress))?.result || <IMinerSettings> {};

            // accumulate hashrates
            if (this.stats.performance != null) {
                this.workerNames = Object.keys(this.stats.performance.workers);

                this.hasWorkers = this.workerNames.filter(x => x != null && x !== "").length > 0;
                this.totalHashrate = this.workerNames.map(x => this.stats.performance.workers[x].hashrate).reduce((a, b) => a + b);
            }

            this.dashboardUrl = this.computeDashboardUrl();
            return true;
        } catch (error) {
            // ignore
        }

        return false;
    }

    private computeDashboardUrl(): string {
      const url = modelInit.minerDashboardUrlBase.replace("$account$", this.minerAddress);

      return url;
    }

    //////////////////////
    // Miner-Settings

    private async onChangeMinimumPayout(e: any) {
      this.settingsIpAddress = "";
      this.settingsPaymentLimit = this.settings?.paymentThreshold?.toFixed(4) || this.poolMinimumPayment.toFixed(4);

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

        if(amount != this.settings.paymentThreshold) {
          const request: IUpdateMinerSettingsRequest = {
            ipAddress: this.settingsIpAddress,
            settings: <MinerSettings> {
              paymentThreshold: amount
            }
          };

          const response = await poolService.updateMinerSettings(modelInit.poolId, this.minerAddress, request);

          if(response.success) {
            this.settings.paymentThreshold = amount;

            toastr.success(this.$i18n.t("myStats.lblPaymentThresholdChanged").toString(), null, { timeOut: 5000, progressBar: true });
          } else {
            toastr.error(response.responseMessageId, null, { timeOut: 5000, progressBar: true });
          }
        }
      }
    }
}
