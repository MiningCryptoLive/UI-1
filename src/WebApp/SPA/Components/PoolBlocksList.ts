import { Vue, Component, Prop, Watch, Lifecycle, p } from "av-ts";

import {PagerComponent} from "./Pager";
import {SpinnerComponent} from "./Spinner";

import {IAggregatedPoolStats, IBlock, IPayment, IBlockFoundNotification, IBlockConfirmationProgressNotification, IBlockUnlockedNotification} from "../Backend/Generated";
import {poolService} from "../Services/PoolService";
import { IPoolDetailsModel } from "../Backend/Generated";

declare var modelInit: IPoolDetailsModel;

@Component({
    template: require("./PoolBlocksList.html"),
    components: {
        "list-pager": PagerComponent,
        "spinner": SpinnerComponent,
    },
})
export class PoolBlocksList extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
    }

    public blocks = [] as IBlock[];
    public isBusy = false;

    // paging
    public currentPage: number = 0;
    public pageCount = 0;
    public pageSize = 15;

    @Lifecycle
    public async mounted() {
        await this.loadCurrentPage();

        // trigger refresh of current page
        // setInterval(async () => await this.loadCurrentPage(), 60 * 1000 * 10);

        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 60 * 1000);

        poolService.notifications.on("onBlockFound", this.onBlockFound);
        poolService.notifications.on("onBlockUnlockProgress", this.onBlockUnlockProgress);
        poolService.notifications.on("onBlockUnlocked", this.onBlockUnlocked);
    }

    private findBlockByHeight(height: number): IBlock {
        for(let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];

            if(block.blockHeight === height) {
                return block;
            }
        }

        return null;
    }

    public async onPagedChanged(page: number) {
        this.currentPage = page;

        await this.loadCurrentPage();
    }

    private resetCurrentPage() {
        this.currentPage = 0;
    }

    private async loadCurrentPage() {
        const response = await poolService.listBlocks(modelInit.poolId, this.currentPage, this.pageSize);
        this.blocks = response.result;
        this.pageCount = response.pageCount;
    }

    public async onPagePrev() {
        this.currentPage--;
        await this.loadCurrentPage();
    }

    public async onPageNext() {
        this.currentPage++;
        await this.loadCurrentPage();
    }

    public formatTimestampTooltip(block: IBlock) {
        if(block.miner == null) {
          // for imported blocks
          return block.created.local().toString();
        }

        let result = this.$i18n.t("common.lblBlockFinder") + block.miner;

        if (block.source) {
            result += " [" + block.source.toUpperCase() + "]";
        }

        result += " - " + block.created.local().toString();

        return result;
    }

    public async onBlockFound(msg: IBlockFoundNotification) {
        await this.loadCurrentPage();
    }

    public async onBlockUnlocked(msg: IBlockUnlockedNotification) {
        const block = this.findBlockByHeight(msg.blockHeight);

        if(block != null) {
            block.status = msg.status;
            block.reward = msg.reward;
            block.effort = msg.effort;
            block.confirmationProgress = 1;
        }
    }

    public onBlockUnlockProgress(msg: IBlockConfirmationProgressNotification) {
        const block = this.findBlockByHeight(msg.blockHeight);

        if(block != null) {
            block.confirmationProgress = msg.progress;
            block.effort = msg.effort;
        }
    }
}
