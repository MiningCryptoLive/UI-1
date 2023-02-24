import { Vue, Component, Lifecycle } from "av-ts";
import * as toastr from "toastr";
import {Block, ILiveDashboardModel} from "../Backend/Generated";
import { poolService } from "../Services/PoolService";
import { IBlock, IBlockFoundNotification, IBlockUnlockedNotification, IBlockConfirmationProgressNotification, IPaymentNotification } from "../Backend/Generated";
import { utc } from "moment";
import { BlockStatus2 } from "../Backend/Generated";
import { groupArrayIntoMap } from "../Utils/Grouping";
import {IRuntimeEnvironment} from "../Backend/Extensions";

declare var runtimeEnvironment: IRuntimeEnvironment;
declare var modelInit: ILiveDashboardModel;

const enum OrderMode {
    Age = "age",
    Progress = "progress",
    Currency = "currency",
    Effort = "effort",
}

interface IBlockEx extends IBlock {
    id: string;
    symbol: string;
}

interface IChainStats {
    poolId: string;
    count: number;
}

@Component({
    template: require("./LiveDashboard.html"),
})
export class LiveDashboard extends Vue {
    @Lifecycle
    public async created(): Promise<any> {
        this.blocks = modelInit.blocks.map(x=> {
            let result = Block.fromJS(x) as any as IBlockEx;
            
            result.id = `${x.poolId}_${x.blockHeight}`;
            return result;
        });
        
        this.sort();
        this.updateStats();

        this.$watch("order", (n: string, o: string) => {
            this.sort();
        });
    }

    public blocks: IBlock[] = [];
    public chainStats: IChainStats[] = [];
    public poolIcons = modelInit.poolIcons;
    public poolSymbols = modelInit.poolSymbols;
    public poolNames = modelInit.poolNames;
    public order = OrderMode.Age;

    @Lifecycle
    public mounted(): void {
        // trigger for refreshing relative timestamps in template
        setInterval(() => this.$forceUpdate(), 10000);

        poolService.notifications.on("onBlockFound", this.onBlockFound);
        poolService.notifications.on("onBlockUnlockProgress", this.onBlockUnlockProgress);
        poolService.notifications.on("onBlockUnlocked", this.onBlockUnlocked);
        poolService.notifications.on("onPayment", this.onPayment);
    }

    public onBlockClick(block: IBlock) {
        if(block.infoLink) {
            window.open(block.infoLink);
        }
    }

    private sort() {
        switch(this.order) {
            case OrderMode.Age:
                this.blocks.sort((a, b)=> b.created.valueOf() - a.created.valueOf());
                break;

            case OrderMode.Progress:
                this.blocks.sort((a, b)=> (b.confirmationProgress || 0) - (a.confirmationProgress || 0));
                break;

            case OrderMode.Currency:
                this.blocks.sort((a, b)=> this.poolSymbols[a.poolId].localeCompare(this.poolSymbols[b.poolId]));
                break;

            case OrderMode.Effort:
                this.blocks.sort((a, b)=> (a.effort || 0) - (b.effort || 0));
                break;
        }
    }

    private updateStats() {
        const groupings = groupArrayIntoMap(this.blocks, x=> modelInit.poolNames[x.poolId]);

        this.chainStats = Array.from(groupings.keys()).map(x=> {
            const group = groupings.get(x);
            const first = group[0];

            return { poolId: first.poolId, count: group.length };
        }).sort((a, b)=> a.poolId.localeCompare(b.poolId));
    }

    private findBlockByPoolAndHeight(poolId: string, height: number): IBlockEx {
        for(let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];

            if(block.poolId === poolId && block.blockHeight === height) {
                return <IBlockEx> block;
            }
        }

        return null;
    }

    public async onBlockFound(msg: IBlockFoundNotification) {
        let block = this.findBlockByPoolAndHeight(msg.poolId, msg.blockHeight);

        // add it
        if(block == null) {
            block = {} as IBlockEx;
            block.id = `${msg.poolId}_${msg.blockHeight}`;
            block.blockHeight = msg.blockHeight;
            block.poolId = msg.poolId;
            block.confirmationProgress = 0;
            block.created = utc();
            block.miner = msg.miner;
            block.source = msg.source;
            block.symbol = msg.symbol;
            block.status = BlockStatus2.Pending;

            this.blocks.unshift(block);

            this.sort();
            this.updateStats();
        }
    }

    public async onBlockUnlocked(msg: IBlockUnlockedNotification) {
        const block = this.findBlockByPoolAndHeight(msg.poolId, msg.blockHeight);

        // remove it
        if(block != null) {
            const index = this.blocks.indexOf(block);
            this.blocks.splice(index, 1);

            this.updateStats();
        }
    }

    public onBlockUnlockProgress(msg: IBlockConfirmationProgressNotification) {
        const block = this.findBlockByPoolAndHeight(msg.poolId, msg.blockHeight);

        // update it
        if(block != null) {
            block.confirmationProgress = msg.progress;
            block.effort = msg.effort;
        }
    }

    public onPayment(msg: IPaymentNotification) {
        const body = `Paid ${Vue.filter("currency")(msg.amount, 4)} ${msg.symbol} from pool ${msg.poolId} to ${msg.recpientsCount} recipients`;
        toastr.success(body, "Payment", { timeOut: 5000, progressBar: true });
    }
}
