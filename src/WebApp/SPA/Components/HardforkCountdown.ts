import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";
import { sprintf } from "../Utils/sprintf";
import {poolService} from "../Services/PoolService";
import { INewChainHeightNotification } from "../Backend/Generated";

@Component({
    name: "hardfork-countdown",
    template: require("./HardforkCountdown.html"),
})
export class HardforkCountdown extends Vue {
    @Lifecycle
    public created() {
        this.currentHeightActual = this.currentHeight;

        if(this.countdownDelta > 0) {
            this.countdownDeltaActual = this.countdownDelta;
        }

        this.updateProgress();
    }

    @Lifecycle
    public mounted(): void {
        poolService.notifications.on("onNewChainHeightNotification", this.onNewChainHeight);

        if(this.blockTimeSeconds) {
            const remainingBlocks = this.forkHeight - this.currentHeightActual;
            this.remainingSeconds = remainingBlocks * this.blockTimeSeconds;

            this.updateTimer = <any> setInterval(() => {
                this.remainingSeconds--;
            }, 1000);

            this.$watch("remainingSeconds", (n: number, o: number) => {
                this.updateRemainingTime();
            });
        }

        this.$watch("currentHeightActual", (n: number, o: number) => {
            this.updateProgress();
        });
    }

    @Prop public pool = p({
        type: String,
        required: true
    });

    @Prop public forkHeight = p({
        type: Number,
        required: true,
        default() {
            return 0;
        },
    });

    @Prop public currentHeight = p({
        type: Number,
        required: true,
        default() {
            return 0;
        },
    });

    @Prop public blockTimeSeconds = p({
        type: Number,
        required: false,
        default() {
            return 0;
        },
    });

    @Prop public countdownDelta = p({
        type: Number,
        required: false,
        default() {
            return 0;
        },
    });

    @Prop public preForkNote = p({
        type: String,
        required: true,
    });

    @Prop public postForkNote = p({
        type: String,
        required: true,
    });

    private updateTimer: number;

    public countdownDeltaActual = 1000;
    public currentHeightActual: number = 0;
    public forkProgress: number = 0;
    public progressTooltip: string = "";
    private remainingSeconds: number = 0;
    public timeRemaining: string = "";

    public onNewChainHeight(msg: INewChainHeightNotification) {
        this.currentHeightActual = msg.blockHeight;
    }

    private updateProgress() {
        this.forkProgress = Math.max(this.currentHeightActual - (this.forkHeight - this.countdownDeltaActual), 0) / this.countdownDeltaActual;
        this.progressTooltip = sprintf(this.$i18n.t("common.lblHardforkProgressTooltip").toString(), this.forkHeight - this.currentHeightActual);

        if(this.blockTimeSeconds) {
            const remainingBlocks = this.forkHeight - this.currentHeightActual;
            this.remainingSeconds = (remainingBlocks + 1) * this.blockTimeSeconds;
        }

        // stop updating once forkheight has been reached
        if(this.currentHeightActual > (this.forkHeight + 100) && this.updateTimer) {
            clearInterval(this.updateTimer);
            poolService.notifications.off("onNewChainHeightNotification", this.onNewChainHeight);
        }
    }

    private updateRemainingTime() {
        if(this.blockTimeSeconds) {
            var d = Math.floor(this.remainingSeconds / (3600*24));
            var h = Math.floor(this.remainingSeconds % (3600*24) / 3600);
            var m = Math.floor(this.remainingSeconds % 3600 / 60);
            var s = Math.floor(this.remainingSeconds % 60);

            this.timeRemaining = sprintf("%02d:%02d:%02d:%02d", d, h, m, s);
        }
    }
}
